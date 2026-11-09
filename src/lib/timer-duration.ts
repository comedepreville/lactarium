/** Durée du minuteur mémorisée (réglage du chronomètre). */

export const TIMER_DURATION_STORAGE_KEY = "lactae:tirage-timer-duration";
export const TIMER_DURATION_CHANGE_EVENT = "lactae:tirage-timer-duration";

export const TIMER_DURATION_MIN = 5;
export const TIMER_DURATION_MAX = 30;
export const TIMER_DURATION_STEP = 5;
export const TIMER_DURATION_DEFAULT = 25;

/** Minutes réservées après le tirage pour le saisir (sinon bascule au lendemain). */
export const TIRAGE_LOG_BUFFER_MIN = 10;

export function clampTimerDuration(minutes: number): number {
  const snapped = Math.round(minutes / TIMER_DURATION_STEP) * TIMER_DURATION_STEP;
  return Math.min(TIMER_DURATION_MAX, Math.max(TIMER_DURATION_MIN, snapped));
}

export function readStoredTimerDuration(): number {
  if (typeof window === "undefined") return TIMER_DURATION_DEFAULT;
  try {
    const raw = window.localStorage.getItem(TIMER_DURATION_STORAGE_KEY);
    if (raw == null) return TIMER_DURATION_DEFAULT;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return TIMER_DURATION_DEFAULT;
    return clampTimerDuration(parsed);
  } catch {
    return TIMER_DURATION_DEFAULT;
  }
}

export function persistTimerDuration(minutes: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TIMER_DURATION_STORAGE_KEY,
      String(clampTimerDuration(minutes)),
    );
    window.dispatchEvent(new Event(TIMER_DURATION_CHANGE_EVENT));
  } catch {
    // Quota / mode privé
  }
}

export function subscribeTimerDuration(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TIMER_DURATION_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TIMER_DURATION_CHANGE_EVENT, onStoreChange);
  };
}
