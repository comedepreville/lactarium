export type Tirage = {
  id: string;
  /** ISO datetime in UTC; displayed in Europe/Paris */
  datetime: string;
  quantityMl: number;
};

export type DaySummary = {
  dateKey: string;
  label: string;
  totalMl: number;
  count: number;
  tirages: TirageWithGap[];
};

export type TirageWithGap = Tirage & {
  gapMinutes: number | null;
};

export type DashboardAdvice = {
  targetMl: number;
  drawnMl24h: number;
  remainingMl: number;
  tirageCount24h: number;
  avgMlPerTirage24h: number;
  avgMlPerTirage48h: number;
  recommendedTiragesPerDay: number;
  remainingTiragesEstimate: number;
  lastTirageAt: string | null;
  nextDeadlineAt: string | null;
  maxGapHours: number;
  isNightWindow: boolean;
  status: "ok" | "behind" | "ahead" | "overdue";
  message: string;
};
