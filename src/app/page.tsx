import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard-panel";
import { DayList } from "@/components/day-list";
import { DeveloperCredit } from "@/components/developer-credit";
import { computeDashboard, lastNDays } from "@/lib/dashboard";
import { listTirages } from "@/lib/storage";
import { nowParis } from "@/lib/time";
import { Plus } from "lucide-react";

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
      <section className="animate-rise relative space-y-5 pt-2">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {greeting}
          </p>
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-[var(--rose-deep)] sm:text-6xl">
            Lactæ
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
            Suivi doux de vos tirages — objectif {advice.targetMl} ml sur 24 h.
          </p>
        </div>

        <Link
          href="/ajouter"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--rose-dust)] px-6 text-sm font-medium text-[var(--primary-foreground)] shadow-[0_10px_24px_rgb(201_145_143_/_0.28)] transition-colors hover:bg-[var(--rose-deep)]"
        >
          <Plus className="size-4" />
          Ajouter un tirage
        </Link>
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
    </div>
  );
}
