"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/ajouter", label: "Ajouter", icon: Plus },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="page-shell sticky top-0 z-40">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="group min-w-0">
          <span className="font-display text-2xl tracking-tight text-[var(--rose-deep)] transition-colors group-hover:text-[var(--rose-dust)]">
            Lactarium
          </span>
        </Link>

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
      </div>
    </header>
  );
}
