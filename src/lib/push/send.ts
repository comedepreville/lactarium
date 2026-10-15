import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushPayload } from "./types";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  isPushConfigured,
} from "./vapid";

function configureWebPush(): boolean {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
  return true;
}

async function sendToSubscription(
  subscription: {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload,
): Promise<"ok" | "gone" | "error"> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60,
        urgency: "high",
      },
    );
    return "ok";
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode: number }).statusCode)
        : null;
    if (statusCode === 404 || statusCode === 410) {
      return "gone";
    }
    console.error("web-push send failed", subscription.endpoint, error);
    return "error";
  }
}

export type ProcessDueResult = {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

/** Envoie les notifications dont fire_at est passé (service role). */
export async function processDueNotifications(): Promise<ProcessDueResult> {
  const result: ProcessDueResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  if (!isPushConfigured() || !configureWebPush()) {
    return result;
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await admin
    .from("scheduled_notifications")
    .select("id, user_id, title, body, url, kind")
    .eq("status", "pending")
    .lte("fire_at", nowIso)
    .order("fire_at", { ascending: true })
    .limit(50);

  if (error) throw error;
  if (!due?.length) return result;

  for (const row of due) {
    result.processed += 1;

    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", row.user_id);

    if (subsError) {
      result.errors += 1;
      console.error(subsError);
      continue;
    }

    if (!subs?.length) {
      await admin
        .from("scheduled_notifications")
        .update({ status: "cancelled" })
        .eq("id", row.id)
        .eq("status", "pending");
      result.skipped += 1;
      continue;
    }

    const payload: PushPayload = {
      title: row.title,
      body: row.body,
      url: row.url,
      tag: row.kind,
    };

    let anySent = false;
    for (const sub of subs) {
      const outcome = await sendToSubscription(sub, payload);
      if (outcome === "ok") {
        anySent = true;
      } else if (outcome === "gone") {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        result.errors += 1;
      }
    }

    const { error: markError } = await admin
      .from("scheduled_notifications")
      .update({ status: anySent ? "sent" : "cancelled" })
      .eq("id", row.id)
      .eq("status", "pending");

    if (markError) {
      result.errors += 1;
      console.error(markError);
      continue;
    }

    if (anySent) result.sent += 1;
    else result.skipped += 1;
  }

  return result;
}
