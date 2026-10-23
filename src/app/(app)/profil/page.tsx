import Link from "next/link";
import { DeleteAccountSection } from "@/components/delete-account-section";
import { ExportDataButton } from "@/components/export-data-button";
import { LogoutButton } from "@/components/logout-button";
import { PasswordForm } from "@/components/password-form";
import { ProfileForm } from "@/components/profile-form";
import { PushNotificationsCard } from "@/components/push-notifications-card";
import { INFOS_LEGALES_PATH, RETENTION_YEARS } from "@/lib/legal";
import { getCurrentUser, getProfile } from "@/lib/profile";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);
  if (!user) redirect("/connexion");
  if (!profile) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <section className="animate-rise space-y-2 pt-2">
        <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
          Profil
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
          Gérez votre compte, votre objectif et vos données Lactae.
        </p>
        {user.email ? (
          <p className="text-sm text-[var(--ink-muted)]">{user.email}</p>
        ) : null}
      </section>

      <ProfileForm profile={profile} />
      <PasswordForm />
      <PushNotificationsCard />
      <ExportDataButton />

      <section className="animate-rise space-y-2 px-1">
        <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
          Vos tirages et votre journal sont conservés {RETENTION_YEARS} ans
          maximum. Détails :{" "}
          <Link
            href={INFOS_LEGALES_PATH}
            className="font-medium text-[var(--rose-deep)] underline-offset-4 hover:underline"
          >
            Infos légales
          </Link>
          .
        </p>
      </section>

      <section className="surface-card animate-rise space-y-3 rounded-[2rem] px-5 py-6 sm:px-6">
        <div className="space-y-1">
          <h2 className="font-display text-2xl text-[var(--ink)]">Session</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            Déconnectez-vous de cet appareil.
          </p>
        </div>
        <LogoutButton
          label="Se déconnecter"
          className="h-12 w-full rounded-full border border-[var(--line)] bg-transparent text-[var(--ink)] hover:bg-[var(--blush)]"
        />
      </section>

      <DeleteAccountSection />
    </div>
  );
}
