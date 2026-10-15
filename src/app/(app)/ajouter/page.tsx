import { TirageForm } from "@/components/tirage-form";
import { DeveloperCredit } from "@/components/developer-credit";
import { getTirage } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AjouterPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const existing = id ? await getTirage(id) : null;
  const mode = existing ? "edit" : "create";

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
        initialDatetime={existing?.datetime}
        initialQuantityMl={existing?.quantityMl}
        initialNotes={existing?.notes}
      />

      <DeveloperCredit />
    </div>
  );
}
