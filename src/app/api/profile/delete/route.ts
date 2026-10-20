import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bodySchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!hasAdminClient()) {
      return NextResponse.json(
        { error: "Suppression de compte indisponible (configuration serveur)" },
        { status: 503 },
      );
    }

    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.password,
    });
    if (authError) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json(
        { error: "Impossible de supprimer le compte" },
        { status: 500 },
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
