import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max: number;
  label?: string;
  unit?: string;
  className?: string;
  size?: number;
};

export function CircularGauge({
  value,
  max,
  label = "sur 24 h",
  unit = "ml",
  className,
  size = 220,
}: Props) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, max > 0 ? value / max : 0));
  const offset = circumference * (1 - progress);

  return (
    <div
      className={cn(
        "relative mx-auto flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
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
          className="gauge-progress transition-[stroke-dashoffset] duration-700 ease-out"
          style={
            {
              "--gauge-circumference": circumference,
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-body text-[2.75rem] font-medium leading-none tracking-tight text-[var(--ink)] tabular-nums">
          {value}
        </p>
        <p className="mt-1 font-body text-sm text-[var(--ink-muted)]">
          / {max} {unit}
        </p>
        {label ? (
          <p className="mt-2 font-display text-base text-[var(--rose-deep)]">
            {label}
          </p>
        ) : null}
      </div>
    </div>
  );
}
