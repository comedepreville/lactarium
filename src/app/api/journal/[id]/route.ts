import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import { revalidateJournalViews } from "@/lib/revalidate";
import {
  deleteJournalEntry,
  getJournalEntry,
  updateJournalEntry,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const updateSchema = z.object({
  datetime: z.string().datetime().optional(),
  text: z.string().trim().min(1).max(5000).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { id } = await params;
    const entry = await getJournalEntry(id);
    if (!entry) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json({ entry });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const entry = await updateJournalEntry(id, parsed.data);
    if (!entry) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 },
      );
    }
    revalidateJournalViews();
    return NextResponse.json({ entry });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { id } = await params;
    const ok = await deleteJournalEntry(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 },
      );
    }
    revalidateJournalViews();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
