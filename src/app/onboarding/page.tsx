import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getCurrentUser, getProfile, isOnboardingComplete } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const profile = await getProfile(user.id);
  if (isOnboardingComplete(profile)) {
    redirect("/");
  }

  return (
    <main className="page-shell mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
      <div className="space-y-8">
        <header className="animate-rise space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Premiers pas
          </p>
          <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
            Bienvenue sur Lactae
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
            Quelques infos pour personnaliser votre suivi.
          </p>
        </header>
        <OnboardingForm
          initialDisplayName={profile?.displayName}
          initialChildFirstName={profile?.childFirstName}
          initialChildBirthDate={profile?.childBirthDate}
        />
      </div>
    </main>
  );
}
