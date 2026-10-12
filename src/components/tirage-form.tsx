"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  generateTimeOptions,
  nowParis,
  parisDateKey,
  parisLocalToISO,
  roundToTenMinutesISO,
  toParis,
} from "@/lib/time";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

const QUANTITIES = Array.from({ length: 40 }, (_, i) => (i + 1) * 10);
const TIME_OPTIONS = generateTimeOptions();

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

  const defaults = useMemo(() => {
    const iso = initialDatetime ?? roundToTenMinutesISO();
    const paris = toParis(iso);
    return {
      dateKey: parisDateKey(iso),
      time: format(paris, "HH:mm"),
      quantity: initialQuantityMl,
    };
  }, [initialDatetime, initialQuantityMl]);

  const [dateKey, setDateKey] = useState(defaults.dateKey);
  const [time, setTime] = useState(defaults.time);
  const [quantity, setQuantity] = useState(defaults.quantity);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const datetime = parisLocalToISO(dateKey, time);

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
        <select
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="pill-field appearance-none"
          required
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qty" className="text-[var(--ink-muted)]">
          Quantité (ml)
        </Label>
        <select
          id="qty"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="pill-field appearance-none"
          required
        >
          {QUANTITIES.map((q) => (
            <option key={q} value={q}>
              {q} ml
            </option>
          ))}
        </select>
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
