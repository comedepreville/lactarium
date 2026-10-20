import { revalidatePath } from "next/cache";

/**
 * Invalide le cache serveur des vues dépendantes.
 * Couplé à `router.refresh()` côté client après mutation.
 *
 * On invalide le layout `(app)` pour couvrir Accueil / Calendrier / Journal
 * d’un coup (segments enfants inclus).
 */
export function revalidateTiragesViews() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/calendrier");
  revalidatePath("/ajouter");
  revalidatePath("/ajouter/minuteur");
}

/** Invalide les vues du journal de vie. */
export function revalidateJournalViews() {
  revalidatePath("/", "layout");
  revalidatePath("/journal");
  revalidatePath("/journal/ajouter");
}

/** Invalide les vues liées au profil (nom, objectif, etc.). */
export function revalidateProfileViews() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/profil");
  revalidatePath("/calendrier");
}
