import type { UserType } from "./supabase/database.types";

export type Tirage = {
  id: string;
  /** ISO datetime in UTC; displayed in Europe/Paris */
  datetime: string;
  quantityMl: number;
  /** Durée du tirage en minutes */
  duration: number;
  /** Optional free-text note (max 500 chars); null when empty */
  notes: string | null;
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
  pumpingStartDate: string | null;
  userType: UserType;
  targetMl24h: number;
  timezone: string;
  onboardingCompletedAt: string | null;
  consentInfosLegalesAt: string | null;
  consentHealthAt: string | null;
  consentLegalVersion: string | null;
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

export type UpcomingTirage = {
  /** ISO UTC */
  at: string;
  /** Échéance déjà passée : afficher « Maintenant » plutôt que l’heure */
  asap: boolean;
};

export type DashboardAdvice = {
  targetMl: number;
  /** Volume déjà tiré sur la journée calendaire Europe/Paris */
  drawnMlToday: number;
  remainingMl: number;
  tirageCountToday: number;
  /** Moyenne des 3 derniers tirages (cross-day) */
  avgMlLast3: number;
  /** Tirages encore nécessaires avant le cutoff du jour */
  remainingTiragesEstimate: number;
  lastTirageAt: string | null;
  /** Prochain tirage recommandé (ISO), null si objectif du jour atteint */
  nextSuggestedAt: string | null;
  /** Trois prochaines échéances (déborde sur le lendemain si besoin) */
  upcoming: UpcomingTirage[];
  /** true si le calcul brut d’intervalle dépassait 5 h (plafond appliqué) */
  intervalCappedHigh: boolean;
  /** ≥ 5 h depuis le dernier tirage */
  maxGapOverdue: boolean;
  /** Fin de fenêtre « aujourd’hui » (minuit − durée chrono − 10 min), ISO */
  cutoffAt: string;
  status: "ok" | "behind" | "ahead" | "overdue";
  message: string;
};
