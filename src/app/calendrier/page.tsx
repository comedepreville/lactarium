import Link from "next/link";
import { DayList } from "@/components/day-list";
import { DeveloperCredit } from "@/components/developer-credit";
import { groupByDay } from "@/lib/dashboard";
import { listTirages } from "@/lib/storage";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const tirages = await listTirages();
  const days = groupByDay(tirages);

  return (
    <div className="space-y-6">
      <header className="animate-rise flex items-end justify-between gap-3 px-1">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Historique
          </p>
          <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
            Calendrier
          </h1>
        </div>
        <Link
          href="/ajouter"
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--rose-dust)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--rose-deep)]"
        >
          <Plus className="size-4" />
          Ajouter
        </Link>
      </header>

      <DayList
        days={days}
        showEdit
        emptyMessage="Aucun tirage pour le moment."
      />

      <DeveloperCredit />
    </div>
  );
}
