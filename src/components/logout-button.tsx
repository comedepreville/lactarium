"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Si fourni, affiche un bouton texte plutôt que l’icône seule. */
  label?: string;
};

export function LogoutButton({ className, label }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/connexion");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      aria-label={label ?? "Se déconnecter"}
      className={cn(
        label
          ? "inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-60"
          : "inline-flex size-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:bg-[var(--blush)] hover:text-[var(--ink)] disabled:opacity-60",
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden />
      {label ? <span>{pending ? "Déconnexion…" : label}</span> : null}
    </button>
  );
}
