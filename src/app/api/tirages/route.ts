import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import { revalidateTiragesViews } from "@/lib/revalidate";
import { createTirage, listTirages } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createSchema = z.object({
  datetime: z.string().datetime(),
  quantityMl: z.number().int().min(10).max(300).multipleOf(10),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const tirages = await listTirages();
    return NextResponse.json(
      { tirages },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de charger les tirages" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const tirage = await createTirage(parsed.data);
    revalidateTiragesViews();
    return NextResponse.json({ tirage }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le tirage" },
      { status: 500 },
    );
  }
}
