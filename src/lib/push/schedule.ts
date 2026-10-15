import { parseISO } from "date-fns";
import { computeDashboard } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { listTirages } from "@/lib/storage";
import { getProfile } from "@/lib/profile";
import { TARGET_ML_24H } from "@/lib/time";
import type { PushKind } from "./types";

const REMINDER_DEDUPE = "reminder_10min";
const TIMER_DEDUPE = "timer_done";
const REMINDER_LEAD_MS = 10 * 60 * 1000;

async function cancelPending(dedupeKey: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_notifications")
    .update({ status: "cancelled" })
    .eq("dedupe_key", dedupeKey)
    .eq("status", "pending");

  if (error) throw error;
}

async function insertPending(input: {
  kind: PushKind;
  dedupeKey: string;
  fireAt: Date;
  title: string;
  body: string;
  url: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  await cancelPending(input.dedupeKey);

  const { error } = await supabase.from("scheduled_notifications").insert({
    user_id: user.id,
    kind: input.kind,
    dedupe_key: input.dedupeKey,
    fire_at: input.fireAt.toISOString(),
    title: input.title,
    body: input.body,
    url: input.url,
    status: "pending",
  });

  if (error) throw error;
}

/** Recalcule le rappel −10 min d’après l’échéance dashboard. */
export async function rescheduleReminder10Min(): Promise<{
  scheduled: boolean;
  fireAt: string | null;
}> {
  const [tirages, profile] = await Promise.all([listTirages(), getProfile()]);
  const advice = computeDashboard(
    tirages,
    profile?.targetMl24h ?? TARGET_ML_24H,
  );

  await cancelPending(REMINDER_DEDUPE);

  if (!advice.nextSuggestedAt || advice.remainingMl <= 0) {
    return { scheduled: false, fireAt: null };
  }

  const deadline = parseISO(advice.nextSuggestedAt);
  const fireAt = new Date(deadline.getTime() - REMINDER_LEAD_MS);
  if (fireAt.getTime() <= Date.now()) {
    return { scheduled: false, fireAt: null };
  }

  await insertPending({
    kind: "reminder_10min",
    dedupeKey: REMINDER_DEDUPE,
    fireAt,
    title: "Tirage dans 10 min",
    body: "Pensez à tirer votre lait — l’échéance approche.",
    url: "/ajouter/minuteur",
  });

  return { scheduled: true, fireAt: fireAt.toISOString() };
}

export async function scheduleTimerDone(fireAtIso: string): Promise<void> {
  const fireAt = parseISO(fireAtIso);
  if (Number.isNaN(fireAt.getTime())) {
    throw new Error("fireAt invalide");
  }
  if (fireAt.getTime() <= Date.now() - 5_000) {
    throw new Error("fireAt déjà passé");
  }

  await insertPending({
    kind: "timer_done",
    dedupeKey: TIMER_DEDUPE,
    fireAt,
    title: "Tirage fini !",
    body: "C’est le moment de noter le volume.",
    url: `/ajouter?datetime=${encodeURIComponent(fireAt.toISOString())}`,
  });
}

export async function cancelTimerDone(): Promise<void> {
  await cancelPending(TIMER_DEDUPE);
}
