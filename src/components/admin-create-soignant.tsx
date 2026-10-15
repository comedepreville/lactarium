"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AdminCreateSoignant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/soignants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Création impossible");
        }
        setSuccess(`Soignant créé : ${email}`);
        setEmail("");
        setPassword("");
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-[var(--ink)]">Soignants</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            Créez un compte soignant avec e-mail et mot de passe.
          </p>
        </div>
        {!open && (
          <Button
            type="button"
            onClick={() => {
              setOpen(true);
              setError(null);
              setSuccess(null);
            }}
            className="h-11 shrink-0 rounded-full bg-[var(--rose-dust)] px-5 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
          >
            <Plus className="size-4" />
            Créer un soignant
          </Button>
        )}
      </div>

      {success && (
        <p className="rounded-full bg-[var(--blush)] px-4 py-3 text-sm text-[var(--rose-deep)]">
          {success}
        </p>
      )}

      {open && (
        <form
          onSubmit={submit}
          className="surface-card animate-rise space-y-4 rounded-[2rem] px-5 py-5"
        >
          <div className="space-y-2">
            <Label htmlFor="soignant-email" className="text-[var(--ink-muted)]">
              E-mail
            </Label>
            <input
              id="soignant-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pill-field"
              required
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="soignant-password"
              className="text-[var(--ink-muted)]"
            >
              Mot de passe
            </Label>
            <input
              id="soignant-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="pill-field"
              required
            />
          </div>

          {error && (
            <p className="rounded-full bg-[#f3ddd8] px-4 py-3 text-sm text-[#7a3f3d]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              disabled={pending}
              className="h-11 flex-1 rounded-full bg-[var(--rose-dust)] px-5 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Création…
                </>
              ) : (
                "Créer le compte"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="h-11 rounded-full border-[var(--line)] bg-transparent px-5 text-[var(--rose-deep)] hover:bg-[var(--blush)]"
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
