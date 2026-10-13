"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    startTransition(async () => {
      const supabase = createClient();
      try {
        if (mode === "login") {
          const { error: signInError } = await supabase.auth.signInWithPassword(
            { email, password },
          );
          if (signInError) throw signInError;
          router.replace("/");
          router.refresh();
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setInfo(
            "Compte créé. Vérifiez votre e-mail pour confirmer l’inscription, puis connectez-vous.",
          );
          return;
        }

        router.replace("/onboarding");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="surface-card animate-rise space-y-5 rounded-[2rem] px-5 py-6 sm:px-6"
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[var(--ink-muted)]">
          E-mail
        </Label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[var(--ink-muted)]">
          Mot de passe
        </Label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
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
      {info && (
        <p className="rounded-full bg-[var(--blush)] px-4 py-3 text-sm text-[var(--rose-deep)]">
          {info}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-[var(--rose-dust)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            {mode === "login" ? "Connexion…" : "Création…"}
          </>
        ) : mode === "login" ? (
          "Se connecter"
        ) : (
          "Créer mon compte"
        )}
      </Button>

      <p className="text-center text-sm text-[var(--ink-muted)]">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="font-medium text-[var(--rose-deep)] underline-offset-4 hover:underline"
            >
              S’inscrire
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="font-medium text-[var(--rose-deep)] underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
