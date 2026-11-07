/**
 * Session active du minuteur de tirage.
 *
 * Approche : deadline absolue (wall clock), pas un tick React.
 * Sur remount PWA / kill WebView, on recalcule le restant depuis `endAt`.
 */

export const TIMER_SESSION_STORAGE_KEY = "lactae:tirage-timer-session";
export const TIMER_SESSION_CHANGE_EVENT = "lactae:tirage-timer-session";

const DURATION_MIN = 5;
const DURATION_MAX = 30;
const DURATION_STEP = 5;

export type TimerSessionPhase = "running" | "paused";

export type TimerSession = {
  version: 1;
  phase: TimerSessionPhase;
  durationMin: number;
  /** Epoch ms — échéance absolue quand `phase === "running"`. */
  endAt: number | null;
  /** Restant figé quand `phase === "paused"`. */
  remainingMs: number | null;
  updatedAt: number;
};

export type ResolvedTimerSession = {
  phase: TimerSessionPhase | "done";
  durationMin: number;
  endAt: number | null;
  remainingMs: number;
};

function clampDuration(minutes: number): number {
  const snapped = Math.round(minutes / DURATION_STEP) * DURATION_STEP;
  return Math.min(DURATION_MAX, Math.max(DURATION_MIN, snapped));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSession(raw: string): TimerSession | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return null;
    if (parsed.phase !== "running" && parsed.phase !== "paused") return null;
    if (typeof parsed.durationMin !== "number") return null;
    if (parsed.endAt != null && typeof parsed.endAt !== "number") return null;
    if (parsed.remainingMs != null && typeof parsed.remainingMs !== "number") {
      return null;
    }
    if (typeof parsed.updatedAt !== "number") return null;

    return {
      version: 1,
      phase: parsed.phase,
      durationMin: clampDuration(parsed.durationMin),
      endAt: parsed.endAt ?? null,
      remainingMs: parsed.remainingMs ?? null,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

/** Interprète une session brute à l’instant `now` (restant / terminé). */
export function resolveTimerSession(
  session: TimerSession,
  now = Date.now(),
): ResolvedTimerSession {
  const durationMin = clampDuration(session.durationMin);

  if (session.phase === "paused") {
    const remainingMs = Math.max(0, session.remainingMs ?? 0);
    if (remainingMs <= 0) {
      return { phase: "done", durationMin, endAt: null, remainingMs: 0 };
    }
    return {
      phase: "paused",
      durationMin,
      endAt: null,
      remainingMs,
    };
  }

  const endAt = session.endAt;
  if (endAt == null) {
    return { phase: "done", durationMin, endAt: null, remainingMs: 0 };
  }

  const remainingMs = endAt - now;
  if (remainingMs <= 0) {
    return { phase: "done", durationMin, endAt, remainingMs: 0 };
  }

  return {
    phase: "running",
    durationMin,
    endAt,
    remainingMs,
  };
}

/** Cache snapshot pour `useSyncExternalStore` (référence stable si inchangé). */
let cachedRaw: string | null | undefined;
let cachedSession: TimerSession | null = null;

export function readTimerSession(): TimerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TIMER_SESSION_STORAGE_KEY);
    if (raw === cachedRaw) return cachedSession;
    cachedRaw = raw;
    cachedSession = raw == null ? null : parseSession(raw);
    return cachedSession;
  } catch {
    cachedRaw = undefined;
    cachedSession = null;
    return null;
  }
}

export function writeTimerSession(
  input: Omit<TimerSession, "version" | "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  const session: TimerSession = {
    version: 1,
    phase: input.phase,
    durationMin: clampDuration(input.durationMin),
    endAt: input.endAt,
    remainingMs: input.remainingMs,
    updatedAt: Date.now(),
  };
  try {
    const raw = JSON.stringify(session);
    window.localStorage.setItem(TIMER_SESSION_STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedSession = session;
    window.dispatchEvent(new Event(TIMER_SESSION_CHANGE_EVENT));
  } catch {
    // Quota / mode privé : on ignore.
  }
}

export function clearTimerSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TIMER_SESSION_STORAGE_KEY);
    cachedRaw = null;
    cachedSession = null;
    window.dispatchEvent(new Event(TIMER_SESSION_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeTimerSession(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TIMER_SESSION_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TIMER_SESSION_CHANGE_EVENT, onStoreChange);
  };
}

/** Snapshot résolu pour l’UI (null = pas de session). */
export function readResolvedTimerSession(
  now = Date.now(),
): ResolvedTimerSession | null {
  const session = readTimerSession();
  if (!session) return null;
  return resolveTimerSession(session, now);
}

export function formatTimerMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Construit une session « running » à partir d’une notif serveur pending.
 * Secours si le localStorage a été vidé mais le push `timer_done` existe encore.
 */
export function sessionFromPendingPush(input: {
  fireAtIso: string;
  durationMin?: number | null;
}): TimerSession | null {
  const endAt = Date.parse(input.fireAtIso);
  if (!Number.isFinite(endAt)) return null;

  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) return null;

  const fromRemaining = Math.ceil(remainingMs / 60_000);
  const durationMin = clampDuration(
    input.durationMin != null && Number.isFinite(input.durationMin)
      ? input.durationMin
      : Math.max(DURATION_MIN, fromRemaining),
  );

  return {
    version: 1,
    phase: "running",
    durationMin,
    endAt,
    remainingMs: null,
    updatedAt: Date.now(),
  };
}
