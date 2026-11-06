"use client";

import { parseISO } from "date-fns";
import { CircularGauge } from "@/components/circular-gauge";
import type { DashboardAdvice, UpcomingTirage } from "@/lib/types";
import {
  formatParisDateShort,
  formatParisTime,
  parisDateKey,
  startOfNextParisDay,
  TARGET_ML_24H,
} from "@/lib/time";
import { cn } from "@/lib/utils";

export function DashboardPanel({ advice }: { advice: DashboardAdvice }) {
  const avgLabel = advice.avgMlLast2 > 0 ? `${advice.avgMlLast2}` : "—";

  return (
    <section aria-label="Résumé" className="space-y-4">
      <div
        className="surface-card animate-rise rounded-[2rem] px-4 py-7 sm:px-6"
        style={{ animationDelay: "40ms" }}
      >
        <CircularGauge
          value={advice.drawnMlToday}
          max={advice.targetMl || TARGET_ML_24H}
          label="aujourd’hui"
        />
      </div>

      <UpcomingCard upcoming={advice.upcoming} />

      <ul
        className="surface-card animate-rise grid grid-cols-3 gap-2 rounded-[2rem] p-2"
        style={{ animationDelay: "120ms" }}
        aria-label="Indicateurs du jour"
      >
        <Insight
          label="Tirages"
          value={`${advice.tirageCountToday}`}
          hint="aujourd’hui"
        />
        <Insight
          label="Restants"
          value={`${advice.remainingTiragesEstimate}`}
          hint="avant minuit"
        />
        <Insight
          label="Moyenne"
          value={avgLabel}
          unit={advice.avgMlLast2 > 0 ? "ml" : undefined}
          hint="2 derniers"
        />
      </ul>
    </section>
  );
}

function UpcomingCard({ upcoming }: { upcoming: UpcomingTirage[] }) {
  return (
    <section
      className="surface-card animate-rise rounded-[2rem] px-5 py-5 sm:px-6"
      style={{ animationDelay: "80ms" }}
      aria-label="Prochains tirages"
    >
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        Prochains tirages
      </p>

      {upcoming.length === 0 ? (
        <p className="mt-3 font-display text-[1.65rem] leading-none text-[var(--rose-deep)]">
          Objectif atteint
        </p>
      ) : (
        <ol className="relative mt-4">
          {upcoming.length > 1 ? (
            <span
              aria-hidden
              className="absolute bottom-2 left-[5px] top-2 w-px -translate-x-1/2 bg-[var(--rose-mist)]"
            />
          ) : null}
          {upcoming.map((item, index) => (
            <UpcomingRow
              key={`${item.at}-${index}`}
              item={item}
              primary={index === 0}
              last={index === upcoming.length - 1}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function UpcomingRow({
  item,
  primary,
  last,
}: {
  item: UpcomingTirage;
  primary: boolean;
  last: boolean;
}) {
  const now = new Date();
  const time = formatParisTime(item.at);
  const day = dayQualifier(item.at, now);
  const lead = item.asap ? null : formatLead(item.at, now);

  return (
    <li
      className={cn(
        "relative flex gap-4",
        primary ? "pb-5" : "pb-3.5",
        last && "pb-0",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative z-10 mt-[0.45rem] size-2.5 shrink-0 rounded-full ring-4 ring-[var(--surface)]",
          primary ? "bg-[var(--rose-dust)]" : "bg-[var(--rose-mist)]",
        )}
      />
      <div className="min-w-0" suppressHydrationWarning>
        {item.asap ? (
          <p className="font-display text-[1.7rem] leading-[1.05] tracking-tight text-[var(--rose-deep)]">
            Dès que possible
            <span className="sr-only">, échéance dépassée</span>
          </p>
        ) : primary ? (
          <>
            <p className="font-display text-[2.35rem] leading-none tracking-tight text-[var(--rose-deep)] tabular-nums">
              {time}
            </p>
            {lead ? (
              <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
                {day ? `${day} · ${lead}` : lead}
              </p>
            ) : null}
          </>
        ) : (
          <p className="font-body text-xl font-medium leading-none tabular-nums text-[var(--ink)]">
            {day ? (
              <span className="mr-2 text-sm font-normal text-[var(--ink-muted)]">
                {day}
              </span>
            ) : null}
            {time}
          </p>
        )}
      </div>
    </li>
  );
}

function Insight({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint: string;
}) {
  return (
    <li className="rounded-[1.35rem] bg-[var(--blush)]/75 px-1 py-3.5 text-center">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1.5 font-body text-[1.65rem] font-medium leading-none tabular-nums text-[var(--ink)]">
        {value}
        {unit ? (
          <span className="ml-0.5 text-xs font-normal tracking-normal text-[var(--ink-muted)]">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="mt-1.5 text-[0.7rem] leading-tight text-[var(--ink-muted)]">
        {hint}
      </p>
    </li>
  );
}

function formatLead(iso: string, now: Date): string {
  const mins = Math.round((parseISO(iso).getTime() - now.getTime()) / 60000);
  if (mins <= 1) return "maintenant";
  if (mins < 60) return `dans ${mins} min`;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (minutes === 0) return `dans ${hours} h`;
  return `dans ${hours} h ${minutes.toString().padStart(2, "0")}`;
}

function dayQualifier(iso: string, now: Date): string | null {
  const key = parisDateKey(iso);
  if (key === parisDateKey(now)) return null;
  if (key === parisDateKey(startOfNextParisDay(now))) return "demain";
  return formatParisDateShort(iso);
}
