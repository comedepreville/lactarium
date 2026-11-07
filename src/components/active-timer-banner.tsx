"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Timer } from "lucide-react";
import {
  clearTimerSession,
  formatTimerMs,
  readResolvedTimerSession,
  readTimerSession,
  resolveTimerSession,
  subscribeTimerSession,
} from "@/lib/timer-session";

/**
 * Rappel global quand un tirage est en cours hors de `/ajouter/minuteur`.
 * Utile au retour PWA via l’icône (start_url = accueil).
 */
export function ActiveTimerBanner() {
  const pathname = usePathname();
  const onMinuteur = pathname.startsWith("/ajouter/minuteur");
  const onAjouterForm =
    pathname.startsWith("/ajouter") && !onMinuteur;
  const sessionVersion = useSyncExternalStore(
    subscribeTimerSession,
    () => readTimerSession()?.updatedAt ?? 0,
    () => 0,
  );
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [phase, setPhase] = useState<"running" | "paused" | "done" | null>(
    null,
  );
  const [durationMin, setDurationMin] = useState<number | null>(null);

  useEffect(() => {
    function syncFromStore() {
      const resolved = readResolvedTimerSession();
      if (!resolved) {
        setPhase(null);
        setRemainingMs(null);
        setDurationMin(null);
        return false;
      }
      setPhase(resolved.phase);
      setRemainingMs(resolved.remainingMs);
      setDurationMin(resolved.durationMin);
      return resolved.phase === "running";
    }

    const shouldTick = syncFromStore();
    if (!shouldTick) return;

    const id = window.setInterval(() => {
      const stored = readTimerSession();
      if (!stored) {
        setPhase(null);
        setRemainingMs(null);
        setDurationMin(null);
        return;
      }
      const resolved = resolveTimerSession(stored);
      setPhase(resolved.phase);
      setRemainingMs(resolved.remainingMs);
      setDurationMin(resolved.durationMin);
    }, 1000);

    return () => window.clearInterval(id);
  }, [sessionVersion]);

  // Formulaire d’ajout : la session échue n’a plus lieu d’être affichée.
  useEffect(() => {
    if (onAjouterForm && phase === "done") {
      clearTimerSession();
    }
  }, [onAjouterForm, phase]);

  if (onMinuteur || phase == null || remainingMs == null) {
    return null;
  }

  // Sur le formulaire, pas de bandeau (y compris « terminé »).
  if (onAjouterForm) {
    return null;
  }

  const href =
    phase === "done"
      ? `/ajouter?datetime=${encodeURIComponent(new Date().toISOString())}${
          durationMin != null ? `&duration=${durationMin}` : ""
        }`
      : "/ajouter/minuteur";

  const label =
    phase === "done"
      ? "Tirage terminé — noter le volume"
      : phase === "paused"
        ? `Tirage en pause · ${formatTimerMs(remainingMs)}`
        : `Tirage en cours · ${formatTimerMs(remainingMs)}`;

  return (
    <div className="page-shell mx-auto w-full max-w-lg px-4 pt-1">
      <Link
        href={href}
        prefetch={false}
        onClick={() => {
          if (phase === "done") clearTimerSession();
        }}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--rose-deep)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] shadow-[0_8px_24px_-10px_rgba(120,50,60,0.5)] transition-colors hover:bg-[var(--rose-dust)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose-dust)]/50"
      >
        <Timer className="size-4 shrink-0" aria-hidden />
        <span className="tabular-nums">{label}</span>
      </Link>
    </div>
  );
}
