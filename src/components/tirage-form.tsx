"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { CircularVolumeSlider } from "@/components/circular-volume-slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

function snapVolume(n: number) {
  const snapped = Math.round(n / VOLUME_STEP) * VOLUME_STEP;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, snapped));
}

type Props = {
  mode: "create" | "edit";
  tirageId?: string;
  initialDatetime?: string;
  initialQuantityMl?: number;
};

export function TirageForm({
  mode,
  tirageId,
  initialDatetime,
  initialQuantityMl = 100,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const volumeLabelId = useId();

  const defaults = useMemo(() => {
    const iso = initialDatetime ?? roundToTenMinutesISO();
    const paris = toParis(iso);
    return {
      dateKey: parisDateKey(iso),
      time: format(paris, "HH:mm"),
      quantity: snapVolume(initialQuantityMl),
    };
  }, [initialDatetime, initialQuantityMl]);

  const [dateKey, setDateKey] = useState(defaults.dateKey);
  const [time, setTime] = useState(defaults.time);
  const [quantity, setQuantity] = useState(defaults.quantity);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (quantity < VOLUME_STEP) {
      setError("Choisissez un volume d’au moins 10 ml.");
      return;
    }
    const timeHHmm = time.slice(0, 5);
    const datetime = parisLocalToISO(dateKey, timeHHmm);

    startTransition(async () => {
      try {
        const res = await fetch(
          mode === "edit" && tirageId
            ? `/api/tirages/${tirageId}`
            : "/api/tirages",
          {
            method: mode === "edit" ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ datetime, quantityMl: quantity }),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Échec de l’enregistrement");
        }
        window.location.assign("/");
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
        window.location.assign("/");
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
