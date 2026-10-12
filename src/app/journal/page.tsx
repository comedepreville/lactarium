import Link from "next/link";
import { DeveloperCredit } from "@/components/developer-credit";
import { JournalTimeline } from "@/components/journal-timeline";
import { groupJournalByDay } from "@/lib/journal";
import { listJournal } from "@/lib/storage";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const entries = await listJournal();
  const days = groupJournalByDay(entries);

  return (
    <div className="space-y-6">
      <header className="animate-rise flex items-end justify-between gap-3 px-1">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Souvenirs
          </p>
          <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
            Journal de vie
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
            Les petits et grands moments, jour après jour.
          </p>
        </div>
        <Link
          href="/journal/ajouter"
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--rose-dust)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--rose-deep)]"
        >
          <Plus className="size-4" />
          Ajouter
        </Link>
      </header>

      <JournalTimeline
        days={days}
        emptyMessage="Aucun événement pour le moment. Ajoutez le premier souvenir."
      />

      <DeveloperCredit />
    </div>
  );
}
