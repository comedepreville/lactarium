import { hasAdminClient } from "@/lib/supabase/admin";
import { processDueNotifications } from "./send";
import { isPushConfigured } from "./vapid";

const INTERVAL_MS = 30_000;

const schedulerGlobal = globalThis as typeof globalThis & {
  __lactaePushSchedulerStarted?: boolean;
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

  const tick = () => {
    void processDueNotifications().catch((error) => {
      console.error("[push] processDueNotifications", error);
    });
  };

  tick();
  setInterval(tick, INTERVAL_MS);
  console.info("[push] Scheduler démarré (toutes les 30 s)");
}
