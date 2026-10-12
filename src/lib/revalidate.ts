import { revalidatePath } from "next/cache";

/** Invalide toutes les vues qui dépendent des tirages (dashboard inclus). */
export function revalidateTiragesViews() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/calendrier");
  revalidatePath("/ajouter");
}

/** Invalide les vues du journal de vie. */
export function revalidateJournalViews() {
  revalidatePath("/", "layout");
  revalidatePath("/journal");
  revalidatePath("/journal/ajouter");
}
