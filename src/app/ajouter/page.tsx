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
      <header className="animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          {mode === "edit" ? "Modifier un tirage" : "Ajouter un tirage"}
        </h1>
      </header>

      <TirageForm
        mode={mode}
        tirageId={existing?.id}
        initialDatetime={existing?.datetime}
        initialQuantityMl={existing?.quantityMl}
      />

      <DeveloperCredit />
    </div>
  );
}
