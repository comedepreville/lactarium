import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseUrl } from "./env";

type AdminClient = SupabaseClient<Database>;

const adminGlobal = globalThis as typeof globalThis & {
  __lactaeAdminClient?: AdminClient;
};

/** Client service role — cron / envoi push uniquement (singleton process). */
export function createAdminClient(): AdminClient {
  if (adminGlobal.__lactaeAdminClient) {
    return adminGlobal.__lactaeAdminClient;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant");
  }

  const client = createClient<Database>(getSupabaseUrl(), key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  adminGlobal.__lactaeAdminClient = client;
  return client;
}

export function hasAdminClient(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Erreurs PostgREST de saturation du pool Postgres (PGRST003, etc.). */
export function isPoolSaturationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return (
    code === "PGRST003" ||
    message.includes("pgrst003") ||
    message.includes("connection pool") ||
    message.includes("too many connections")
  );
}

const POOL_BACKOFF_BASE_MS = 60_000;
const POOL_BACKOFF_MAX_MS = 15 * 60_000;

const poolGlobal = globalThis as typeof globalThis & {
  __lactaePoolBackoffUntil?: number;
  __lactaePoolBackoffMs?: number;
};

/** true si un cron doit s’abstenir d’appeler Supabase (pool saturé). */
export function isPoolBackingOff(): boolean {
  return Date.now() < (poolGlobal.__lactaePoolBackoffUntil ?? 0);
}

export function clearPoolBackoff(): void {
  poolGlobal.__lactaePoolBackoffMs = POOL_BACKOFF_BASE_MS;
  poolGlobal.__lactaePoolBackoffUntil = 0;
}

/** Enregistre une saturation : pause partagée push + rétention. */
export function notePoolSaturation(source: string): number {
  const prev = poolGlobal.__lactaePoolBackoffMs ?? POOL_BACKOFF_BASE_MS;
  const next = Math.min(prev * 2, POOL_BACKOFF_MAX_MS);
  poolGlobal.__lactaePoolBackoffMs = next;
  poolGlobal.__lactaePoolBackoffUntil = Date.now() + next;
  console.warn(
    `[${source}] Pool saturé — pause partagée ${Math.round(next / 1000)}s`,
  );
  return next;
}
