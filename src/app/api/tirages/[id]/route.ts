import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTiragesViews } from "@/lib/revalidate";
import {
  deleteTirage,
  getBackend,
  getTirage,
  updateTirage,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const updateSchema = z.object({
  datetime: z.string().datetime().optional(),
  quantityMl: z.number().int().min(10).max(300).multipleOf(10).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const tirage = await getTirage(id);
    if (!tirage) {
      return NextResponse.json({ error: "Tirage introuvable" }, { status: 404 });
    }
    return NextResponse.json({ tirage, backend: getBackend() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const tirage = await updateTirage(id, parsed.data);
    if (!tirage) {
      return NextResponse.json({ error: "Tirage introuvable" }, { status: 404 });
    }
    revalidateTiragesViews();
    return NextResponse.json({ tirage, backend: getBackend() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteTirage(id);
    if (!ok) {
      return NextResponse.json({ error: "Tirage introuvable" }, { status: 404 });
    }
    revalidateTiragesViews();
    return NextResponse.json({ ok: true, backend: getBackend() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
