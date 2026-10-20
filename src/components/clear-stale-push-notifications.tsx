"use client";

import { useEffect } from "react";
import { clearDisplayedPushNotifications } from "@/lib/push/client";

/**
 * Quand l’app authentifiée est ouverte / repasse au premier plan,
 * retire les push déjà affichées (sinon elles s’empilent si on n’ouvre
 * pas l’app via la notification).
 */
export function ClearStalePushNotifications() {
  useEffect(() => {
    void clearDisplayedPushNotifications();

    function onVisible() {
      if (document.visibilityState === "visible") {
        void clearDisplayedPushNotifications();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return null;
}
