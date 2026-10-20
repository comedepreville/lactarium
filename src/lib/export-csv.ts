import type { JournalEntry, Tirage } from "./types";
import { formatParisDateLong, nowParis } from "./time";

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const raw = String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(escapeCsvCell).join(",");
}

/** CSV unique : tirages + entrées de journal (colonne `type`). */
export function buildDataExportCsv(
  tirages: Tirage[],
  journal: JournalEntry[],
): string {
  const header = csvRow([
    "type",
    "id",
    "datetime",
    "quantity_ml",
    "duration_min",
    "notes",
    "text",
  ]);

  const tirageRows = [...tirages]
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
    .map((t) =>
      csvRow([
        "tirage",
        t.id,
        t.datetime,
        t.quantityMl,
        t.duration,
        t.notes,
        null,
      ]),
    );

  const journalRows = [...journal]
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
    .map((j) =>
      csvRow(["journal", j.id, j.datetime, null, null, null, j.text]),
    );

  return ["\uFEFF" + header, ...tirageRows, ...journalRows].join("\r\n") + "\r\n";
}

export function dataExportFilename(): string {
  const stamp = formatParisDateLong(nowParis())
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `lactae-donnees-${stamp || "export"}.csv`;
}
