import { Feather } from "lucide-react";
import { FloatingActionLink } from "@/components/floating-action-link";

export function AddJournalFab() {
  return (
    <FloatingActionLink href="/journal/ajouter" label="Ajouter un événement">
      <Feather className="size-6" strokeWidth={2.25} aria-hidden />
    </FloatingActionLink>
  );
}
