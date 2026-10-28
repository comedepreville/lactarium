"use client";

import {
  useCallback,
  useId,
  useMemo,
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
  disabled?: boolean;
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

/** Angle in radians from pointer; 0 at top, clockwise. */
function pointerToClockwiseAngle(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const fromRightCcw = Math.atan2(dy, dx);
  return (fromRightCcw + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
}

/**
 * Crans espacés sur un arc ~340° (petit gap en haut) pour que
 * min et max ne se superposent pas.
 */
const ARC_SPAN = Math.PI * 2 * 0.92;

function buildTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  for (let t = min; t <= max; t += step) ticks.push(t);
  return ticks;
}

function valueToAngle(value: number, ticks: number[]): number {
  if (ticks.length <= 1) return 0;
  const snapped = ticks.reduce((best, t) =>
    Math.abs(t - value) < Math.abs(best - value) ? t : best,
  );
  const index = ticks.indexOf(snapped);
  return (index / (ticks.length - 1)) * ARC_SPAN;
}

function angleToValue(angle: number, ticks: number[]): number {
  if (ticks.length <= 1) return ticks[0] ?? 0;
  const clamped = clamp(angle, 0, ARC_SPAN);
  const ratio = clamped / ARC_SPAN;
  const index = Math.round(ratio * (ticks.length - 1));
  return ticks[clamp(index, 0, ticks.length - 1)]!;
}

export function CircularDurationSlider({
  value,
  onChange,
  min = 5,
  max = 30,
  step = 5,
  size = 280,
  disabled = false,
  className,
  "aria-labelledby": ariaLabelledBy,
}: Props) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastAngle = useRef<number | null>(null);

  const ticks = useMemo(() => buildTicks(min, max, step), [min, max, step]);
  const stroke = 16;
  const radius = (size - stroke) / 2 - 22;
  const circumference = 2 * Math.PI * radius;
  const progress =
    ticks.length > 1
      ? ticks.indexOf(
          ticks.reduce((best, t) =>
            Math.abs(t - value) < Math.abs(best - value) ? t : best,
          ),
        ) /
        (ticks.length - 1)
      : 0;
  const arcLength = circumference * (ARC_SPAN / (Math.PI * 2));
  const offset = arcLength * (1 - progress) + (circumference - arcLength);
  const angle = valueToAngle(value, ticks);
  const thumbX = size / 2 + radius * Math.sin(angle);
  const thumbY = size / 2 - radius * Math.cos(angle);

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      const el = svgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let nextAngle = pointerToClockwiseAngle(clientX, clientY, rect);
      // Borne dans l’arc utile (évite le saut via le gap du haut).
      if (nextAngle > ARC_SPAN + (Math.PI * 2 - ARC_SPAN) / 2) {
        nextAngle = 0;
      } else if (nextAngle > ARC_SPAN) {
        nextAngle = ARC_SPAN;
      }
      lastAngle.current = nextAngle;
      onChange(angleToValue(nextAngle, ticks));
    },
    [disabled, onChange, ticks],
  );

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
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
    if (disabled) return;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + step;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - step;
    if (e.key === "Home") next = min;
    if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    onChange(snap(next, min, max, step));
  };

  return (
    <div
      className={cn(
        "relative mx-auto flex items-center justify-center touch-none select-none",
        disabled && "opacity-60",
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
        className={cn(disabled ? "cursor-default" : "cursor-pointer")}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} minutes`}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={disabled || undefined}
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
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
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
          className="transition-[stroke-dashoffset] duration-100 ease-out"
        />
        {ticks.map((tick) => {
          const a = valueToAngle(tick, ticks);
          const inner = radius - stroke / 2 - 2;
          const outer = radius + stroke / 2 + 6;
          const x1 = size / 2 + inner * Math.sin(a);
          const y1 = size / 2 - inner * Math.cos(a);
          const x2 = size / 2 + outer * Math.sin(a);
          const y2 = size / 2 - outer * Math.cos(a);
          const labelR = radius + stroke / 2 + 18;
          const lx = size / 2 + labelR * Math.sin(a);
          const ly = size / 2 - labelR * Math.cos(a);
          const active = tick === value;
          return (
            <g key={tick} className="pointer-events-none">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={active ? "var(--rose-deep)" : "var(--rose-mist)"}
                strokeWidth={active ? 3 : 2}
                strokeLinecap="round"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={active ? "var(--rose-deep)" : "var(--ink-muted)"}
                fontSize={11}
                fontFamily="var(--font-body), sans-serif"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <circle
          cx={thumbX}
          cy={thumbY}
          r={stroke / 2 + 5}
          fill="var(--surface)"
          stroke="var(--rose-deep)"
          strokeWidth={2.5}
          className="pointer-events-none"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
        <p className="font-display text-[3.25rem] font-medium leading-none tracking-tight text-[var(--ink)] tabular-nums">
          {value}
        </p>
        <p className="mt-1.5 font-body text-sm text-[var(--ink-muted)]">min</p>
      </div>
    </div>
  );
}
