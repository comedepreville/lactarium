import { addHours, parseISO } from "date-fns";
import type {
  DashboardAdvice,
  DaySummary,
  Tirage,
  TirageWithGap,
  UpcomingTirage,
} from "./types";
import {
  TIMER_DURATION_DEFAULT,
  TIRAGE_LOG_BUFFER_MIN,
} from "./timer-duration";
import {
  MAX_INTERVAL_HOURS,
  MIN_INTERVAL_HOURS,
  TARGET_ML_24H,
  formatParisDate,
  formatParisDateShort,
  minutesBetween,
  parisDateKey,
  startOfNextParisDay,
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
  const withAllGaps = withGaps(tirages);
  const byDay = new Map<string, TirageWithGap[]>();
  for (const t of withAllGaps) {
    const key = parisDateKey(t.datetime);
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, list]) => {
      const totalMl = list.reduce((s, t) => s + t.quantityMl, 0);
      return {
        dateKey,
        label: formatParisDate(list[0].datetime),
        totalMl,
        count: list.length,
        tirages: [...list].reverse(),
      };
    });
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

/** ceil(volume restant / moyenne). */
export function estimateRemainingTirages(
  remainingMl: number,
  avgMlPerTirage: number,
): number {
  if (remainingMl <= 0) return 0;
  return Math.max(1, Math.ceil(remainingMl / Math.max(avgMlPerTirage, 10)));
}

/**
 * Dernière heure pour démarrer un tirage « aujourd’hui » :
 * minuit Paris − durée du chrono − 10 min (saisie).
 */
export function dayTirageCutoff(
  now: Date = new Date(),
  timerDurationMin: number = TIMER_DURATION_DEFAULT,
): Date {
  const midnight = startOfNextParisDay(now);
  return new Date(
    midnight.getTime() - (timerDurationMin + TIRAGE_LOG_BUFFER_MIN) * 60_000,
  );
}

function roundToNearestMinute(date: Date): Date {
  return new Date(Math.round(date.getTime() / 60_000) * 60_000);
}

/**
 * Cadence :
 * - restants = volume restant / moyenne (à caser avant le cutoff du jour)
 * - ≥ 5 h depuis le dernier → « Maintenant », puis depuis maintenant
 * - sinon depuis le dernier tirage
 * - intervalle = temps jusqu’au cutoff / restants (1–5 h)
 * - toujours 3 créneaux si restants > 0 (déborde sur le lendemain si besoin)
 */
export function buildCadence(
  now: Date,
  lastTirageAt: string | null,
  remainingCount: number,
  timerDurationMin: number = TIMER_DURATION_DEFAULT,
): {
  upcoming: UpcomingTirage[];
  intervalHours: number | null;
  intervalCappedHigh: boolean;
  nextSuggestedAt: string | null;
  cutoffAt: string;
} {
  const cutoff = dayTirageCutoff(now, timerDurationMin);
  const cutoffAt = cutoff.toISOString();

  if (remainingCount <= 0) {
    return {
      upcoming: [],
      intervalHours: null,
      intervalCappedHigh: false,
      nextSuggestedAt: null,
      cutoffAt,
    };
  }

  const hoursSinceLast = lastTirageAt
    ? (now.getTime() - parseISO(lastTirageAt).getTime()) / (1000 * 60 * 60)
    : null;
  const overdue =
    hoursSinceLast == null || hoursSinceLast >= MAX_INTERVAL_HOURS;

  const origin = overdue ? now : parseISO(lastTirageAt!);
  const hoursToCutoff = Math.max(
    0,
    (cutoff.getTime() - origin.getTime()) / (1000 * 60 * 60),
  );
  const rawInterval = hoursToCutoff / remainingCount;
  const intervalCappedHigh = rawInterval > MAX_INTERVAL_HOURS;
  const intervalHours = Math.min(
    MAX_INTERVAL_HOURS,
    Math.max(MIN_INTERVAL_HOURS, rawInterval),
  );

  // Toujours 3 horaires dès qu’il reste du volume : s’il en reste < 3
  // avant le cutoff, les suivants débordent sur le lendemain.
  const upcoming: UpcomingTirage[] = [];
  if (overdue) {
    for (let i = 0; i < 3; i += 1) {
      upcoming.push({
        at: roundToNearestMinute(
          addHours(origin, intervalHours * i),
        ).toISOString(),
        asap: i === 0,
      });
    }
  } else {
    for (let i = 1; i <= 3; i += 1) {
      upcoming.push({
        at: roundToNearestMinute(
          addHours(origin, intervalHours * i),
        ).toISOString(),
        asap: false,
      });
    }
  }

  return {
    upcoming,
    intervalHours,
    intervalCappedHigh,
    nextSuggestedAt: upcoming[0]?.at ?? null,
    cutoffAt,
  };
}

export function computeDashboard(
  tirages: Tirage[],
  targetMl: number = TARGET_ML_24H,
  now: Date = new Date(),
  timerDurationMin: number = TIMER_DURATION_DEFAULT,
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

  const sorted = sortDesc(tirages);
  const lastTirageAt = sorted[0]?.datetime ?? null;

  const { upcoming, intervalCappedHigh, nextSuggestedAt, cutoffAt } =
    buildCadence(
      now,
      lastTirageAt,
      remainingTiragesEstimate,
      timerDurationMin,
    );

  const hoursSinceLast = lastTirageAt
    ? (now.getTime() - parseISO(lastTirageAt).getTime()) / (1000 * 60 * 60)
    : null;
  const maxGapOverdue =
    hoursSinceLast != null &&
    hoursSinceLast >= MAX_INTERVAL_HOURS &&
    remainingMl > 0;

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
    remainingTiragesEstimate,
    lastTirageAt,
    nextSuggestedAt,
    upcoming,
    intervalCappedHigh,
    maxGapOverdue,
    cutoffAt,
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
