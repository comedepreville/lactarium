"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CircularGauge } from "@/components/circular-gauge";
import { StatusBanner } from "@/components/status-banner";
import type { DashboardAdvice } from "@/lib/types";
import { formatParisTime, TARGET_ML_24H } from "@/lib/time";
import { cn } from "@/lib/utils";

export function DashboardPanel({
  advice,
  hideStatusBanner = false,
}: {
  advice: DashboardAdvice;
  /** Quand l’alerte critique est déjà affichée en haut de page */
  hideStatusBanner?: boolean;
}) {
  const nextAt = advice.nextSuggestedAt;
  const overdue = advice.cadenceOverdue || (nextAt ? isOverdue(nextAt) : false);

  const delayLabel =
    advice.remainingTiragesEstimate === 0
      ? "Objectif ok"
      : !nextAt
        ? "—"
        : overdue
          ? "Dès que possible"
          : `dans ${formatDistanceToNow(parseISO(nextAt), { locale: fr })}`;

  const clockLabel =
    nextAt && !overdue ? `à ${formatParisTime(nextAt)}` : undefined;

  const avgLabel = advice.avgMlLast3 > 0 ? `${advice.avgMlLast3}` : "—";

  return (
    <section
      className="animate-rise space-y-6"
      style={{ animationDelay: "80ms" }}
      aria-label="Résumé"
    >
      <div className="surface-card rounded-[2rem] px-4 py-8 sm:px-6">
        <CircularGauge
          value={advice.drawnMlToday}
          max={advice.targetMl || TARGET_ML_24H}
          label="aujourd’hui"
        />

        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric
            label="Tirages"
            value={`${advice.tirageCountToday}`}
            hint="aujourd’hui"
          />
          <Metric
            label="Restant"
            value={`${advice.remainingMl}`}
            hint="ml"
          />
          <Metric label="Moyenne" value={avgLabel} hint="ml / 3 derniers" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric
          label="Prochain tirage"
          value={delayLabel}
          hint={
            clockLabel ||
            (overdue
              ? "échéance dépassée"
              : advice.intervalCappedHigh
                ? "plafond 5 h"
                : advice.remainingTiragesEstimate === 0
                  ? "plus de tirage nécessaire"
                  : undefined)
          }
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

      {!hideStatusBanner && (
        <StatusBanner status={advice.status} message={advice.message} />
      )}
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
