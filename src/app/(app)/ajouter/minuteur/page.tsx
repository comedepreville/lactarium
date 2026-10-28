import { TirageCountdown } from "@/components/tirage-countdown";
import { DeveloperCredit } from "@/components/developer-credit";

export const dynamic = "force-dynamic";

export default function MinuteurPage() {
  return (
    <div className="space-y-6">
      <header className="animate-rise space-y-2 px-1 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Tirage
        </p>
        <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
          Timer
        </h1>
        <p className="mx-auto max-w-sm text-sm text-[var(--ink-muted)]">
          Réglez la durée, lancez le minuteur, puis notez le volume.
        </p>
      </header>

      <TirageCountdown />

      <DeveloperCredit />
    </div>
  );
}
