import { addHours, parseISO } from "date-fns";
import type {
  DashboardAdvice,
  DaySummary,
  Tirage,
  TirageWithGap,
  UpcomingTirage,
} from "./types";
import {
  MAX_INTERVAL_HOURS,
  MIN_INTERVAL_HOURS,
  TARGET_ML_24H,
  formatParisDate,
  formatParisDateShort,
  hoursUntilEndOfParisDay,
  isNightAt,
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
  /** Écarts calculés sur toute la chronologie (y compris d’un jour à l’autre). */
  const withAllGaps = withGaps(tirages);
  const byDay = new Map<string, TirageWithGap[]>();
  for (const t of withAllGaps) {
    const key = parisDateKey(t.datetime);
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, list]) => {
      const totalMl = list.reduce((s, t) => s + t.quantityMl, 0);
      return {
        dateKey,
        label: formatParisDate(list[0].datetime),
        totalMl,
        count: list.length,
        /** Plus récent en premier à l’affichage */
        tirages: [...list].reverse(),
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

function roundToNearestMinute(date: Date): Date {
  return new Date(Math.round(date.getTime() / 60_000) * 60_000);
}

/**
 * Cadence simple :
 * 1. moyenne des 3 derniers → nb de tirages restants (volume restant / moyenne)
 * 2. si dernier tirage > 5 h → « Maintenant », puis créneaux depuis maintenant
 * 3. sinon → créneaux depuis le dernier tirage
 * Intervalle = temps jusqu’à minuit (depuis l’origine) / tirages restants,
 * borné entre 1 h et 5 h.
 * Jusqu’à 3 créneaux affichés.
 */
function buildUpcomingSchedule(
  now: Date,
  lastTirageAt: string | null,
  remainingCount: number,
): {
  upcoming: UpcomingTirage[];
  intervalHours: number | null;
  intervalCappedHigh: boolean;
  nextSuggestedAt: string | null;
} {
  if (remainingCount <= 0) {
    return {
      upcoming: [],
      intervalHours: null,
      intervalCappedHigh: false,
      nextSuggestedAt: null,
    };
  }

  const hoursSinceLast = lastTirageAt
    ? (now.getTime() - parseISO(lastTirageAt).getTime()) / (1000 * 60 * 60)
    : null;
  const overdue =
    hoursSinceLast == null || hoursSinceLast >= MAX_INTERVAL_HOURS;

  const origin = overdue ? now : parseISO(lastTirageAt!);
  const hoursLeft = hoursUntilEndOfParisDay(origin);
  const rawInterval = hoursLeft / remainingCount;
  const intervalCappedHigh = rawInterval > MAX_INTERVAL_HOURS;
  // Plancher 1 h (pas de tirages trop rapprochés) / plafond 5 h (mastite).
  const intervalHours = Math.min(
    MAX_INTERVAL_HOURS,
    Math.max(MIN_INTERVAL_HOURS, rawInterval),
  );

  const count = Math.min(3, remainingCount);
  const upcoming: UpcomingTirage[] = [];

  if (overdue) {
    // Le premier des restants, c’est maintenant ; les suivants suivent l’intervalle.
    for (let i = 0; i < count; i += 1) {
      upcoming.push({
        at: roundToNearestMinute(addHours(origin, intervalHours * i)).toISOString(),
        asap: i === 0,
      });
    }
  } else {
    // Le dernier tirage est déjà fait → 1er créneau à +1 intervalle.
    for (let i = 1; i <= count; i += 1) {
      upcoming.push({
        at: roundToNearestMinute(addHours(origin, intervalHours * i)).toISOString(),
        asap: false,
      });
    }
  }

  return {
    upcoming,
    intervalHours,
    intervalCappedHigh,
    nextSuggestedAt: upcoming[0]?.at ?? null,
  };
}

export function computeDashboard(
  tirages: Tirage[],
  targetMl: number = TARGET_ML_24H,
  now: Date = new Date(),
): DashboardAdvice {
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
  const avgMlLast2 = sorted.length === 0 ? 0 : avgQuantity(sorted.slice(0, 2));

  const {
    upcoming,
    intervalHours: suggestedIntervalHours,
    intervalCappedHigh,
    nextSuggestedAt,
  } = buildUpcomingSchedule(now, lastTirageAt, remainingTiragesEstimate);

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
    Boolean(upcoming[0]?.asap) && remainingMl > 0;

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
    avgMlLast2,
    recommendedTiragesPerDay,
    remainingTiragesEstimate,
    lastTirageAt,
    nextSuggestedAt,
    upcoming,
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
