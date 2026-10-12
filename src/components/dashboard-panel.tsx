"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { parseISO } from "date-fns";
import type { DashboardAdvice } from "@/lib/types";
import { formatParisTime, TARGET_ML_24H } from "@/lib/time";
import { cn } from "@/lib/utils";

const statusStyles = {
  ok: "border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[var(--teal-deep)]",
  behind:
    "border-amber-500/30 bg-amber-50 text-amber-900",
  ahead:
    "border-rose-400/30 bg-rose-50 text-rose-900",
  overdue:
    "border-rose-500/40 bg-rose-50 text-rose-950",
};

export function DashboardPanel({ advice }: { advice: DashboardAdvice }) {
  const progress = Math.min(100, (advice.drawnMl24h / TARGET_ML_24H) * 100);

  const deadlineLabel = advice.nextDeadlineAt
    ? isOverdue(advice.nextDeadlineAt)
      ? `Dépassé ${formatDistanceToNow(parseISO(advice.nextDeadlineAt), { locale: fr, addSuffix: false })}`
      : `dans ${formatDistanceToNow(parseISO(advice.nextDeadlineAt), { locale: fr })}`
    : "—";

  return (
    <section
      className="animate-rise space-y-5"
      style={{ animationDelay: "80ms" }}
      aria-label="Résumé de la journée"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--ink-muted)]">Sur 24 h glissantes</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
            {advice.drawnMl24h}
            <span className="ml-1 text-lg text-[var(--ink-muted)]">
              / {advice.targetMl} ml
            </span>
          </p>
        </div>
        <div className="text-right text-sm text-[var(--ink-muted)]">
          <p className="font-medium text-[var(--ink)]">
            {advice.tirageCount24h} tirage
            {advice.tirageCount24h !== 1 ? "s" : ""}
          </p>
          <p>~{advice.recommendedTiragesPerDay}/j conseillés</p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/70">
        <div
          className="h-full rounded-full bg-[var(--teal)] transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="Restant"
          value={`${advice.remainingMl} ml`}
          hint={`≈ ${advice.remainingTiragesEstimate} tirage${advice.remainingTiragesEstimate > 1 ? "s" : ""}`}
        />
        <Metric
          label="Prochain délai"
          value={deadlineLabel}
          hint={
            advice.lastTirageAt
              ? `Max ${advice.maxGapHours} h (${advice.isNightWindow ? "nuit" : "jour"})`
              : "Après le 1er tirage"
          }
        />
        <Metric
          label="Moyenne / tirage"
          value={
            advice.avgMlPerTirage48h > 0
              ? `${advice.avgMlPerTirage48h} ml`
              : "—"
          }
          hint="sur 48 h glissantes"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {advice.lastTirageAt && (
        <p className="text-sm text-[var(--ink-muted)]">
          Dernier tirage à {formatParisTime(advice.lastTirageAt)}
        </p>
      )}

      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm leading-relaxed",
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
  className,
}: {
  label: string;
  value: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/55 px-3 py-3 ring-1 ring-[var(--line)]",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{hint}</p>
    </div>
  );
}

function isOverdue(iso: string): boolean {
  return parseISO(iso).getTime() < Date.now();
}
