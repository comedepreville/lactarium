"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La confirmation ne correspond pas.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "Changement impossible");
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("Mot de passe mis à jour.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="surface-card animate-rise space-y-5 rounded-[2rem] px-5 py-6 sm:px-6"
    >
      <div className="space-y-1">
        <h2 className="font-display text-2xl text-[var(--ink)]">
          Mot de passe
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Saisissez votre mot de passe actuel pour en définir un nouveau.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-[var(--ink-muted)]">
          Mot de passe actuel
        </Label>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-[var(--ink-muted)]">
          Nouveau mot de passe
        </Label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-[var(--ink-muted)]">
          Confirmer
        </Label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          className="pill-field"
          required
        />
      </div>

      {error ? (
        <p className="rounded-full bg-[#f3ddd8] px-4 py-3 text-sm text-[#7a3f3d]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="rounded-full bg-[var(--blush)] px-4 py-3 text-sm text-[var(--rose-deep)]"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-[var(--rose-dust)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Mise à jour…
          </>
        ) : (
          "Changer le mot de passe"
        )}
      </Button>
    </form>
  );
}
