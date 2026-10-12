import Link from "next/link";
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
      <header className="animate-rise flex items-end justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Calendrier
        </h1>
        <Link
          href="/ajouter"
          className="text-sm font-medium text-[var(--teal-deep)] underline-offset-4 hover:underline"
        >
          + Ajouter
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
