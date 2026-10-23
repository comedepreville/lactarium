"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { nowParis, parisDateKey } from "@/lib/time";
import type { Profile } from "@/lib/types";

const TARGET_OPTIONS = Array.from(
  { length: (2000 - 100) / 100 + 1 },
  (_, i) => 100 + i * 100,
);

type Props = {
  profile: Profile;
};

export function ProfileForm({ profile }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [pumpingStartDate, setPumpingStartDate] = useState(
    profile.pumpingStartDate ?? "",
  );
  const [targetMl24h, setTargetMl24h] = useState(() => {
    const raw = profile.targetMl24h;
    if (TARGET_OPTIONS.includes(raw)) return raw;
    const clamped = Math.min(2000, Math.max(100, Math.round(raw / 100) * 100));
    return clamped;
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const todayKey = useMemo(() => parisDateKey(nowParis()), []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = displayName.trim();
    if (!name || !pumpingStartDate) {
      setError("Merci de renseigner tous les champs.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: name,
            pumpingStartDate,
            targetMl24h,
          }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "Enregistrement impossible");
        }
        setSuccess("Profil mis à jour.");
        router.refresh();
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
        <h2 className="font-display text-2xl text-[var(--ink)]">Vos infos</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Prénom, date de début de tirage et objectif quotidien.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-[var(--ink-muted)]">
          Votre prénom
        </Label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pumpingStartDate" className="text-[var(--ink-muted)]">
          Date de début de tirage de lait
        </Label>
        <input
          id="pumpingStartDate"
          type="date"
          value={pumpingStartDate}
          max={todayKey}
          onChange={(e) => setPumpingStartDate(e.target.value)}
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetMl24h" className="text-[var(--ink-muted)]">
          Objectif de tirage (ml / 24 h)
        </Label>
        <select
          id="targetMl24h"
          value={targetMl24h}
          onChange={(e) => setTargetMl24h(Number(e.target.value))}
          className="pill-field"
          required
        >
          {TARGET_OPTIONS.map((ml) => (
            <option key={ml} value={ml}>
              {ml} ml
            </option>
          ))}
        </select>
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
            Enregistrement…
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </form>
  );
}
