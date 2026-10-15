import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import { cancelTimerDone } from "@/lib/push/schedule";
import { deletePushSubscription } from "@/lib/push/subscriptions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: Request) {
  try {
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

    await deletePushSubscription(parsed.data.endpoint);

    const supabase = await createClient();
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) === 0) {
      await cancelTimerDone();
      await supabase
        .from("scheduled_notifications")
        .update({ status: "cancelled" })
        .eq("status", "pending");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de désactiver les notifications" },
      { status: 500 },
    );
  }
}
