import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(72),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });
    if (authError) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 403 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.newPassword,
    });
    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Impossible de changer le mot de passe" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
