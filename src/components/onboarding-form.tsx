"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { nowParis, parisDateKey } from "@/lib/time";

type Props = {
  initialDisplayName?: string | null;
  initialPumpingStartDate?: string | null;
};

export function OnboardingForm({
  initialDisplayName = "",
  initialPumpingStartDate = "",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [pumpingStartDate, setPumpingStartDate] = useState(
    initialPumpingStartDate ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const todayKey = parisDateKey(nowParis());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parent = displayName.trim();
    if (!parent || !pumpingStartDate) {
      setError("Merci de renseigner tous les champs.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Session expirée");

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            display_name: parent,
            pumping_start_date: pumpingStartDate,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) throw updateError;

        router.replace("/");
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

      {error && (
        <p className="rounded-full bg-[#f3ddd8] px-4 py-3 text-sm text-[#7a3f3d]">
          {error}
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
            Enregistrement…
          </>
        ) : (
          "Commencer"
        )}
      </Button>
    </form>
  );
}
