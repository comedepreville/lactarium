"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { CircularDurationSlider } from "@/components/circular-duration-slider";
import { Button } from "@/components/ui/button";
import {
  cancelTimerDonePush,
  fetchPendingTimerDone,
  scheduleTimerDonePush,
} from "@/lib/push/client";
import { playTimerDoneChime, vibrateTimerDone } from "@/lib/timer-chime";
import {
  persistTimerDuration,
  readStoredTimerDuration,
  subscribeTimerDuration,
  TIMER_DURATION_DEFAULT,
  TIMER_DURATION_MAX,
  TIMER_DURATION_MIN,
  TIMER_DURATION_STEP,
} from "@/lib/timer-duration";
import {
  clearTimerSession,
  formatTimerMs,
  readTimerSession,
  resolveTimerSession,
  sessionFromPendingPush,
  subscribeTimerSession,
  writeTimerSession,
} from "@/lib/timer-session";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw } from "lucide-react";

const REDIRECT_DELAY_MS = 1100;

type Phase = "setup" | "running" | "paused" | "done";

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
  const preferredDuration = useSyncExternalStore(
    subscribeTimerDuration,
    readStoredTimerDuration,
    () => TIMER_DURATION_DEFAULT,
  );
  const session = useSyncExternalStore(
    subscribeTimerSession,
    readTimerSession,
    () => null,
  );

  const [now, setNow] = useState(() => Date.now());
  const [setupDurationMin, setSetupDurationMin] = useState<number | null>(null);
  const redirectedRef = useRef(false);
  const serverRestoreTriedRef = useRef(false);

  const resolved = session ? resolveTimerSession(session, now) : null;
  const phase: Phase = resolved?.phase ?? "setup";
  const durationMin =
    resolved?.durationMin ?? setupDurationMin ?? preferredDuration;
  const remainingMs =
    resolved?.remainingMs ?? durationMin * 60_000;
  const totalMs = durationMin * 60_000;
  const progress = phase === "setup" ? 1 : remainingMs / totalMs;

  // Horloge : uniquement en running ; au retour premier plan on resync via `now`.
  useEffect(() => {
    if (phase !== "running") return;

    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    function onResume() {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
      }
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setNow(Date.now());
    }

    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [phase, session?.endAt, session?.updatedAt]);

  // Secours : notif serveur pending si localStorage vide (après hydrate client).
  useEffect(() => {
    if (session || serverRestoreTriedRef.current) return;
    serverRestoreTriedRef.current = true;

    void (async () => {
      const pending = await fetchPendingTimerDone();
      if (!pending) return;
      if (readTimerSession()) return;
      const fromPush = sessionFromPendingPush({
        fireAtIso: pending.fireAt,
        durationMin: pending.durationMin,
      });
      if (!fromPush) return;
      writeTimerSession({
        phase: fromPush.phase,
        durationMin: fromPush.durationMin,
        endAt: fromPush.endAt,
        remainingMs: fromPush.remainingMs,
      });
      setNow(Date.now());
    })();
  }, [session]);

  // Ré-arme le push si la session locale a survécu au kill PWA.
  useEffect(() => {
    if (!session || session.phase !== "running" || session.endAt == null) {
      return;
    }
    const left = session.endAt - Date.now();
    if (left <= 0) return;
    void scheduleTimerDonePush(new Date(session.endAt), session.durationMin);
  }, [session]);

  useEffect(() => {
    if (phase !== "done" || redirectedRef.current) return;
    redirectedRef.current = true;
    // On garde la session jusqu’à la navigation pour éviter un flash « setup ».
    void cancelTimerDonePush();
    playTimerDoneChime();
    vibrateTimerDone();

    const datetime = new Date().toISOString();
    const doneDuration = durationMin;
    const timer = window.setTimeout(() => {
      clearTimerSession();
      router.push(
        `/ajouter?datetime=${encodeURIComponent(datetime)}&duration=${doneDuration}`,
      );
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [phase, durationMin, router]);

  function onDurationChange(next: number) {
    persistTimerDuration(next);
    setSetupDurationMin(next);
  }

  function start() {
    redirectedRef.current = false;
    const minutes = setupDurationMin ?? preferredDuration;
    persistTimerDuration(minutes);
    const ms = minutes * 60_000;
    const endAt = Date.now() + ms;
    writeTimerSession({
      phase: "running",
      durationMin: minutes,
      endAt,
      remainingMs: null,
    });
    setNow(Date.now());
    void scheduleTimerDonePush(new Date(endAt), minutes);
  }

  function pause() {
    if (!session || session.phase !== "running" || session.endAt == null) {
      return;
    }
    const left = Math.max(0, session.endAt - Date.now());
    writeTimerSession({
      phase: "paused",
      durationMin: session.durationMin,
      endAt: null,
      remainingMs: left,
    });
    setNow(Date.now());
    void cancelTimerDonePush();
  }

  function resume() {
    if (!session || session.phase !== "paused") return;
    const left = Math.max(0, session.remainingMs ?? 0);
    const endAt = Date.now() + left;
    writeTimerSession({
      phase: "running",
      durationMin: session.durationMin,
      endAt,
      remainingMs: null,
    });
    setNow(Date.now());
    void scheduleTimerDonePush(new Date(endAt), session.durationMin);
  }

  function reset() {
    redirectedRef.current = false;
    setSetupDurationMin(null);
    clearTimerSession();
    setNow(Date.now());
    void cancelTimerDonePush();
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
              min={TIMER_DURATION_MIN}
              max={TIMER_DURATION_MAX}
              step={TIMER_DURATION_STEP}
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
                  <p className="font-display text-[3.25rem] font-medium leading-none tracking-tight text-[var(--ink)] tabular-nums">
                    {formatTimerMs(remainingMs)}
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
