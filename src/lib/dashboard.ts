import { parseISO } from "date-fns";
import type { DashboardAdvice, DaySummary, Tirage, TirageWithGap } from "./types";
import {
  TARGET_ML_24H,
  formatParisDate,
  formatParisDateShort,
  isPast,
  minutesBetween,
  nextDeadlineFrom,
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

export function computeDashboard(tirages: Tirage[]): DashboardAdvice {
  const last24 = inLastHours(tirages, 24);
  const last48 = inLastHours(tirages, 48);
  const drawnMl24h = last24.reduce((s, t) => s + t.quantityMl, 0);
  const remainingMl = Math.max(0, TARGET_ML_24H - drawnMl24h);
  const avgMlPerTirage24h = avgQuantity(last24);
  const avgMlPerTirage48h = avgQuantity(last48);

  // Prefer 48h average when available (more stable), else 24h, else assume 100 ml
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

  let nextDeadlineAt: string | null = null;
  let maxGapHours = 6;
  let isNightWindow = false;

  if (lastTirageAt) {
    const { deadline, maxGapHours: gap, isNight } =
      nextDeadlineFrom(lastTirageAt);
    nextDeadlineAt = deadline.toISOString();
    maxGapHours = gap;
    isNightWindow = isNight;
  }

  let status: DashboardAdvice["status"] = "ok";
  let message = "";

  if (!lastTirageAt) {
    status = "behind";
    message =
      "Aucun tirage enregistré. Commencez par ajouter le premier pour caler le rythme.";
  } else if (nextDeadlineAt && isPast(nextDeadlineAt)) {
    status = "overdue";
    message = `Le délai max (${maxGapHours} h ${isNightWindow ? "nuit" : "journée"}) est dépassé. Un tirage est recommandé maintenant.`;
  } else if (drawnMl24h > TARGET_ML_24H + 100) {
    status = "ahead";
    message = `Volume élevé sur 24 h (${drawnMl24h} ml). Au-delà de ${TARGET_ML_24H} ml, risque de surstimulation — restez dans la cible.`;
  } else if (drawnMl24h < TARGET_ML_24H * 0.7 && last24.length > 0) {
    status = "behind";
    message = `En dessous de la cible : ${remainingMl} ml restants (~${remainingTiragesEstimate} tirage${remainingTiragesEstimate > 1 ? "s" : ""}) sur 24 h glissantes.`;
  } else if (drawnMl24h >= TARGET_ML_24H) {
    status = "ok";
    message = `Cible atteinte (${drawnMl24h} ml / ${TARGET_ML_24H} ml). Maintenez l’espacement max ${maxGapHours} h.`;
  } else {
    status = "ok";
    message = `Il reste ${remainingMl} ml (~${remainingTiragesEstimate} tirage${remainingTiragesEstimate > 1 ? "s" : ""}) pour atteindre ${TARGET_ML_24H} ml / 24 h. Rythme conseillé : ~${recommendedTiragesPerDay} tirages/jour.`;
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
    nextDeadlineAt,
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
