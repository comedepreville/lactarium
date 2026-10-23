import { RETENTION_YEARS } from "@/lib/legal";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

export type RetentionPurgeResult = {
  cutoffIso: string;
  tiragesDeleted: number;
  journalDeleted: number;
  accountsDeleted: number;
  accountErrors: number;
  via: "rpc" | "direct";
};

function retentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
  return cutoff;
}

type PurgeRpcResult = {
  cutoff?: string;
  tirages_deleted?: number;
  journal_deleted?: number;
};

async function purgeRowsDirect(
  cutoffIso: string,
): Promise<Pick<RetentionPurgeResult, "tiragesDeleted" | "journalDeleted">> {
  const admin = createAdminClient();

  const { error: tiragesError, count: tiragesCount } = await admin
    .from("tirages")
    .delete({ count: "exact" })
    .lt("datetime", cutoffIso);
  if (tiragesError) {
    throw new Error(`delete tirages: ${tiragesError.message}`);
  }

  const { error: journalError, count: journalCount } = await admin
    .from("journal_entries")
    .delete({ count: "exact" })
    .lt("datetime", cutoffIso);
  if (journalError) {
    throw new Error(`delete journal: ${journalError.message}`);
  }

  return {
    tiragesDeleted: tiragesCount ?? 0,
    journalDeleted: journalCount ?? 0,
  };
}

/**
 * Purge les tirages / journal > 2 ans, puis les comptes inactifs depuis 2 ans.
 * Nécessite SUPABASE_SERVICE_ROLE_KEY.
 */
export async function purgeExpiredData(): Promise<RetentionPurgeResult> {
  const admin = createAdminClient();
  const cutoff = retentionCutoff();
  const cutoffIso = cutoff.toISOString();

  let tiragesDeleted = 0;
  let journalDeleted = 0;
  let via: RetentionPurgeResult["via"] = "rpc";
  let resolvedCutoff = cutoffIso;

  const { data: rpcData, error: rpcError } = await admin.rpc(
    "purge_data_older_than_retention",
    { retention_years: RETENTION_YEARS },
  );

  if (rpcError) {
    console.warn(
      "[retention] RPC indisponible, fallback delete direct:",
      rpcError.message,
    );
    via = "direct";
    const direct = await purgeRowsDirect(cutoffIso);
    tiragesDeleted = direct.tiragesDeleted;
    journalDeleted = direct.journalDeleted;
  } else {
    const rpc = (rpcData ?? {}) as PurgeRpcResult;
    tiragesDeleted = Number(rpc.tirages_deleted ?? 0);
    journalDeleted = Number(rpc.journal_deleted ?? 0);
    if (rpc.cutoff) resolvedCutoff = rpc.cutoff;
  }

  let accountsDeleted = 0;
  let accountErrors = 0;
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`listUsers: ${error.message}`);
    }

    const users = data.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const lastSignIn = user.last_sign_in_at
        ? new Date(user.last_sign_in_at)
        : null;
      const createdAt = user.created_at ? new Date(user.created_at) : null;
      const activityAt = lastSignIn ?? createdAt;
      if (!activityAt || activityAt > cutoff) continue;

      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error("[retention] deleteUser", user.id, deleteError);
        accountErrors += 1;
      } else {
        accountsDeleted += 1;
      }
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return {
    cutoffIso: resolvedCutoff,
    tiragesDeleted,
    journalDeleted,
    accountsDeleted,
    accountErrors,
    via,
  };
}

const retentionGlobal = globalThis as typeof globalThis & {
  __lactaeRetentionSchedulerStarted?: boolean;
};

/** Vérifie la rétention une fois par jour (même processus que le scheduler push). */
export function startRetentionScheduler(): void {
  if (retentionGlobal.__lactaeRetentionSchedulerStarted) return;
  if (!hasAdminClient()) {
    console.info(
      "[retention] Scheduler inactif — SUPABASE_SERVICE_ROLE_KEY manquant",
    );
    return;
  }

  retentionGlobal.__lactaeRetentionSchedulerStarted = true;

  const tick = () => {
    void purgeExpiredData()
      .then((result) => {
        console.info("[retention] purge", result);
      })
      .catch((error) => {
        console.error("[retention] purgeExpiredData", error);
      });
  };

  tick();
  setInterval(tick, DAY_MS);
  console.info("[retention] Scheduler démarré (toutes les 24 h)");
}
