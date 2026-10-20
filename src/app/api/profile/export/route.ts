import { NextResponse } from "next/server";
import {
  buildDataExportCsv,
  dataExportFilename,
} from "@/lib/export-csv";
import { getCurrentUser } from "@/lib/profile";
import { listJournal, listTirages } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [tirages, journal] = await Promise.all([
      listTirages(),
      listJournal(),
    ]);
    const csv = buildDataExportCsv(tirages, journal);
    const filename = dataExportFilename();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d’exporter les données" },
      { status: 500 },
    );
  }
}
