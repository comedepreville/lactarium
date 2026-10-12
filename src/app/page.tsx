import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard-panel";
import { DayList } from "@/components/day-list";
import { DeveloperCredit } from "@/components/developer-credit";
import { computeDashboard, lastNDays } from "@/lib/dashboard";
import { getBackend, listTirages } from "@/lib/storage";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tirages = await listTirages();
  const advice = computeDashboard(tirages);
  const recentDays = lastNDays(tirages, 3);
  const backend = getBackend();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl px-1 pb-2 pt-4">
        <div
          aria-hidden
          className="hero-orb pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-[var(--teal)]/15 blur-2xl"
        />
        <div
          aria-hidden
          className="hero-orb-delayed pointer-events-none absolute -left-10 top-16 size-32 rounded-full bg-[#9fd0c8]/25 blur-2xl"
        />

        <div className="relative animate-rise space-y-4">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--teal-deep)]">
            Suivi des tirages
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-tight text-[var(--ink)] sm:text-6xl">
            Lactarium
          </h1>
          <p className="max-w-sm text-[var(--ink-muted)]">
            Cible 800 ml / 24 h — sans surstimulation, sans engorgement.
          </p>
          <Link
            href="/ajouter"
            className="mt-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--teal)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--teal-deep)]"
          >
            <Plus className="size-4" />
            Ajouter un tirage
          </Link>
        </div>
      </section>

      <DashboardPanel advice={advice} />

      <div className="h-px bg-[var(--line)]" />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Trois derniers jours
            </h2>
            <p className="text-sm text-[var(--ink-muted)]">
              Volume, nombre de tirages et écarts
            </p>
          </div>
          <Link
            href="/calendrier"
            className="text-sm font-medium text-[var(--teal-deep)] underline-offset-4 hover:underline"
          >
            Voir plus
          </Link>
        </div>
        <DayList days={recentDays} />
      </section>

      <p className="text-center text-[10px] uppercase tracking-wider text-[var(--ink-muted)]/70">
        Stockage : {backend === "sheets" ? "Google Sheets" : "local"}
      </p>

      <DeveloperCredit />
    </div>
  );
}
