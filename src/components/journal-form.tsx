"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutationNavigation } from "@/lib/mutation-navigation";
import {
  nowParis,
  parisDateKey,
  parisLocalToISO,
  roundToTenMinutesISO,
  toParis,
} from "@/lib/time";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

type Props = {
  mode: "create" | "edit";
  entryId?: string;
  initialDatetime?: string;
  initialText?: string;
};

export function JournalForm({
  mode,
  entryId,
  initialDatetime,
  initialText = "",
}: Props) {
  const navigateAfterMutation = useMutationNavigation();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaults = useMemo(() => {
    const iso = initialDatetime ?? roundToTenMinutesISO();
    const paris = toParis(iso);
    return {
      dateKey: parisDateKey(iso),
      time: format(paris, "HH:mm"),
      text: initialText,
    };
  }, [initialDatetime, initialText]);

  const [dateKey, setDateKey] = useState(defaults.dateKey);
  const [time, setTime] = useState(defaults.time);
  const [text, setText] = useState(defaults.text);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Écrivez un peu de texte pour cet événement.");
      return;
    }
    const timeHHmm = time.slice(0, 5);
    const datetime = parisLocalToISO(dateKey, timeHHmm);

    startTransition(async () => {
      try {
        const res = await fetch(
          mode === "edit" && entryId
            ? `/api/journal/${entryId}`
            : "/api/journal",
          {
            method: mode === "edit" ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ datetime, text: trimmed }),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Échec de l’enregistrement");
        }
        navigateAfterMutation("/journal");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  function remove() {
    if (!entryId) return;
    if (!confirm("Supprimer cet événement ?")) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/journal/${entryId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Suppression impossible");
        navigateAfterMutation("/journal");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  const todayKey = parisDateKey(nowParis());

  return (
    <form
      onSubmit={submit}
      className="surface-card animate-rise space-y-6 rounded-[2rem] px-5 py-6 sm:px-6"
    >
      <div className="space-y-2">
        <Label htmlFor="date" className="text-[var(--ink-muted)]">
          Date
        </Label>
        <input
          id="date"
          type="date"
          value={dateKey}
          max={todayKey}
          onChange={(e) => setDateKey(e.target.value)}
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time" className="text-[var(--ink-muted)]">
          Heure
        </Label>
        <input
          id="time"
          type="time"
          value={time.slice(0, 5)}
          onChange={(e) => setTime(e.target.value)}
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="text" className="text-[var(--ink-muted)]">
          Événement
        </Label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Premier sourire, première nuit complète…"
          className="w-full resize-y rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none transition-shadow placeholder:text-[var(--ink-muted)]/70 focus-visible:ring-2 focus-visible:ring-[var(--rose-dust)]/35"
          required
        />
      </div>

      {error && (
        <p className="rounded-full bg-[#f3ddd8] px-4 py-3 text-sm text-[#7a3f3d]">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <Button
          type="submit"
          disabled={pending}
          className="h-12 flex-1 rounded-full bg-[var(--rose-dust)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Enregistrement…
            </>
          ) : mode === "edit" ? (
            "Enregistrer"
          ) : (
            "Ajouter l’événement"
          )}
        </Button>
        {mode === "edit" && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={remove}
            className="h-12 rounded-full border-[var(--line)] bg-transparent px-5 text-[var(--rose-deep)] hover:bg-[var(--blush)]"
          >
            <Trash2 />
            Supprimer
          </Button>
        )}
      </div>
    </form>
  );
}
