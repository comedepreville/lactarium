import Link from "next/link";
import { AddTirageFab } from "@/components/add-tirage-fab";
import { DashboardPanel } from "@/components/dashboard-panel";
import { DayList } from "@/components/day-list";
import { DeveloperCredit } from "@/components/developer-credit";
import { PushNotificationsCard } from "@/components/push-notifications-card";
import { StatusBanner } from "@/components/status-banner";
import { computeDashboard, lastNDays } from "@/lib/dashboard";
import { getProfile } from "@/lib/profile";
import { listTirages } from "@/lib/storage";
import { TARGET_ML_24H, nowParis } from "@/lib/time";

export const dynamic = "force-dynamic";

function greetingLabel() {
  const hour = nowParis().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function HomePage() {
  const [tirages, profile] = await Promise.all([listTirages(), getProfile()]);
  const targetMl = profile?.targetMl24h ?? TARGET_ML_24H;
  const advice = computeDashboard(tirages, targetMl);
  const recentDays = lastNDays(tirages, 3);
  const greeting = greetingLabel();
  const showTopAlert = advice.maxGapOverdue;
  const firstName = profile?.displayName?.trim();

  return (
    <div className="space-y-8">
      <section className="animate-rise relative space-y-5 pt-2">
        {showTopAlert && (
          <StatusBanner
            status="overdue"
            message={advice.message}
            className="animate-rise text-base font-medium shadow-[0_8px_20px_rgb(122_63_61_/_0.12)]"
          />
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {firstName ? `${greeting}, ${firstName}` : greeting}
          </p>
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-[var(--rose-deep)] sm:text-6xl">
            Lactae
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
            Vous êtes la meilleure, bravo !
          </p>
        </div>
      </section>

      <DashboardPanel advice={advice} hideStatusBanner={showTopAlert} />

      <PushNotificationsCard />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 px-1">
          <h2 className="font-display text-3xl text-[var(--ink)]">
            Trois derniers jours
          </h2>
          <Link
            href="/calendrier"
            prefetch={false}
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
