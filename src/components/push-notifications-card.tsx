"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isStandalonePwa,
  pushApiSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";

type StatusResponse = {
  configured: boolean;
  vapidPublicKey: string | null;
  subscribed: boolean;
};

type UiState =
  | "loading"
  | "unsupported"
  | "need-install"
  | "ready"
  | "error";

export function PushNotificationsCard() {
  const [ui, setUi] = useState<UiState>("loading");
  const [subscribed, setSubscribed] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!pushApiSupported()) {
        // Sur iOS Safari onglet : Notification n’existe pas.
        const isIos =
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (cancelled) return;
        setUi(isIos && !isStandalonePwa() ? "need-install" : "unsupported");
        return;
      }

      if (!isStandalonePwa() && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        if (!cancelled) setUi("need-install");
        return;
      }

      try {
        const response = await fetch("/api/push/status", { cache: "no-store" });
        if (!response.ok) throw new Error("status");
        const data = (await response.json()) as StatusResponse;
        if (cancelled) return;
        if (!data.configured || !data.vapidPublicKey) {
          setUi("unsupported");
          setMessage("Notifications non configurées sur le serveur.");
          return;
        }
        setVapidKey(data.vapidPublicKey);
        setSubscribed(data.subscribed);
        setUi("ready");
      } catch {
        if (!cancelled) {
          setUi("error");
          setMessage("Impossible de vérifier les notifications.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    if (!vapidKey) return;
    setBusy(true);
    setMessage(null);
    try {
      await subscribeToPush(vapidKey);
      setSubscribed(true);
      setMessage("Notifications activées.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Activation impossible",
      );
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      setMessage("Notifications désactivées.");
    } catch {
      setMessage("Désactivation impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (ui === "loading") {
    return (
      <section className="surface-card animate-rise rounded-[1.75rem] px-5 py-4">
        <p className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Notifications…
        </p>
      </section>
    );
  }

  if (ui === "unsupported") {
    return null;
  }

  return (
    <section className="surface-card animate-rise space-y-3 rounded-[1.75rem] px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[var(--blush)] p-2 text-[var(--rose-deep)]">
          {subscribed ? (
            <Bell className="size-4" aria-hidden />
          ) : (
            <BellOff className="size-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-display text-xl text-[var(--ink)]">
            Notifications
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            {ui === "need-install"
              ? "Sur iPhone : Partager → Sur l’écran d’accueil, puis rouvrez Lactae depuis l’icône pour activer les rappels."
              : "Rappel 10 min avant l’échéance, et « Tirage fini ! » à la fin du minuteur."}
          </p>
        </div>
      </div>

      {ui === "ready" && (
        <Button
          type="button"
          disabled={busy}
          onClick={() => void (subscribed ? disable() : enable())}
          className="h-11 w-full rounded-full bg-[var(--rose-dust)] text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : subscribed ? (
            "Désactiver"
          ) : (
            "Activer les rappels"
          )}
        </Button>
      )}

      {message ? (
        <p className="text-sm text-[var(--ink-muted)]" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
