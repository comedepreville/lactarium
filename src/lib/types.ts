import type { UserType } from "./supabase/database.types";

export type Tirage = {
  id: string;
  /** ISO datetime in UTC; displayed in Europe/Paris */
  datetime: string;
  quantityMl: number;
};

export type JournalEntry = {
  id: string;
  /** ISO datetime in UTC; displayed in Europe/Paris */
  datetime: string;
  text: string;
};

export type Profile = {
  id: string;
  displayName: string | null;
  childFirstName: string | null;
  childBirthDate: string | null;
  userType: UserType;
  targetMl24h: number;
  timezone: string;
  onboardingCompletedAt: string | null;
};

export type JournalDaySummary = {
  dateKey: string;
  label: string;
  count: number;
  entries: JournalEntry[];
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
  /** Volume déjà tiré sur la journée calendaire Europe/Paris */
  drawnMlToday: number;
  remainingMl: number;
  tirageCountToday: number;
  /** Moyenne glissante des 3 derniers tirages (cross-day) */
  avgMlLast3: number;
  recommendedTiragesPerDay: number;
  remainingTiragesEstimate: number;
  lastTirageAt: string | null;
  /** Prochain tirage recommandé (ISO), null si objectif du jour atteint */
  nextSuggestedAt: string | null;
  /** Intervalle suggéré en heures, borné entre 1 h et 5 h */
  suggestedIntervalHours: number | null;
  /** true si le calcul brut dépassait 5 h (plafond appliqué) */
  intervalCappedHigh: boolean;
  /** Première échéance depuis le dernier tirage déjà dépassée */
  cadenceOverdue: boolean;
  /** Plus de 5 h depuis le dernier tirage */
  maxGapOverdue: boolean;
  maxGapHours: number;
  isNightWindow: boolean;
  status: "ok" | "behind" | "ahead" | "overdue";
  message: string;
};
