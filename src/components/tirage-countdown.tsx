"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircularDurationSlider } from "@/components/circular-duration-slider";
import { Button } from "@/components/ui/button";
import { playTimerDoneChime, vibrateTimerDone } from "@/lib/timer-chime";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw } from "lucide-react";

const DURATION_MIN = 5;
const DURATION_MAX = 30;
const DURATION_STEP = 5;
const DURATION_DEFAULT = 15;
const REDIRECT_DELAY_MS = 1100;

type Phase = "setup" | "running" | "paused" | "done";

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function CountdownRing({
  progress,
  size = 280,
  done = false,
}: {
  progress: number;
  size?: number;
  done?: boolean;
}) {
  const stroke = 16;
  const radius = (size - stroke) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);

  return (
    <div
      className={cn(
        "relative mx-auto flex items-center justify-center",
        done && "animate-timer-done",
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--blush)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? "var(--rose-deep)" : "var(--rose-dust)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-100 ease-linear"
        />
      </svg>
    </div>
  );
}

export function TirageCountdown() {
  const router = useRouter();
  const durationLabelId = useId();
  const [durationMin, setDurationMin] = useState(DURATION_DEFAULT);
  const [phase, setPhase] = useState<Phase>("setup");
  const [remainingMs, setRemainingMs] = useState(DURATION_DEFAULT * 60_000);
  const endAtRef = useRef<number | null>(null);
  const remainingOnPauseRef = useRef(DURATION_DEFAULT * 60_000);
  const redirectedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const totalMs = durationMin * 60_000;
  const progress = phase === "setup" ? 1 : remainingMs / totalMs;

  useEffect(() => {
    if (phase !== "running") {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const endAt = endAtRef.current;
      if (endAt == null) return;
      const left = endAt - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        setPhase("done");
        return;
      }
      setRemainingMs(left);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "done" || redirectedRef.current) return;
    redirectedRef.current = true;
    playTimerDoneChime();
    vibrateTimerDone();

    const datetime = new Date().toISOString();
    const timer = window.setTimeout(() => {
      router.push(
        `/ajouter?datetime=${encodeURIComponent(datetime)}&duration=${durationMin}`,
      );
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [phase, durationMin, router]);

  function onDurationChange(next: number) {
    setDurationMin(next);
    setRemainingMs(next * 60_000);
    remainingOnPauseRef.current = next * 60_000;
  }

  function start() {
    redirectedRef.current = false;
    const ms = durationMin * 60_000;
    remainingOnPauseRef.current = ms;
    setRemainingMs(ms);
    endAtRef.current = Date.now() + ms;
    setPhase("running");
  }

  function pause() {
    if (endAtRef.current != null) {
      remainingOnPauseRef.current = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(remainingOnPauseRef.current);
    }
    endAtRef.current = null;
    setPhase("paused");
  }

  function resume() {
    endAtRef.current = Date.now() + remainingOnPauseRef.current;
    setPhase("running");
  }

  function reset() {
    endAtRef.current = null;
    redirectedRef.current = false;
    const ms = durationMin * 60_000;
    remainingOnPauseRef.current = ms;
    setRemainingMs(ms);
    setPhase("setup");
  }

  function skipToForm() {
    const datetime = new Date().toISOString();
    router.push(`/ajouter?datetime=${encodeURIComponent(datetime)}`);
  }

  const showSetupControls = phase === "setup";
  const showTimerControls = phase === "running" || phase === "paused";

  return (
    <div
      className={cn(
        "surface-card animate-rise space-y-7 rounded-[2rem] px-5 py-7 sm:px-6",
        phase === "done" && "animate-timer-fade-out",
      )}
    >
      <div className="relative">
        {showSetupControls ? (
          <>
            <p id={durationLabelId} className="sr-only">
              Durée du tirage
            </p>
            <CircularDurationSlider
              value={durationMin}
              onChange={onDurationChange}
              min={DURATION_MIN}
              max={DURATION_MAX}
              step={DURATION_STEP}
              aria-labelledby={durationLabelId}
            />
          </>
        ) : (
          <div className="relative">
            <CountdownRing
              progress={phase === "done" ? 0 : progress}
              done={phase === "done"}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
              {phase === "done" ? (
                <>
                  <p className="font-display text-3xl text-[var(--rose-deep)]">
                    Terminé
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    Ouverture du formulaire…
                  </p>
                </>
              ) : (
                <>
                  <p className="font-body text-[3.25rem] font-medium leading-none tracking-tight text-[var(--ink)] tabular-nums">
                    {formatMs(remainingMs)}
                  </p>
                  <p className="mt-2 font-body text-sm text-[var(--ink-muted)]">
                    {phase === "paused" ? "En pause" : `${durationMin} min`}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showSetupControls && (
        <div className="flex flex-col items-center gap-4">
          <Button
            type="button"
            onClick={start}
            className="h-14 w-full max-w-xs rounded-full bg-[var(--rose-dust)] px-8 text-base text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
          >
            <Play className="size-5" aria-hidden />
            Démarrer
          </Button>
          <button
            type="button"
            onClick={skipToForm}
            className="text-sm font-medium text-[var(--ink-muted)] underline-offset-4 transition-colors hover:text-[var(--rose-deep)] hover:underline"
          >
            J’ai déjà tiré mon lait
          </button>
        </div>
      )}

      {showTimerControls && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {phase === "running" ? (
            <Button
              type="button"
              onClick={pause}
              className="h-12 min-w-[8.5rem] rounded-full bg-[var(--rose-dust)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
            >
              <Pause className="size-4" aria-hidden />
              Pause
            </Button>
          ) : (
            <Button
              type="button"
              onClick={resume}
              className="h-12 min-w-[8.5rem] rounded-full bg-[var(--rose-dust)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
            >
              <Play className="size-4" aria-hidden />
              Reprendre
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className="h-12 rounded-full border-[var(--line)] bg-transparent px-5 text-[var(--rose-deep)] hover:bg-[var(--blush)]"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
