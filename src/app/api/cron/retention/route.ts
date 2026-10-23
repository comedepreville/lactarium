import { NextResponse } from "next/server";
import { hasAdminClient } from "@/lib/supabase/admin";
import { purgeExpiredData } from "@/lib/retention";

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

  if (!hasAdminClient()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY manquant" },
      { status: 503 },
    );
  }

  try {
    const result = await purgeExpiredData();
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Échec de la purge de rétention" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
