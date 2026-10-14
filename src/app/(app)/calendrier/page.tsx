import { AddTirageFab } from "@/components/add-tirage-fab";
import { DayList } from "@/components/day-list";
import { DeveloperCredit } from "@/components/developer-credit";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { groupByDay } from "@/lib/dashboard";
import { buildTiragesExportReport } from "@/lib/export-report";
import { getProfile } from "@/lib/profile";
import { listTirages } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const [tirages, profile] = await Promise.all([listTirages(), getProfile()]);
  const days = groupByDay(tirages);
  const report = buildTiragesExportReport(tirages, profile?.displayName);

  return (
    <div className="space-y-6">
      <header className="animate-rise space-y-4 px-1">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Historique
          </p>
          <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
            Calendrier
          </h1>
        </div>
        <ExportPdfButton report={report} tirageCount={tirages.length} />
      </header>

      <DayList
        days={days}
        showEdit
        emptyMessage="Aucun tirage pour le moment."
      />

      <DeveloperCredit />

      <AddTirageFab />
    </div>
  );
}
