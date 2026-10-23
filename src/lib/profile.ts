import type { Database } from "./supabase/database.types";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    pumpingStartDate: row.pumping_start_date,
    userType: row.user_type,
    targetMl24h: row.target_ml_24h,
    timezone: row.timezone,
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export function isOnboardingComplete(profile: Profile | null): boolean {
  return Boolean(profile?.onboardingCompletedAt);
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getProfile(
  userId?: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  let id = userId;
  if (!id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    id = user.id;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }
  return user;
}
