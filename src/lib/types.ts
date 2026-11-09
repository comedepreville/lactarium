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
  /** Moyenne glissante des 3 derniers tirages (cross-day), sert à la cadence */
  avgMlLast3: number;
  /** Moyenne des 2 derniers tirages ; 0 s’il n’y en a aucun */
  avgMlLast2: number;
  recommendedTiragesPerDay: number;
  remainingTiragesEstimate: number;
  lastTirageAt: string | null;
  /** Prochain tirage recommandé (ISO), null si objectif du jour atteint */
  nextSuggestedAt: string | null;
  /** Jusqu’à trois prochaines échéances, la première en tête */
  upcoming: UpcomingTirage[];
  /** Intervalle entre créneaux (h), plafonné à 5 h */
  suggestedIntervalHours: number | null;
  /** true si le calcul brut dépassait 5 h (plafond appliqué) */
  intervalCappedHigh: boolean;
  /** Premier créneau = « Maintenant » (≥ 5 h depuis le dernier tirage) */
  cadenceOverdue: boolean;
  /** ≥ 5 h depuis le dernier tirage */
  maxGapOverdue: boolean;
  maxGapHours: number;
  isNightWindow: boolean;
  status: "ok" | "behind" | "ahead" | "overdue";
  message: string;
};
