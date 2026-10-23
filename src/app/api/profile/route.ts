import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getProfile, mapProfile } from "@/lib/profile";
import { rescheduleReminder10Min } from "@/lib/push/schedule";
import { createClient } from "@/lib/supabase/server";
import { revalidateProfileViews } from "@/lib/revalidate";
import { parisDateKey, nowParis } from "@/lib/time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  pumpingStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  targetMl24h: z
    .number()
    .int()
    .min(100)
    .max(2000)
    .refine((n) => n % 100 === 0, "Pas de 100 ml"),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const todayKey = parisDateKey(nowParis());
    if (parsed.data.pumpingStartDate > todayKey) {
      return NextResponse.json(
        {
          error:
            "La date de début de tirage de lait ne peut pas être dans le futur",
        },
        { status: 400 },
      );
    }

    const existing = await getProfile(user.id);
    const previousTarget = existing?.targetMl24h;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        pumping_start_date: parsed.data.pumpingStartDate,
        target_ml_24h: parsed.data.targetMl24h,
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error(error);
      return NextResponse.json(
        { error: "Impossible d’enregistrer le profil" },
        { status: 500 },
      );
    }

    revalidateProfileViews();

    if (previousTarget !== parsed.data.targetMl24h) {
      void rescheduleReminder10Min().catch((err) => {
        console.error("rescheduleReminder10Min", err);
      });
    }

    return NextResponse.json({ profile: mapProfile(data) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
