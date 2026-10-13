import { addHours, parseISO } from "date-fns";
import type { DashboardAdvice, DaySummary, Tirage, TirageWithGap } from "./types";
import {
  MAX_INTERVAL_HOURS,
  MIN_INTERVAL_HOURS,
  TARGET_ML_24H,
  formatParisDate,
  formatParisDateShort,
  hoursUntilEndOfParisDay,
  isNightAt,
  isPast,
  minutesBetween,
  parisDateKey,
} from "./time";

const FALLBACK_AVG_ML = 100;

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

/** Moyenne des N derniers tirages, toutes journées confondues. */
export function averageLastNTirages(tirages: Tirage[], n: number): number {
  const lastN = sortDesc(tirages).slice(0, n);
  if (lastN.length === 0) return FALLBACK_AVG_ML;
  return avgQuantity(lastN);
}

/**
 * Tirages restants aujourd’hui :
 * ceil((objectif − déjà tiré aujourd’hui) / moyenne des 3 derniers tirages).
 */
export function estimateRemainingTirages(
  remainingMl: number,
  avgMlPerTirage: number,
): number {
  if (remainingMl <= 0) return 0;
  return Math.max(1, Math.ceil(remainingMl / Math.max(avgMlPerTirage, 10)));
}

/**
 * Intervalle jusqu’au prochain tirage :
 * temps restant aujourd’hui / tirages restants, borné entre 1 h et 5 h.
 */
export function suggestIntervalHours(
  hoursLeftToday: number,
  remainingTirages: number,
): { hours: number | null; cappedHigh: boolean } {
  if (remainingTirages <= 0) {
    return { hours: null, cappedHigh: false };
  }
  const raw = hoursLeftToday / remainingTirages;
  const cappedHigh = raw > MAX_INTERVAL_HOURS;
  const hours = Math.min(
    MAX_INTERVAL_HOURS,
    Math.max(MIN_INTERVAL_HOURS, raw),
  );
  return { hours, cappedHigh };
}

export function computeDashboard(
  tirages: Tirage[],
  targetMl: number = TARGET_ML_24H,
): DashboardAdvice {
  const now = new Date();
  const todayKey = parisDateKey(now);
  const todayTirages = tirages.filter(
    (t) => parisDateKey(t.datetime) === todayKey,
  );

  const drawnMlToday = todayTirages.reduce((s, t) => s + t.quantityMl, 0);
  const remainingMl = Math.max(0, targetMl - drawnMlToday);

  const avgMlLast3 = averageLastNTirages(tirages, 3);
  const remainingTiragesEstimate = estimateRemainingTirages(
    remainingMl,
    avgMlLast3,
  );
  const recommendedTiragesPerDay = Math.max(
    1,
    Math.ceil(targetMl / Math.max(avgMlLast3, 10)),
  );

  const sorted = sortDesc(tirages);
  const last = sorted[0] ?? null;
  const lastTirageAt = last?.datetime ?? null;

  /**
   * Première échéance depuis le dernier tirage :
   * ancrée sur lastTirageAt (pas sur « maintenant »), sinon chaque refresh
   * invente une échéance suivante et masque le dépassement.
   */
  const anchor = lastTirageAt ? parseISO(lastTirageAt) : now;
  const hoursLeftFromAnchor = hoursUntilEndOfParisDay(anchor);
  const { hours: suggestedIntervalHours, cappedHigh: intervalCappedHigh } =
    suggestIntervalHours(hoursLeftFromAnchor, remainingTiragesEstimate);

  const nextSuggestedAt =
    suggestedIntervalHours == null
      ? null
      : addHours(anchor, suggestedIntervalHours).toISOString();

  const isNightWindow = isNightAt(now);
  const maxGapHours = MAX_INTERVAL_HOURS;

  const hoursSinceLast = lastTirageAt
    ? (now.getTime() - parseISO(lastTirageAt).getTime()) / (1000 * 60 * 60)
    : null;
  const maxGapOverdue =
    hoursSinceLast != null &&
    hoursSinceLast >= MAX_INTERVAL_HOURS &&
    remainingMl > 0;
  const cadenceOverdue =
    nextSuggestedAt != null && isPast(nextSuggestedAt) && remainingMl > 0;

  let status: DashboardAdvice["status"] = "ok";
  let message = "";

  if (!lastTirageAt) {
    status = "behind";
    message = "Aucun tirage enregistré.";
  } else if (maxGapOverdue) {
    status = "overdue";
    message = `Plus de ${MAX_INTERVAL_HOURS} h depuis le dernier tirage. Risque d’engorgement voire de mastite.`;
  } else if (intervalCappedHigh && remainingMl > 0) {
    status = "behind";
    message = `Intervalle plafonné à ${MAX_INTERVAL_HOURS} h : sinon risque d’engorgement voire de mastite.`;
  } else if (drawnMlToday > targetMl + 100) {
    status = "ahead";
    message = `Volume élevé (${drawnMlToday} ml). Risque de surstimulation.`;
  } else if (drawnMlToday >= targetMl) {
    status = "ok";
    message = `Cible atteinte (${drawnMlToday} ml).`;
  } else if (drawnMlToday < targetMl * 0.7 && todayTirages.length > 0) {
    status = "behind";
    message = `${remainingMl} ml restants ≈ ${remainingTiragesEstimate} tirage${remainingTiragesEstimate > 1 ? "s" : ""}.`;
  } else {
    status = "ok";
    message =
      remainingTiragesEstimate > 0
        ? `${remainingMl} ml restants ≈ ${remainingTiragesEstimate} tirage${remainingTiragesEstimate > 1 ? "s" : ""}.`
        : `Cible atteinte (${drawnMlToday} ml).`;
  }

  return {
    targetMl,
    drawnMlToday,
    remainingMl,
    tirageCountToday: todayTirages.length,
    avgMlLast3,
    recommendedTiragesPerDay,
    remainingTiragesEstimate,
    lastTirageAt,
    nextSuggestedAt,
    suggestedIntervalHours,
    intervalCappedHigh,
    cadenceOverdue,
    maxGapOverdue,
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
