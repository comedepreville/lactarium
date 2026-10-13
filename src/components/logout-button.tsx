"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
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
      aria-label="Se déconnecter"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:bg-[var(--blush)] hover:text-[var(--ink)] disabled:opacity-60",
        className,
      )}
    >
      <LogOut className="size-4" />
    </button>
  );
}
