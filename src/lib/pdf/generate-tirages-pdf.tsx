import { pdf } from "@react-pdf/renderer";
import type { TiragesExportReport } from "@/lib/export-report";
import { TiragesPdfDocument } from "./tirages-document";

function sanitizeFilenamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 40);
}

export function tiragesPdfFilename(report: TiragesExportReport): string {
  const name = sanitizeFilenamePart(report.displayName) || "lactae";
  return `lactae-tirages-${name}-${report.lastDateKey}.pdf`;
}

export async function generateTiragesPdfBlob(
  report: TiragesExportReport,
): Promise<Blob> {
  return pdf(<TiragesPdfDocument report={report} />).toBlob();
}
