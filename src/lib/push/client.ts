"use client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

export function pushApiSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready;
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!pushApiSupported()) return null;
  const registration = await getRegistration();
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushSubscription> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission notifications refusée");
  }

  const registration = await getRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey,
      ) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Abonnement push incomplet");
  }

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      userAgent: navigator.userAgent,
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error || "Échec de l’abonnement");
  }

  return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe().catch(() => undefined);
}

export async function scheduleTimerDonePush(fireAt: Date): Promise<void> {
  if (!pushApiSupported()) return;
  try {
    await fetch("/api/push/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "timer_done",
        fireAt: fireAt.toISOString(),
      }),
    });
  } catch {
    /* best-effort */
  }
}

export async function cancelTimerDonePush(): Promise<void> {
  if (!pushApiSupported()) return;
  try {
    await fetch("/api/push/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel_timer" }),
    });
  } catch {
    /* best-effort */
  }
}
