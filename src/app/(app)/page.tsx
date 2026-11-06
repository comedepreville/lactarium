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
import type { DashboardAdvice } from "@/lib/types";

export const dynamic = "force-dynamic";

function greetingLabel() {
  const hour = nowParis().getHours();
  if (hour < 12) return "Bonjour";
  // Trait d’union insécable : « après-midi » ne se coupe pas en deux.
  if (hour < 18) return "Bon après\u2011midi";
  return "Bonsoir";
}

/** Alertes qui ne répètent pas les chiffres déjà affichés. */
function showsHealthAlert(advice: DashboardAdvice): boolean {
  if (!advice.message) return false;
  if (!advice.lastTirageAt) return true;
  if (advice.status === "overdue" || advice.maxGapOverdue) return true;
  if (advice.status === "ahead") return true;
  if (advice.intervalCappedHigh && advice.remainingMl > 0) return true;
  return false;
}

export default async function HomePage() {
  const [tirages, profile] = await Promise.all([listTirages(), getProfile()]);
  const targetMl = profile?.targetMl24h ?? TARGET_ML_24H;
  const advice = computeDashboard(tirages, targetMl);
  const recentDays = lastNDays(tirages, 3);
  const greeting = greetingLabel();
  const firstName = profile?.displayName?.trim();
  const showAlert = showsHealthAlert(advice);

  return (
    <div className="space-y-5">
      <header className="animate-rise px-1 pt-1">
        <h1 className="font-display text-3xl leading-[1.1] tracking-tight text-balance text-[var(--rose-deep)]">
          {firstName ? (
            <>
              {greeting},{" "}
              <span className="whitespace-nowrap">{firstName}</span>
            </>
          ) : (
            greeting
          )}
        </h1>
      </header>

      {showAlert ? (
        <StatusBanner status={advice.status} message={advice.message} />
      ) : null}

      <DashboardPanel advice={advice} />

      <section className="space-y-3">
        <h2 className="px-1 font-display text-xl text-[var(--ink)]">
          Calendrier
        </h2>
        <DayList days={recentDays} showGaps={false} />
        {recentDays.length > 0 ? (
          <Link
            href="/calendrier"
            prefetch={false}
            className="surface-card flex h-12 w-full items-center justify-center rounded-full text-sm font-medium text-[var(--rose-deep)] transition-colors hover:bg-[var(--blush)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose-dust)]/40"
          >
            Voir plus
          </Link>
        ) : null}
      </section>

      <PushNotificationsCard onlyWhenInactive />

      <DeveloperCredit />

      <AddTirageFab />
    </div>
  );
}
