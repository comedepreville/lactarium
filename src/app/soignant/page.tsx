import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser, getProfile, isSoignant } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function SoignantPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const profile = await getProfile(user.id);
  if (!isSoignant(profile)) {
    redirect("/");
  }

  return (
    <main className="page-shell mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl tracking-tight text-[var(--rose-deep)]">
            Lactae
          </p>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Espace soignant
          </p>
        </div>
        <LogoutButton />
      </div>
      <div className="animate-rise space-y-3">
        <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)]">
          Bientôt disponible
        </h1>
        <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
          L’interface soignant arrive dans une prochaine étape.
        </p>
      </div>
    </main>
  );
}
