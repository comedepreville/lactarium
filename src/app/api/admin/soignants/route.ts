import { NextResponse } from "next/server";
import { z } from "zod";
import { createSoignantAccount, requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const soignant = await createSoignantAccount(parsed.data);
    return NextResponse.json({ soignant }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Impossible de créer le soignant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
