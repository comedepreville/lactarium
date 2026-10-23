import Link from "next/link";
import {
  INFOS_LEGALES_PATH,
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_MAILTO,
} from "@/lib/legal";

export function DeveloperCredit() {
  return (
    <footer className="mt-12 space-y-2 text-center text-xs leading-relaxed tracking-wide text-[var(--ink-muted)]/80">
      <p>Développé avec ❤️ par Côme et Jeanne de Préville</p>
      <p>
        <a
          href={LEGAL_CONTACT_MAILTO}
          className="underline-offset-4 hover:text-[var(--rose-deep)] hover:underline"
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
        <span aria-hidden="true"> · </span>
        <Link
          href={INFOS_LEGALES_PATH}
          className="underline-offset-4 hover:text-[var(--rose-deep)] hover:underline"
        >
          Infos légales
        </Link>
      </p>
    </footer>
  );
}
