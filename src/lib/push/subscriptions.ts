import { createClient } from "@/lib/supabase/server";
import type { PushSubscriptionKeys } from "./types";

export async function upsertPushSubscription(
  input: PushSubscriptionKeys,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) throw error;
}

export async function userHasPushSubscription(): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return (count ?? 0) > 0;
}
