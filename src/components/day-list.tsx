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
      <p className="rounded-xl bg-white/50 px-4 py-8 text-center text-sm text-[var(--ink-muted)] ring-1 ring-[var(--line)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day, index) => (
        <article
          key={day.dateKey}
          className="animate-rise overflow-hidden rounded-2xl bg-white/60 ring-1 ring-[var(--line)]"
          style={{ animationDelay: `${120 + index * 60}ms` }}
        >
          <header className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-lg capitalize text-[var(--ink)]">
                {day.label}
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                {day.count} tirage{day.count > 1 ? "s" : ""}
              </p>
            </div>
            <p className="font-[family-name:var(--font-display)] text-xl text-[var(--teal-deep)]">
              {day.totalMl}{" "}
              <span className="text-sm font-sans text-[var(--ink-muted)]">
                ml
              </span>
            </p>
          </header>
          <ul className="divide-y divide-[var(--line)]">
            {day.tirages.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[var(--ink)]">
                    {formatParisTime(t.datetime)} · {t.quantityMl} ml
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Écart précédent : {formatGap(t.gapMinutes)}
                  </p>
                </div>
                {showEdit && (
                  <Link
                    href={`/ajouter?id=${t.id}`}
                    aria-label="Modifier le tirage"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--ink-muted)] transition-colors hover:bg-[var(--mist)] hover:text-[var(--teal-deep)]"
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
