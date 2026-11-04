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
      : "";
  return (
    code === "PGRST003" ||
    message.includes("connection pool") ||
    message.includes("too many connections")
  );
}
