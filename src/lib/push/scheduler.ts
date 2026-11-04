import { hasAdminClient, isPoolSaturationError } from "@/lib/supabase/admin";
import { processDueNotifications } from "./send";
import { isPushConfigured } from "./vapid";

/** Intervalle de base — assez large pour un free tier Supabase. */
const BASE_INTERVAL_MS = 60_000;
const MAX_BACKOFF_MS = 15 * 60_000;

const schedulerGlobal = globalThis as typeof globalThis & {
  __lactaePushSchedulerStarted?: boolean;
  __lactaePushTickRunning?: boolean;
  __lactaePushBackoffUntil?: number;
  __lactaePushBackoffMs?: number;
  __lactaePushTimer?: ReturnType<typeof setInterval>;
};

function nextBackoffMs(): number {
  const prev = schedulerGlobal.__lactaePushBackoffMs ?? BASE_INTERVAL_MS;
  const next = Math.min(prev * 2, MAX_BACKOFF_MS);
  schedulerGlobal.__lactaePushBackoffMs = next;
  return next;
}

function resetBackoff(): void {
  schedulerGlobal.__lactaePushBackoffMs = BASE_INTERVAL_MS;
  schedulerGlobal.__lactaePushBackoffUntil = 0;
}

/** Démarre le poller in-process (un seul conteneur Docker). */
export function startPushScheduler(): void {
  if (schedulerGlobal.__lactaePushSchedulerStarted) return;
  if (!isPushConfigured() || !hasAdminClient()) {
    console.info(
      "[push] Scheduler inactif — VAPID ou SUPABASE_SERVICE_ROLE_KEY manquant",
    );
    return;
  }

  schedulerGlobal.__lactaePushSchedulerStarted = true;
  resetBackoff();

  const tick = () => {
    if (schedulerGlobal.__lactaePushTickRunning) {
      return;
    }

    const backoffUntil = schedulerGlobal.__lactaePushBackoffUntil ?? 0;
    if (Date.now() < backoffUntil) {
      return;
    }

    schedulerGlobal.__lactaePushTickRunning = true;
    void processDueNotifications()
      .then(() => {
        resetBackoff();
      })
      .catch((error) => {
        console.error("[push] processDueNotifications", error);
        if (isPoolSaturationError(error)) {
          const wait = nextBackoffMs();
          schedulerGlobal.__lactaePushBackoffUntil = Date.now() + wait;
          console.warn(
            `[push] Pool saturé — pause ${Math.round(wait / 1000)}s avant le prochain tick`,
          );
        }
      })
      .finally(() => {
        schedulerGlobal.__lactaePushTickRunning = false;
      });
  };

  // Laisse le boot / la rétention démarrer sans pic concurrent.
  setTimeout(tick, 15_000);
  schedulerGlobal.__lactaePushTimer = setInterval(tick, BASE_INTERVAL_MS);
  console.info(
    `[push] Scheduler démarré (toutes les ${BASE_INTERVAL_MS / 1000}s, sans chevauchement)`,
  );
}
