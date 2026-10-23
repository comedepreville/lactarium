export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startPushScheduler } = await import("@/lib/push/scheduler");
  startPushScheduler();

  const { startRetentionScheduler } = await import("@/lib/retention");
  startRetentionScheduler();
}
