"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CircularGauge } from "@/components/circular-gauge";
import type { DashboardAdvice } from "@/lib/types";
import { formatParisTime, TARGET_ML_24H } from "@/lib/time";
import { cn } from "@/lib/utils";

const statusStyles = {
  ok: "bg-[var(--blush)] text-[var(--rose-deep)]",
  behind: "bg-[#f7ebe0] text-[#8a5a3c]",
  ahead: "bg-[#f6e4e8] text-[var(--rose-deep)]",
  overdue: "bg-[#f3ddd8] text-[#7a3f3d]",
};

export function DashboardPanel({ advice }: { advice: DashboardAdvice }) {
  const nextAt = advice.nextSuggestedAt;
  const overdue = nextAt ? isOverdue(nextAt) : false;

  const delayLabel = !nextAt
    ? "—"
    : overdue
      ? "Maintenant"
      : `dans ${formatDistanceToNow(parseISO(nextAt), { locale: fr })}`;

  const clockLabel = nextAt ? `à ${formatParisTime(nextAt)}` : "";

  const avgLabel =
    advice.avgMlPerTirage48h > 0
      ? `${advice.avgMlPerTirage48h} ml`
      : advice.avgMlPerTirage24h > 0
        ? `${advice.avgMlPerTirage24h} ml`
        : "—";

  return (
    <section
      className="animate-rise space-y-6"
      style={{ animationDelay: "80ms" }}
      aria-label="Résumé"
    >
      <div className="surface-card rounded-[2rem] px-4 py-8 sm:px-6">
        <CircularGauge
          value={advice.drawnMl24h}
          max={advice.targetMl || TARGET_ML_24H}
          label="sur 24 h"
        />

        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric
            label="Tirages"
            value={`${advice.tirageCount24h}`}
            hint="sur 24 h"
          />
          <Metric
            label="Restant"
            value={`${advice.remainingMl}`}
            hint="ml"
          />
          <Metric label="Moyenne" value={avgLabel.replace(" ml", "")} hint="ml" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric
          label="Prochain tirage"
          value={delayLabel}
          hint={clockLabel}
          large
        />
        <Metric
          label="Encore"
          value={`${advice.remainingTiragesEstimate}`}
          hint={`tirage${advice.remainingTiragesEstimate > 1 ? "s" : ""} estimé${advice.remainingTiragesEstimate > 1 ? "s" : ""}`}
          large
        />
      </div>

      {advice.lastTirageAt && (
        <p className="text-center text-sm text-[var(--ink-muted)]">
          Dernier tirage à {formatParisTime(advice.lastTirageAt)}
        </p>
      )}

      <div
        className={cn(
          "rounded-full px-5 py-3.5 text-center text-sm leading-relaxed",
          statusStyles[advice.status],
        )}
      >
        {advice.message}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  large = false,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  large?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] bg-[var(--blush)]/70 px-3 py-3 text-center",
        large && "surface-card bg-[var(--surface)] px-4 py-4 text-left",
        className,
      )}
    >
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-body font-medium tabular-nums text-[var(--ink)]",
          large ? "text-2xl" : "text-xl",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

function isOverdue(iso: string): boolean {
  return parseISO(iso).getTime() < Date.now();
}
