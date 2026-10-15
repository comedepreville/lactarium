import { createAdminClient } from "./supabase/admin";
import { getCurrentUser, getProfile, isAdmin } from "./profile";
import type { Profile } from "./types";

export type AdminStats = {
  usersCount: number;
  soignantsCount: number;
  tiragesLast24h: number;
  journalLast24h: number;
};

export type AdminUserListItem = {
  id: string;
  displayName: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
};

export async function requireAdmin(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  profile: Profile;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  const profile = await getProfile(user.id);
  if (!isAdmin(profile) || !profile) {
    throw new Error("FORBIDDEN");
  }
  return { user, profile };
}

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [users, soignants, tirages, journal] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_type", "user"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_type", "soignant"),
    admin
      .from("tirages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    admin
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  if (users.error) throw users.error;
  if (soignants.error) throw soignants.error;
  if (tirages.error) throw tirages.error;
  if (journal.error) throw journal.error;

  return {
    usersCount: users.count ?? 0,
    soignantsCount: soignants.count ?? 0,
    tiragesLast24h: tirages.count ?? 0,
    journalLast24h: journal.count ?? 0,
  };
}

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, display_name, onboarding_completed_at, created_at")
    .eq("user_type", "user")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
  }));
}

export async function createSoignantAccount(input: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Création utilisateur impossible");

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      user_type: "soignant",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", data.user.id);

  if (profileError) throw profileError;

  return { id: data.user.id, email: input.email };
}
