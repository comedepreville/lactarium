import {
  clearPoolBackoff,
  hasAdminClient,
  isPoolBackingOff,
  isPoolSaturationError,
  notePoolSaturation,
} from "@/lib/supabase/admin";
import { processDueNotifications } from "./send";
import { isPushConfigured } from "./vapid";

/** Intervalle de base — assez large pour un free tier Supabase. */
const BASE_INTERVAL_MS = 60_000;

const schedulerGlobal = globalThis as typeof globalThis & {
  __lactaePushSchedulerStarted?: boolean;
  __lactaePushTickRunning?: boolean;
  __lactaePushTimer?: ReturnType<typeof setInterval>;
};

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
  clearPoolBackoff();

  const tick = () => {
    if (schedulerGlobal.__lactaePushTickRunning) {
      return;
    }
    if (isPoolBackingOff()) {
      return;
    }

    schedulerGlobal.__lactaePushTickRunning = true;
    void processDueNotifications()
      .then(() => {
        clearPoolBackoff();
      })
      .catch((error) => {
        console.error("[push] processDueNotifications", error);
        if (isPoolSaturationError(error)) {
          notePoolSaturation("push");
        }
      })
      .finally(() => {
        schedulerGlobal.__lactaePushTickRunning = false;
      });
  };

  // Laisse le boot se stabiliser ; la rétention est encore plus tardive.
  setTimeout(tick, 30_000);
  schedulerGlobal.__lactaePushTimer = setInterval(tick, BASE_INTERVAL_MS);
  console.info(
    `[push] Scheduler démarré (toutes les ${BASE_INTERVAL_MS / 1000}s, sans chevauchement)`,
  );
}
