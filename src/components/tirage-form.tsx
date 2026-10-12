"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        router.push("/");
        router.refresh();
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
        router.push("/calendrier");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  const todayKey = parisDateKey(nowParis());

  return (
    <form onSubmit={submit} className="animate-rise space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <input
          id="date"
          type="date"
          value={dateKey}
          max={todayKey}
          onChange={(e) => setDateKey(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]/40"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Heure (Paris, pas de 10 min)</Label>
        <select
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]/40"
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
        <Label htmlFor="qty">Quantité (ml, pas de 10)</Label>
        <select
          id="qty"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="flex h-11 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]/40"
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
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 flex-1 rounded-xl bg-[var(--teal)] text-white hover:bg-[var(--teal-deep)]"
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Enregistrement…
            </>
          ) : mode === "edit" ? (
            "Enregistrer les modifications"
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
            className="h-11 rounded-xl"
          >
            <Trash2 />
            Supprimer
          </Button>
        )}
      </div>
    </form>
  );
}
