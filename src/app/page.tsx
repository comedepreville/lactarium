import Link from "next/link";
import { AddTirageFab } from "@/components/add-tirage-fab";
import { DashboardPanel } from "@/components/dashboard-panel";
import { DayList } from "@/components/day-list";
import { DeveloperCredit } from "@/components/developer-credit";
import { computeDashboard, lastNDays } from "@/lib/dashboard";
import { listTirages } from "@/lib/storage";
import { nowParis } from "@/lib/time";

export const dynamic = "force-dynamic";

function greetingLabel() {
  const hour = nowParis().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function HomePage() {
  const tirages = await listTirages();
  const advice = computeDashboard(tirages);
  const recentDays = lastNDays(tirages, 3);
  const greeting = greetingLabel();

  return (
    <div className="space-y-8">
      <section className="animate-rise relative space-y-2 pt-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {greeting}
        </p>
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-[var(--rose-deep)] sm:text-6xl">
          Lactae
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
          Suivi doux de vos tirages — objectif {advice.targetMl} ml aujourd’hui.
        </p>
      </section>

      <DashboardPanel advice={advice} />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 px-1">
          <h2 className="font-display text-3xl text-[var(--ink)]">
            Trois derniers jours
          </h2>
          <Link
            href="/calendrier"
            className="text-sm font-medium text-[var(--rose-deep)] underline-offset-4 hover:underline"
          >
            Voir plus
          </Link>
        </div>
        <DayList days={recentDays} />
      </section>

      <DeveloperCredit />

      <AddTirageFab />
    </div>
  );
}
