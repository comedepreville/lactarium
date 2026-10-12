import { AddTirageFab } from "@/components/add-tirage-fab";
import { DayList } from "@/components/day-list";
import { DeveloperCredit } from "@/components/developer-credit";
import { groupByDay } from "@/lib/dashboard";
import { listTirages } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const tirages = await listTirages();
  const days = groupByDay(tirages);

  return (
    <div className="space-y-6">
      <header className="animate-rise space-y-2 px-1">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Historique
        </p>
        <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
          Calendrier
        </h1>
      </header>

      <DayList
        days={days}
        showEdit
        emptyMessage="Aucun tirage pour le moment."
      />

      <DeveloperCredit />

      <AddTirageFab />
    </div>
  );
}
