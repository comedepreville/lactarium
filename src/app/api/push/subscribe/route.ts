import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import { rescheduleReminder10Min } from "@/lib/push/schedule";
import { upsertPushSubscription } from "@/lib/push/subscriptions";
import { isPushConfigured } from "@/lib/push/vapid";

export const dynamic = "force-dynamic";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: "Notifications push non configurées sur le serveur" },
        { status: 503 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await upsertPushSubscription({
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: parsed.data.userAgent ?? null,
    });

    const reminder = await rescheduleReminder10Min();

    return NextResponse.json({ ok: true, reminder });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer l’abonnement" },
      { status: 500 },
    );
  }
}
