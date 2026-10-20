"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, CalendarDays, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/journal", label: "Journal", icon: BookHeart },
];

export function SiteHeader({ displayName }: { displayName?: string | null }) {
  const pathname = usePathname();
  const profileActive = pathname.startsWith("/profil");

  return (
    <header className="page-shell sticky top-0 z-40">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" prefetch={false} className="group min-w-0">
          <span className="font-display text-2xl tracking-tight text-[var(--rose-deep)] transition-colors group-hover:text-[var(--rose-dust)]">
            Lactae
          </span>
          {displayName ? (
            <span className="mt-0.5 block truncate text-xs text-[var(--ink-muted)]">
              {displayName}
            </span>
          ) : null}
        </Link>

        <div className="flex items-center gap-1">
          <nav
            aria-label="Navigation principale"
            className="surface-card flex items-center gap-1 rounded-full p-1"
          >
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  aria-label={link.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--rose-dust)] text-[var(--primary-foreground)] shadow-sm"
                      : "text-[var(--ink-muted)] hover:bg-[var(--blush)] hover:text-[var(--ink)]",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <Link
            href="/profil"
            prefetch={false}
            aria-label="Profil"
            aria-current={profileActive ? "page" : undefined}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full transition-colors",
              profileActive
                ? "bg-[var(--rose-dust)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--ink-muted)] hover:bg-[var(--blush)] hover:text-[var(--ink)]",
            )}
          >
            <UserRound className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
