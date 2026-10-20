"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "Suppression impossible");
        }

        const supabase = createClient();
        await supabase.auth.signOut();
        setOpen(false);
        router.replace("/connexion");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <section className="surface-card animate-rise space-y-4 rounded-[2rem] border border-[#e8c4bf] px-5 py-6 sm:px-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl text-[#7a3f3d]">
          Supprimer mon compte
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Cette action est définitive : tirages, journal et profil seront
          effacés.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setPassword("");
          setError(null);
          setOpen(true);
        }}
        className="h-12 w-full rounded-full border-[#d4a5a0] bg-transparent text-[#7a3f3d] hover:bg-[#f3ddd8]"
      >
        Supprimer mon compte
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
          if (!next) {
            setPassword("");
            setError(null);
          }
        }}
      >
        <DialogContent className="rounded-[1.75rem] bg-[var(--surface)] sm:max-w-md">
          <form onSubmit={confirmDelete} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[var(--ink)]">
                Confirmer la suppression
              </DialogTitle>
              <DialogDescription className="text-[var(--ink-muted)]">
                Entrez votre mot de passe pour supprimer définitivement votre
                compte Lactae.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label
                htmlFor="deletePassword"
                className="text-[var(--ink-muted)]"
              >
                Mot de passe
              </Label>
              <input
                id="deletePassword"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pill-field"
                required
              />
            </div>

            {error ? (
              <p className="rounded-full bg-[#f3ddd8] px-4 py-3 text-sm text-[#7a3f3d]">
                {error}
              </p>
            ) : null}

            <DialogFooter className="border-0 bg-transparent p-0 sm:justify-stretch">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="h-11 flex-1 rounded-full"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={pending || !password}
                className="h-11 flex-1 rounded-full bg-[#7a3f3d] text-white hover:bg-[#5f2f2e]"
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Suppression…
                  </>
                ) : (
                  "Supprimer définitivement"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
