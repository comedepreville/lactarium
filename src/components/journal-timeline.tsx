"use client";

import Link from "next/link";
import type { JournalDaySummary } from "@/lib/types";
import { formatParisTime } from "@/lib/time";
import { Pencil } from "lucide-react";

export function JournalTimeline({
  days,
  emptyMessage = "Aucun événement pour le moment.",
}: {
  days: JournalDaySummary[];
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
    <div className="space-y-6">
      {days.map((day, index) => (
        <section
          key={day.dateKey}
          className="animate-rise"
          style={{ animationDelay: `${120 + index * 60}ms` }}
        >
          <header className="mb-3 px-1">
            <h2 className="font-display text-2xl capitalize text-[var(--ink)]">
              {day.label}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              {day.count} événement{day.count > 1 ? "s" : ""}
            </p>
          </header>

          <ol className="relative space-y-0 pl-2">
            <span
              aria-hidden
              className="absolute bottom-3 left-[1.15rem] top-3 w-px bg-[var(--rose-mist)]"
            />
            {day.entries.map((entry) => (
              <li key={entry.id} className="relative flex gap-3 py-3">
                <span
                  aria-hidden
                  className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-[var(--rose-dust)] ring-4 ring-[var(--cream)]"
                />
                <Link
                  href={`/journal/ajouter?id=${entry.id}`}
                  className="group min-w-0 flex-1 rounded-[1.25rem] px-2 py-1 transition-colors hover:bg-[var(--blush)]/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium tabular-nums text-[var(--ink)]">
                      {formatParisTime(entry.datetime)}
                    </p>
                    <span
                      aria-label="Modifier l’événement"
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors group-hover:bg-[var(--blush)] group-hover:text-[var(--rose-deep)]"
                    >
                      <Pencil className="size-4" />
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-muted)]">
                    {entry.text}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
