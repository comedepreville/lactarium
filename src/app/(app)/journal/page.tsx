import { AddJournalFab } from "@/components/add-journal-fab";
import { DeveloperCredit } from "@/components/developer-credit";
import { JournalTimeline } from "@/components/journal-timeline";
import { groupJournalByDay } from "@/lib/journal";
import { listJournal } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const entries = await listJournal();
  const days = groupJournalByDay(entries);

  return (
    <div className="space-y-6">
      <header className="animate-rise space-y-2 px-1">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Souvenirs
        </p>
        <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
          Journal de vie
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
          Les petits et grands moments, jour après jour.
        </p>
      </header>

      <JournalTimeline
        days={days}
        emptyMessage="Aucun événement pour le moment. Ajoutez le premier souvenir."
      />

      <DeveloperCredit />

      <AddJournalFab />
    </div>
  );
}
