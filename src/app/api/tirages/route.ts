import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTiragesViews } from "@/lib/revalidate";
import { createTirage, getBackend, listTirages } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createSchema = z.object({
  datetime: z.string().datetime(),
  quantityMl: z.number().int().positive().multipleOf(10),
});

export async function GET() {
  try {
    const tirages = await listTirages();
    return NextResponse.json({
      tirages,
      backend: getBackend(),
    });
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
    return NextResponse.json({ tirage, backend: getBackend() }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le tirage" },
      { status: 500 },
    );
  }
}
