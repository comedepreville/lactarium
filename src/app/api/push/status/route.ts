import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/profile";
import { userHasPushSubscription } from "@/lib/push/subscriptions";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push/vapid";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const configured = isPushConfigured();
    const subscribed = configured ? await userHasPushSubscription() : false;

    return NextResponse.json({
      configured,
      vapidPublicKey: configured ? getVapidPublicKey() : null,
      subscribed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
