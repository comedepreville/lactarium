import { NextResponse } from "next/server";
import { hasAdminClient } from "@/lib/supabase/admin";
import { processDueNotifications } from "@/lib/push/send";
import { isPushConfigured } from "@/lib/push/vapid";

export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isPushConfigured() || !hasAdminClient()) {
    return NextResponse.json(
      { error: "Push non configuré" },
      { status: 503 },
    );
  }

  try {
    const result = await processDueNotifications();
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Échec du cron push" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
