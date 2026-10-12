import { addHours, parseISO } from "date-fns";
import type { DashboardAdvice, DaySummary, Tirage, TirageWithGap } from "./types";
import {
  TARGET_ML_24H,
  formatParisDate,
  formatParisDateShort,
  isPast,
  isNightAt,
  maxGapHoursAt,
  minutesBetween,
  parisDateKey,
  rollingWindowStart,
} from "./time";

function sortAsc(tirages: Tirage[]): Tirage[] {
  return [...tirages].sort(
    (a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime(),
  );
}

function sortDesc(tirages: Tirage[]): Tirage[] {
  return [...tirages].sort(
    (a, b) => parseISO(b.datetime).getTime() - parseISO(a.datetime).getTime(),
  );
}

export function withGaps(tirages: Tirage[]): TirageWithGap[] {
  const sorted = sortAsc(tirages);
  return sorted.map((t, i) => ({
    ...t,
    gapMinutes:
      i === 0 ? null : minutesBetween(t.datetime, sorted[i - 1].datetime),
  }));
}

export function groupByDay(tirages: Tirage[]): DaySummary[] {
  const byDay = new Map<string, Tirage[]>();
  for (const t of tirages) {
    const key = parisDateKey(t.datetime);
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, list]) => {
      const withGap = withGaps(list);
      const totalMl = list.reduce((s, t) => s + t.quantityMl, 0);
      return {
        dateKey,
        label: formatParisDate(list[0].datetime),
        totalMl,
        count: list.length,
        tirages: [...withGap].reverse(),
      };
    });

  return days;
}

function avgQuantity(tirages: Tirage[]): number {
  if (tirages.length === 0) return 0;
  const sum = tirages.reduce((s, t) => s + t.quantityMl, 0);
  return Math.round(sum / tirages.length);
}

function inLastHours(tirages: Tirage[], hours: number): Tirage[] {
  const start = rollingWindowStart(hours).getTime();
  return tirages.filter((t) => parseISO(t.datetime).getTime() >= start);
}

/**
 * Cadence pour atteindre 800 ml :
 * intervalle = 24 h / nb de tirages encore nécessaires (d’après la moyenne observée),
 * plafonné au max jour (6 h) / nuit (5 h).
 */
function cadenceIntervalHours(
  remainingTirages: number,
  recommendedPerDay: number,
  maxGapHours: number,
): number {
  const divisor =
    remainingTirages > 0 ? remainingTirages : Math.max(1, recommendedPerDay);
  const raw = 24 / divisor;
  return Math.min(raw, maxGapHours);
}

export function computeDashboard(tirages: Tirage[]): DashboardAdvice {
  const last24 = inLastHours(tirages, 24);
  const last48 = inLastHours(tirages, 48);
  const drawnMl24h = last24.reduce((s, t) => s + t.quantityMl, 0);
  const remainingMl = Math.max(0, TARGET_ML_24H - drawnMl24h);
  const avgMlPerTirage24h = avgQuantity(last24);
  const avgMlPerTirage48h = avgQuantity(last48);

  const referenceAvg =
    last48.length >= 2
      ? avgMlPerTirage48h
      : last24.length >= 1
        ? avgMlPerTirage24h
        : 100;

  const recommendedTiragesPerDay = Math.max(
    1,
    Math.ceil(TARGET_ML_24H / Math.max(referenceAvg, 10)),
  );
  const remainingTiragesEstimate =
    remainingMl === 0
      ? 0
      : Math.max(1, Math.ceil(remainingMl / Math.max(referenceAvg, 10)));

  const sorted = sortDesc(tirages);
  const last = sorted[0] ?? null;
  const lastTirageAt = last?.datetime ?? null;

  const anchor = lastTirageAt ? parseISO(lastTirageAt) : new Date();
  const maxGapHours = maxGapHoursAt(anchor);
  const isNightWindow = isNightAt(anchor);

  const suggestedIntervalHours = cadenceIntervalHours(
    remainingTiragesEstimate,
    recommendedTiragesPerDay,
    maxGapHours,
  );

  const nextSuggestedAt = addHours(
    anchor,
    suggestedIntervalHours,
  ).toISOString();

  const maxDeadlineAt = addHours(anchor, maxGapHours).toISOString();
  const cadenceOverdue = isPast(nextSuggestedAt);
  const maxGapOverdue = lastTirageAt ? isPast(maxDeadlineAt) : false;

  let status: DashboardAdvice["status"] = "ok";
  let message = "";

  if (!lastTirageAt) {
    status = "behind";
    message = "Aucun tirage enregistré.";
  } else if (maxGapOverdue) {
    status = "overdue";
    message = `Délai max dépassé (${maxGapHours} h). Tirez maintenant.`;
  } else if (cadenceOverdue && remainingMl > 0) {
    status = "overdue";
    message = "Cadence en retard pour la cible 800 ml. Tirez bientôt.";
  } else if (drawnMl24h > TARGET_ML_24H + 100) {
    status = "ahead";
    message = `Volume élevé (${drawnMl24h} ml). Risque de surstimulation.`;
  } else if (drawnMl24h < TARGET_ML_24H * 0.7 && last24.length > 0) {
    status = "behind";
    message = `${remainingMl} ml restants ≈ ${remainingTiragesEstimate} tirage${remainingTiragesEstimate > 1 ? "s" : ""}.`;
  } else if (drawnMl24h >= TARGET_ML_24H) {
    status = "ok";
    message = `Cible atteinte (${drawnMl24h} ml).`;
  } else {
    status = "ok";
    message = `${remainingMl} ml restants ≈ ${remainingTiragesEstimate} tirage${remainingTiragesEstimate > 1 ? "s" : ""}.`;
  }

  return {
    targetMl: TARGET_ML_24H,
    drawnMl24h,
    remainingMl,
    tirageCount24h: last24.length,
    avgMlPerTirage24h,
    avgMlPerTirage48h,
    recommendedTiragesPerDay,
    remainingTiragesEstimate,
    lastTirageAt,
    nextSuggestedAt,
    suggestedIntervalHours,
    maxGapHours,
    isNightWindow,
    status,
    message,
  };
}

export function lastNDays(tirages: Tirage[], n: number): DaySummary[] {
  return groupByDay(tirages).slice(0, n).map((day) => ({
    ...day,
    label: formatParisDateShort(day.tirages[0]?.datetime ?? day.dateKey),
  }));
}
