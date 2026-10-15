import { AdminCreateSoignant } from "@/components/admin-create-soignant";
import { getAdminStats, listAdminUsers } from "@/lib/admin";
import { formatParisDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function formatOnboardingDate(iso: string | null): string {
  if (!iso) return "Onboarding non terminé";
  return formatParisDate(iso);
}

export default async function AdminHomePage() {
  const [stats, users] = await Promise.all([
    getAdminStats(),
    listAdminUsers(),
  ]);

  const metrics = [
    { label: "Utilisateurs", value: stats.usersCount },
    { label: "Soignants", value: stats.soignantsCount },
    { label: "Tirages (24 h)", value: stats.tiragesLast24h },
    { label: "Souvenirs (24 h)", value: stats.journalLast24h },
  ];

  return (
    <div className="space-y-10">
      <section className="animate-rise space-y-3 pt-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Tableau de bord
        </p>
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-[var(--rose-deep)]">
          Administration
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
          Vue d’ensemble de l’activité et gestion des comptes soignants.
        </p>
      </section>

      <section className="animate-rise grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {metric.label}
            </p>
            <p className="font-display text-4xl tracking-tight text-[var(--ink)]">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <AdminCreateSoignant />

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-3xl text-[var(--ink)]">
            Utilisateurs
          </h2>
          <p className="text-sm text-[var(--ink-muted)]">
            Par ordre de création du compte.
          </p>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            Aucun utilisateur pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-baseline justify-between gap-4 py-3.5"
              >
                <span className="font-medium text-[var(--ink)]">
                  {user.displayName?.trim() || "Sans prénom"}
                </span>
                <span className="shrink-0 text-sm text-[var(--ink-muted)]">
                  {formatOnboardingDate(user.onboardingCompletedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
