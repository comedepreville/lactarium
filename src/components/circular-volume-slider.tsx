"use client";

import {
  useCallback,
  useId,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  className?: string;
  "aria-labelledby"?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function snap(n: number, min: number, max: number, step: number) {
  const snapped = Math.round(n / step) * step;
  return clamp(snapped, min, max);
}

/** Angle in radians from pointer relative to circle center; 0 at top, clockwise. */
function pointerToClockwiseAngle(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  // atan2: 0 at right, CCW — convert to 0 at top, clockwise
  const fromRightCcw = Math.atan2(dy, dx);
  return (fromRightCcw + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
}

function angleToValue(
  angle: number,
  min: number,
  max: number,
  step: number,
): number {
  const ratio = angle / (Math.PI * 2);
  return snap(min + ratio * (max - min), min, max, step);
}

function valueToAngle(value: number, min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 0;
  return ((value - min) / range) * Math.PI * 2;
}

export function CircularVolumeSlider({
  value,
  onChange,
  min = 0,
  max = 300,
  step = 10,
  size = 220,
  className,
  "aria-labelledby": ariaLabelledBy,
}: Props) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastAngle = useRef<number | null>(null);

  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > min ? (value - min) / (max - min) : 0;
  const offset = circumference * (1 - progress);
  const angle = valueToAngle(value, min, max);
  const thumbX = size / 2 + radius * Math.sin(angle);
  const thumbY = size / 2 - radius * Math.cos(angle);

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = svgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let nextAngle = pointerToClockwiseAngle(clientX, clientY, rect);
      const prev = lastAngle.current;
      if (prev !== null) {
        const delta = nextAngle - prev;
        // Empêche le saut 0 ↔ max au passage du sommet pendant le drag.
        if (delta > Math.PI) nextAngle = 0;
        else if (delta < -Math.PI) nextAngle = Math.PI * 2 - 1e-6;
      }
      lastAngle.current = nextAngle;
      onChange(angleToValue(nextAngle, min, max, step));
    },
    [max, min, onChange, step],
  );

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    dragging.current = true;
    lastAngle.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    setFromPointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = false;
    lastAngle.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + step;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - step;
    if (e.key === "Home") next = min;
    if (e.key === "End") next = max;
    if (e.key === "PageUp") next = value + step * 5;
    if (e.key === "PageDown") next = value - step * 5;
    if (next === null) return;
    e.preventDefault();
    onChange(snap(next, min, max, step));
  };

  return (
    <div
      className={cn(
        "relative mx-auto flex items-center justify-center touch-none select-none",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        ref={svgRef}
        id={id}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="cursor-pointer"
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} millilitres`}
        aria-labelledby={ariaLabelledBy}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--blush)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--rose-dust)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-75 ease-out"
        />
        <circle
          cx={thumbX}
          cy={thumbY}
          r={stroke / 2 + 4}
          fill="var(--surface)"
          stroke="var(--rose-deep)"
          strokeWidth={2}
          className="pointer-events-none"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[2.75rem] font-medium leading-none tracking-tight text-[var(--ink)] tabular-nums">
          {value}
        </p>
        <p className="mt-1 font-body text-sm text-[var(--ink-muted)]">ml</p>
      </div>
    </div>
  );
}
