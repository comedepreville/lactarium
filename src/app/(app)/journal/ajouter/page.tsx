import { DeveloperCredit } from "@/components/developer-credit";
import { JournalForm } from "@/components/journal-form";
import { getJournalEntry } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function JournalAjouterPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const existing = id ? await getJournalEntry(id) : null;
  const mode = existing ? "edit" : "create";

  return (
    <div className="space-y-6">
      <header className="animate-rise space-y-2 px-1">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {mode === "edit" ? "Édition" : "Nouveau"}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
          {mode === "edit" ? "Modifier un événement" : "Ajouter un événement"}
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Date et heure à Paris, texte libre.
        </p>
      </header>

      <JournalForm
        mode={mode}
        entryId={existing?.id}
        initialDatetime={existing?.datetime}
        initialText={existing?.text}
      />

      <DeveloperCredit />
    </div>
  );
}
