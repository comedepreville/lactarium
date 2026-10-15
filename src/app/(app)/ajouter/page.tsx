import { TirageForm } from "@/components/tirage-form";
import { DeveloperCredit } from "@/components/developer-credit";
import { getTirage } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    id?: string;
    datetime?: string;
    duration?: string;
  }>;
};

function parseDuration(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 120) return null;
  return n;
}

function parseDatetime(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default async function AjouterPage({ searchParams }: Props) {
  const params = await searchParams;
  const existing = params.id ? await getTirage(params.id) : null;
  const mode = existing ? "edit" : "create";

  const queryDatetime = parseDatetime(params.datetime);
  const queryDuration = parseDuration(params.duration);
  const requireManualDuration =
    mode === "create" && queryDatetime != null && queryDuration == null;

  return (
    <div className="space-y-6">
      <header className="animate-rise space-y-2 px-1">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {mode === "edit" ? "Édition" : "Nouveau"}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
          {mode === "edit" ? "Modifier un tirage" : "Ajouter un tirage"}
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Heure à Paris, quantités par pas de 10 ml.
        </p>
      </header>

      <TirageForm
        mode={mode}
        tirageId={existing?.id}
        initialDatetime={existing?.datetime ?? queryDatetime}
        initialQuantityMl={existing?.quantityMl}
        initialDuration={
          existing
            ? existing.duration > 0
              ? existing.duration
              : null
            : queryDuration
        }
        initialNotes={existing?.notes}
        requireManualDuration={requireManualDuration}
      />

      <DeveloperCredit />
    </div>
  );
}
