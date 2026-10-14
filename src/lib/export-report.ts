import { addDays, eachDayOfInterval, format, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { groupByDay } from "./dashboard";
import type { DaySummary, Tirage } from "./types";
import {
  formatParisDateLong,
  parisDateKey,
  parisDateKeyToNoon,
  toParis,
} from "./time";

export const MIN_TIRAGES_FOR_EXPORT = 3;
export const RECENT_CALENDAR_DAYS = 3;

export type PeriodStats = {
  avgTiragesPerDay: number;
  avgVolumeMlPerDay: number;
  /** Jours calendaires couverts par la période */
  calendarDays: number;
  /** Jours avec au moins un tirage (uniquement renseigné pour « depuis le départ ») */
  daysWithTirages?: number;
};

export type DailyVolumePoint = {
  dateKey: string;
  /** Libellé court pour l’axe (ex. 14/10) */
  label: string;
  volumeMl: number;
};

export type TiragesExportReport = {
  displayName: string;
  rangeLabel: string;
  firstDateKey: string;
  lastDateKey: string;
  firstDateLabel: string;
  lastDateLabel: string;
  exportedAtLabel: string;
  recent: PeriodStats;
  overall: PeriodStats;
  dailyVolumes: DailyVolumePoint[];
  /** Jours avec tirages, plus récent en premier */
  days: DaySummary[];
  tirageCount: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function volumeByDateKey(tirages: Tirage[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tirages) {
    const key = parisDateKey(t.datetime);
    map.set(key, (map.get(key) ?? 0) + t.quantityMl);
  }
  return map;
}

function countByDateKey(tirages: Tirage[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tirages) {
    const key = parisDateKey(t.datetime);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function eachParisDateKey(fromKey: string, toKey: string): string[] {
  if (fromKey > toKey) return [];
  const start = startOfDay(toParis(parisDateKeyToNoon(fromKey)));
  const end = startOfDay(toParis(parisDateKeyToNoon(toKey)));
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

function statsForKeys(
  keys: string[],
  volumes: Map<string, number>,
  counts: Map<string, number>,
  includeDaysWithTirages: boolean,
): PeriodStats {
  const calendarDays = keys.length;
  let totalVolume = 0;
  let totalTirages = 0;
  let daysWithTirages = 0;
  for (const key of keys) {
    const v = volumes.get(key) ?? 0;
    const c = counts.get(key) ?? 0;
    totalVolume += v;
    totalTirages += c;
    if (c > 0) daysWithTirages += 1;
  }
  const denom = Math.max(calendarDays, 1);
  return {
    avgTiragesPerDay: round1(totalTirages / denom),
    avgVolumeMlPerDay: Math.round(totalVolume / denom),
    calendarDays,
    ...(includeDaysWithTirages ? { daysWithTirages } : {}),
  };
}

function recentCalendarKeys(now = new Date()): string[] {
  const end = startOfDay(toParis(now));
  const start = addDays(end, -(RECENT_CALENDAR_DAYS - 1));
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

function shortAxisLabel(dateKey: string): string {
  return format(toParis(parisDateKeyToNoon(dateKey)), "d/M", { locale: fr });
}

/**
 * Prépare le contenu de l’export PDF à partir de tous les tirages.
 * Retourne null si moins de MIN_TIRAGES_FOR_EXPORT tirages.
 */
export function buildTiragesExportReport(
  tirages: Tirage[],
  displayName: string | null | undefined,
  now = new Date(),
): TiragesExportReport | null {
  if (tirages.length < MIN_TIRAGES_FOR_EXPORT) return null;

  const sorted = [...tirages].sort(
    (a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const firstDateKey = parisDateKey(first.datetime);
  const lastDateKey = parisDateKey(last.datetime);

  const volumes = volumeByDateKey(tirages);
  const counts = countByDateKey(tirages);
  const overallKeys = eachParisDateKey(firstDateKey, lastDateKey);
  const recentKeys = recentCalendarKeys(now);

  const dailyVolumes: DailyVolumePoint[] = overallKeys.map((dateKey) => ({
    dateKey,
    label: shortAxisLabel(dateKey),
    volumeMl: volumes.get(dateKey) ?? 0,
  }));

  const name = displayName?.trim() || "utilisatrice";
  const firstDateLabel = formatParisDateLong(first.datetime);
  const lastDateLabel = formatParisDateLong(last.datetime);

  return {
    displayName: name,
    rangeLabel: `Données de tirage de lait de ${name} du ${firstDateLabel} au ${lastDateLabel}`,
    firstDateKey,
    lastDateKey,
    firstDateLabel,
    lastDateLabel,
    exportedAtLabel: formatParisDateLong(now),
    recent: statsForKeys(recentKeys, volumes, counts, false),
    overall: statsForKeys(overallKeys, volumes, counts, true),
    dailyVolumes,
    days: groupByDay(tirages),
    tirageCount: tirages.length,
  };
}
