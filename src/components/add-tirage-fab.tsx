import { Plus } from "lucide-react";
import { FloatingActionLink } from "@/components/floating-action-link";

export function AddTirageFab() {
  return (
    <FloatingActionLink href="/ajouter/minuteur" label="Ajouter un tirage">
      <Plus className="size-6" strokeWidth={2.25} aria-hidden />
    </FloatingActionLink>
  );
}
