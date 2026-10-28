"use client";

import Link from "next/link";
import type { DaySummary } from "@/lib/types";
import { formatGap, formatParisTime } from "@/lib/time";
import { Pencil } from "lucide-react";

export function DayList({
  days,
  showEdit = false,
  emptyMessage = "Aucun tirage pour le moment.",
}: {
  days: DaySummary[];
  showEdit?: boolean;
  emptyMessage?: string;
}) {
  if (days.length === 0) {
    return (
      <p className="surface-card rounded-[2rem] px-5 py-10 text-center text-sm text-[var(--ink-muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day, index) => (
        <article
          key={day.dateKey}
          className="surface-card animate-rise overflow-hidden rounded-[2rem]"
          style={{ animationDelay: `${120 + index * 60}ms` }}
        >
          <header className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h3 className="font-body text-2xl font-medium capitalize text-[var(--ink)]">
                {day.label}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                {day.count} tirage{day.count > 1 ? "s" : ""}
              </p>
            </div>
            <p className="font-display text-2xl font-medium tabular-nums text-[var(--rose-deep)]">
              {day.totalMl}
              <span className="ml-1 text-sm font-normal text-[var(--ink-muted)]">
                ml
              </span>
            </p>
          </header>
          <ul className="divide-y divide-[var(--line)]/80 px-2 pb-2">
            {day.tirages.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-3 rounded-[1.25rem] px-3 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium tabular-nums text-[var(--ink)]">
                    {formatParisTime(t.datetime)}
                    <span className="mx-1.5 text-[var(--rose-mist)]">·</span>
                    {t.quantityMl} ml
                    {t.duration > 0 ? (
                      <>
                        <span className="mx-1.5 text-[var(--rose-mist)]">·</span>
                        {t.duration} min
                      </>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                    Écart précédent : {formatGap(t.gapMinutes)}
                  </p>
                  {t.notes ? (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug text-[var(--ink)]/80">
                      {t.notes}
                    </p>
                  ) : null}
                </div>
                {showEdit && (
                  <Link
                    href={`/ajouter?id=${t.id}`}
                    aria-label="Modifier le tirage"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:bg-[var(--blush)] hover:text-[var(--rose-deep)]"
                  >
                    <Pencil className="size-4" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
