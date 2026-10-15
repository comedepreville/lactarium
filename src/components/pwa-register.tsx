"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;
        // Force la récupération du SW (purge des anciens caches HTML/RSC).
        void registration.update();
      })
      .catch(() => {
        /* silent — SW optional in dev */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
