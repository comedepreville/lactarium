import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import {
  cancelTimerDone,
  scheduleTimerDone,
} from "@/lib/push/schedule";
import { userHasPushSubscription } from "@/lib/push/subscriptions";
import { isPushConfigured } from "@/lib/push/vapid";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("timer_done"),
    fireAt: z.string().datetime(),
  }),
  z.object({
    action: z.literal("cancel_timer"),
  }),
]);

export async function POST(request: Request) {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json({ ok: false, skipped: true });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const hasSub = await userHasPushSubscription();
    if (!hasSub) {
      return NextResponse.json({ ok: false, skipped: true });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.action === "timer_done") {
      await scheduleTimerDone(parsed.data.fireAt);
      return NextResponse.json({ ok: true });
    }

    await cancelTimerDone();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de planifier la notification" },
      { status: 500 },
    );
  }
}
