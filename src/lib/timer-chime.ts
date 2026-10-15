/** Douce mélodie de fin (Web Audio API) — pas de fichier externe. */
export function playTimerDoneChime(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

    // Accord doux C5 → E5 → G5
    const notes = [
      { freq: 523.25, at: 0 },
      { freq: 659.25, at: 0.14 },
      { freq: 783.99, at: 0.28 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      const t0 = ctx.currentTime + note.at;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.9, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.75);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.8);
    }

    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 1400);
  } catch {
    /* audio indisponible */
  }
}

export function vibrateTimerDone(): void {
  try {
    navigator.vibrate?.([180, 80, 180, 80, 240]);
  } catch {
    /* vibration indisponible */
  }
}
