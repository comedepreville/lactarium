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
      <header className="animate-rise space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--teal-deep)]">
          Lactarium
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Calendrier
        </h1>
        <p className="text-[var(--ink-muted)]">
          Tous les jours enregistrés — modifiez un tirage au besoin.
        </p>
      </header>

      <div className="flex justify-end">
        <Link
          href="/ajouter"
          className="text-sm font-medium text-[var(--teal-deep)] underline-offset-4 hover:underline"
        >
          + Ajouter
        </Link>
      </div>

      <DayList
        days={days}
        showEdit
        emptyMessage="Aucun tirage en base. Ajoutez le premier depuis Accueil."
      />

      <DeveloperCredit />
    </div>
  );
}
