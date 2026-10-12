import { parseISO } from "date-fns";
import type { JournalDaySummary, JournalEntry } from "./types";
import { formatParisDate, parisDateKey } from "./time";

function sortDesc(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort(
    (a, b) => parseISO(b.datetime).getTime() - parseISO(a.datetime).getTime(),
  );
}

/** Groupe les entrées par jour (Europe/Paris), jours et heures en décroissant. */
export function groupJournalByDay(entries: JournalEntry[]): JournalDaySummary[] {
  const byDay = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const key = parisDateKey(entry.datetime);
    const list = byDay.get(key) ?? [];
    list.push(entry);
    byDay.set(key, list);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, list]) => {
      const sorted = sortDesc(list);
      return {
        dateKey,
        label: formatParisDate(sorted[0].datetime),
        count: sorted.length,
        entries: sorted,
      };
    });
}
