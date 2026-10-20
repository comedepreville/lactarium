"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { CircularVolumeSlider } from "@/components/circular-volume-slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutationNavigation } from "@/lib/mutation-navigation";
import { clearDisplayedPushNotifications } from "@/lib/push/client";
import {
  nowParis,
  parisDateKey,
  parisLocalToISO,
  roundToTenMinutesISO,
  toParis,
} from "@/lib/time";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

const VOLUME_MIN = 0;
const VOLUME_MAX = 300;
const VOLUME_STEP = 10;
const NOTES_MAX = 500;
const DURATION_MIN = 1;
const DURATION_MAX = 120;

function snapVolume(n: number) {
  const snapped = Math.round(n / VOLUME_STEP) * VOLUME_STEP;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, snapped));
}

type Props = {
  mode: "create" | "edit";
  tirageId?: string;
  initialDatetime?: string;
  initialQuantityMl?: number;
  initialDuration?: number | null;
  initialNotes?: string | null;
  /** Si true, la durée n’est pas préremplie (skip minuteur). */
  requireManualDuration?: boolean;
};

export function TirageForm({
  mode,
  tirageId,
  initialDatetime,
  initialQuantityMl = 100,
  initialDuration = null,
  initialNotes = null,
  requireManualDuration = false,
}: Props) {
  const navigateAfterMutation = useMutationNavigation();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const volumeLabelId = useId();

  const defaults = useMemo(() => {
    const iso = initialDatetime ?? roundToTenMinutesISO();
    const paris = toParis(iso);
    const durationValue =
      requireManualDuration || initialDuration == null || initialDuration <= 0
        ? ""
        : String(initialDuration);
    return {
      dateKey: parisDateKey(iso),
      time: format(paris, "HH:mm"),
      quantity: snapVolume(initialQuantityMl),
      duration: durationValue,
      notes: initialNotes ?? "",
    };
  }, [
    initialDatetime,
    initialDuration,
    initialNotes,
    initialQuantityMl,
    requireManualDuration,
  ]);

  const [dateKey, setDateKey] = useState(defaults.dateKey);
  const [time, setTime] = useState(defaults.time);
  const [quantity, setQuantity] = useState(defaults.quantity);
  const [duration, setDuration] = useState(defaults.duration);
  const [notes, setNotes] = useState(defaults.notes);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (quantity < VOLUME_STEP) {
      setError("Choisissez un volume d’au moins 10 ml.");
      return;
    }
    const durationNum = Number.parseInt(duration, 10);
    if (
      !Number.isFinite(durationNum) ||
      durationNum < DURATION_MIN ||
      durationNum > DURATION_MAX
    ) {
      setError(
        `Indiquez une durée entre ${DURATION_MIN} et ${DURATION_MAX} minutes.`,
      );
      return;
    }
    const timeHHmm = time.slice(0, 5);
    const datetime = parisLocalToISO(dateKey, timeHHmm);
    const trimmedNotes = notes.trim();

    startTransition(async () => {
      try {
        const res = await fetch(
          mode === "edit" && tirageId
            ? `/api/tirages/${tirageId}`
            : "/api/tirages",
          {
            method: mode === "edit" ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              datetime,
              quantityMl: quantity,
              duration: durationNum,
              notes: trimmedNotes || null,
            }),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Échec de l’enregistrement");
        }
        if (mode === "create") {
          await clearDisplayedPushNotifications();
        }
        navigateAfterMutation("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  function remove() {
    if (!tirageId) return;
    if (!confirm("Supprimer ce tirage ?")) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tirages/${tirageId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Suppression impossible");
        navigateAfterMutation("/");
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
        <Label htmlFor="duration" className="text-[var(--ink-muted)]">
          Durée (min)
        </Label>
        <input
          id="duration"
          type="number"
          inputMode="numeric"
          min={DURATION_MIN}
          max={DURATION_MAX}
          step={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="ex. 15"
          className="pill-field"
          required
        />
      </div>

      <div className="space-y-3">
        <Label id={volumeLabelId} className="text-[var(--ink-muted)]">
          Volume (ml)
        </Label>
        <CircularVolumeSlider
          value={quantity}
          onChange={setQuantity}
          min={VOLUME_MIN}
          max={VOLUME_MAX}
          step={VOLUME_STEP}
          aria-labelledby={volumeLabelId}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="notes" className="text-[var(--ink-muted)]">
            Notes{" "}
            <span className="font-normal text-[var(--ink-muted)]/70">
              (optionnel)
            </span>
          </Label>
          <span className="text-xs tabular-nums text-[var(--ink-muted)]">
            {notes.length}/{NOTES_MAX}
          </span>
        </div>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
          rows={3}
          maxLength={NOTES_MAX}
          placeholder="Stress, douleur, couleur ou odeur du lait…"
          className="w-full resize-y rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none transition-shadow placeholder:text-[var(--ink-muted)]/70 focus-visible:ring-2 focus-visible:ring-[var(--rose-dust)]/35"
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
            "Ajouter le tirage"
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
