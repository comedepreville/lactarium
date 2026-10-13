import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/profile";
import { revalidateJournalViews } from "@/lib/revalidate";
import { createJournalEntry, listJournal } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createSchema = z.object({
  datetime: z.string().datetime(),
  text: z.string().trim().min(1).max(5000),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const entries = await listJournal();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de charger le journal" },
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
    const entry = await createJournalEntry(parsed.data);
    revalidateJournalViews();
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer l’événement" },
      { status: 500 },
    );
  }
}
