import type { Metadata } from "next";
import Link from "next/link";
import { DeveloperCredit } from "@/components/developer-credit";
import {
  INFOS_LEGALES_PATH,
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_MAILTO,
  RETENTION_YEARS,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Infos légales — Lactae",
  description:
    "Mentions, données personnelles, conservation et contact pour Lactae.",
};

export default function InfosLegalesPage() {
  return (
    <main className="page-shell mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10">
      <article className="animate-rise space-y-10">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Transparence
          </p>
          <h1 className="font-display text-4xl tracking-tight text-[var(--rose-deep)] sm:text-5xl">
            Infos légales
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
            Tout ce qu’il est utile de savoir sur Lactae, vos données et vos
            droits — en une seule page.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[var(--ink)]">
            Qui est derrière Lactae ?
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            Lactae est un projet bénévole personnel édité par{" "}
            <strong className="font-medium">Côme de Préville</strong>.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Contact :{" "}
            <a
              href={LEGAL_CONTACT_MAILTO}
              className="font-medium text-[var(--rose-deep)] underline-offset-4 hover:underline"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[var(--ink)]">
            À quoi sert Lactae ?
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            Lactae vous aide à suivre vos tirages de lait (volumes, horaires,
            notes, journal). C’est un outil personnel de suivi.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Lactae n’est pas un dispositif médical et ne remplace pas l’avis
            d’un professionnel de santé.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[var(--ink)]">
            Quelles données sont collectées ?
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink)]">
            <li>Votre e-mail et mot de passe (pour le compte)</li>
            <li>Votre prénom et la date de début de tirage de lait</li>
            <li>Vos tirages (date, volume, durée, notes éventuelles)</li>
            <li>Votre journal (textes libres)</li>
            <li>
              Si vous activez les notifications : identifiants techniques de
              votre appareil pour l’envoi des rappels
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Ces informations servent uniquement à faire fonctionner l’app pour
            vous. Elles ne sont pas vendues ni utilisées pour de la publicité.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[var(--ink)]">
            Où sont stockées les données ?
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            Les données du compte et du suivi sont hébergées chez{" "}
            <strong className="font-medium">Supabase</strong> (Irlande, Union
            européenne).
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            L’application web est hébergée sur un{" "}
            <strong className="font-medium">VPS Hostinger à Paris</strong>{" "}
            (France).
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Chaque compte ne voit que ses propres données (contrôle d’accès
            côté base).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[var(--ink)]">
            Combien de temps sont-elles gardées ?
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            Les tirages et le journal sont conservés au maximum{" "}
            <strong className="font-medium">{RETENTION_YEARS} ans</strong>,
            puis effacés automatiquement.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            Si vous ne vous connectez plus pendant {RETENTION_YEARS} ans, votre
            compte est aussi supprimé (ainsi que les données associées).
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Vous pouvez supprimer votre compte à tout moment depuis la page
            Profil.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[var(--ink)]">
            Vos droits
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            Vous pouvez accéder à vos données, les modifier, les exporter
            (CSV) ou supprimer votre compte depuis Lactae.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Pour toute question sur vos données, écrivez à{" "}
            <a
              href={LEGAL_CONTACT_MAILTO}
              className="font-medium text-[var(--rose-deep)] underline-offset-4 hover:underline"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[var(--ink)]">Cookies</h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            Lactae utilise uniquement des cookies nécessaires pour vous garder
            connecté·e. Pas de cookies publicitaires, pas d’outil de mesure
            d’audience tiers.
          </p>
        </section>

        <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
          Page {INFOS_LEGALES_PATH} — mise à jour : 23 octobre 2026.
        </p>

        <p className="text-sm text-[var(--ink-muted)]">
          <Link
            href="/"
            className="font-medium text-[var(--rose-deep)] underline-offset-4 hover:underline"
          >
            Retour à l’app
          </Link>
        </p>
      </article>

      <DeveloperCredit />
    </main>
  );
}
