/**
 * Vérifie la cadence simple des prochains tirages.
 *
 * Usage : npx tsx scripts/verify-upcoming-cadence.mts
 */
import { parseISO } from "date-fns";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { computeDashboard } from "../src/lib/dashboard";
import { TZ } from "../src/lib/time";
import type { Tirage } from "../src/lib/types";

function tirage(id: string, iso: string, quantityMl: number): Tirage {
  return {
    id,
    datetime: iso,
    quantityMl,
    duration: 15,
    notes: null,
  };
}

function parisFmt(iso: string): string {
  return format(toZonedTime(parseISO(iso), TZ), "yyyy-MM-dd HH:mm");
}

function assert(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

function labels(advice: ReturnType<typeof computeDashboard>): string[] {
  return advice.upcoming.map((u) => (u.asap ? "Maintenant" : parisFmt(u.at)));
}

function run() {
  // 1) Dernier tirage ≥ 5 h → Maintenant + suite depuis maintenant
  {
    const now = parseISO("2026-11-09T15:00:00+01:00");
    const advice = computeDashboard(
      [
        tirage("a", "2026-11-09T08:00:00+01:00", 100),
        tirage("b", "2026-11-09T06:00:00+01:00", 100),
        tirage("c", "2026-11-08T22:00:00+01:00", 100),
      ],
      800,
      now,
    );
    // 200 ml aujourd’hui → 600 / 100 = 6 restants ; I = 24/6 = 4 h
    assert(advice.remainingTiragesEstimate === 6, "restants = 6");
    assert(advice.suggestedIntervalHours === 4, "intervalle 4 h");
    assert(advice.upcoming.length === 3, "affiche 3 créneaux");
    assert(advice.upcoming[0]?.asap === true, "premier = Maintenant");
    assert(labels(advice)[1] === "2026-11-09 19:00", "2e à +4 h");
    assert(labels(advice)[2] === "2026-11-09 23:00", "3e à +8 h");
    console.log("ok: ≥ 5 h depuis dernier", {
      restants: advice.remainingTiragesEstimate,
      upcoming: labels(advice),
    });
  }

  // 2) Dernier tirage < 5 h → créneaux depuis le dernier
  {
    const now = parseISO("2026-11-09T10:00:00+01:00");
    const advice = computeDashboard(
      [
        tirage("a", "2026-11-09T08:00:00+01:00", 100),
        tirage("b", "2026-11-09T05:00:00+01:00", 100),
        tirage("c", "2026-11-09T02:00:00+01:00", 100),
      ],
      800,
      now,
    );
    // 300 ml → 500 / 100 = 5 ; I = 24/5 = 4.8
    assert(advice.remainingTiragesEstimate === 5, "restants = 5");
    assert(advice.upcoming.length === 3, "affiche 3 créneaux");
    assert(advice.upcoming[0]?.asap === false, "pas en retard");
    assert(labels(advice)[0] === "2026-11-09 12:48", "1er depuis dernier");
    assert(labels(advice)[1] === "2026-11-09 17:36", "2e");
    assert(labels(advice)[2] === "2026-11-09 22:24", "3e");
    console.log("ok: < 5 h depuis dernier", {
      restants: advice.remainingTiragesEstimate,
      upcoming: labels(advice),
    });
  }

  // 3) Objectif atteint → aucune échéance
  {
    const now = parseISO("2026-11-09T18:00:00+01:00");
    const advice = computeDashboard(
      [
        tirage("a", "2026-11-09T16:00:00+01:00", 300),
        tirage("b", "2026-11-09T12:00:00+01:00", 300),
        tirage("c", "2026-11-09T08:00:00+01:00", 300),
      ],
      800,
      now,
    );
    assert(advice.remainingTiragesEstimate === 0, "plus de restants");
    assert(advice.upcoming.length === 0, "liste vide");
    console.log("ok: objectif atteint");
  }

  // 4) Beaucoup de restants → plancher 1 h
  {
    const now = parseISO("2026-11-09T21:00:00+01:00");
    const advice = computeDashboard(
      [
        tirage("a", "2026-11-09T20:00:00+01:00", 50),
        tirage("b", "2026-11-09T18:00:00+01:00", 50),
        tirage("c", "2026-11-09T16:00:00+01:00", 50),
      ],
      800,
      now,
    );
    // 150 ml → 650 / 50 = 13 ; 24/13 ≈ 1.85 → pas de plancher
    assert(advice.remainingTiragesEstimate === 13, "restants = 13");
    assert(
      advice.suggestedIntervalHours != null &&
        advice.suggestedIntervalHours > 1 &&
        advice.suggestedIntervalHours < 2,
      "intervalle entre 1 et 2 h",
    );
    console.log("ok: cadence dense", {
      interval: advice.suggestedIntervalHours,
      upcoming: labels(advice),
    });
  }

  // 5) Traversée de minuit : 3 créneaux, pas un seul à 00:00
  // last 19:30, rem ≈ 8 → I = 3 h → 22:30, 01:30, 04:30
  {
    const now = parseISO("2026-11-09T20:00:00+01:00");
    const advice = computeDashboard(
      [
        tirage("a", "2026-11-09T19:30:00+01:00", 100),
        tirage("b", "2026-11-09T16:00:00+01:00", 100),
        tirage("c", "2026-11-09T13:00:00+01:00", 100),
      ],
      800,
      now,
    );
    // 300 ml → 500 / 100 = 5 ; I = 24/5 = 4.8
    // → 00:18, 05:06, 09:54 — traverse minuit, 3 créneaux
    assert(advice.upcoming.length === 3, "3 créneaux après minuit");
    assert(
      !labels(advice).every((l) => l.endsWith("00:00")),
      "pas tous à 00:00",
    );
    assert(
      labels(advice).some((l) => l.startsWith("2026-11-10")),
      "au moins un créneau le lendemain",
    );
    console.log("ok: traverse minuit", {
      restants: advice.remainingTiragesEstimate,
      interval: advice.suggestedIntervalHours,
      upcoming: labels(advice),
    });
  }

  // 6) Exemple demandé : ~8 restants, I = 3 h → 22:30 / 01:30 / 04:30
  {
    const now = parseISO("2026-11-09T20:00:00+01:00");
    const advice = computeDashboard(
      [tirage("a", "2026-11-09T19:30:00+01:00", 100)],
      800,
      now,
    );
    // 100 ml → 700 / 100 = 7 ; I = 24/7 ≈ 3.43
    assert(advice.remainingTiragesEstimate === 7, "restants = 7");
    assert(advice.upcoming.length === 3, "3 créneaux");
    const times = labels(advice);
    assert(times[0]!.startsWith("2026-11-09"), "1er encore ce soir");
    assert(times[1]!.startsWith("2026-11-10"), "2e après minuit");
    assert(times[2]!.startsWith("2026-11-10"), "3e après minuit");
    console.log("ok: soir → nuit", { upcoming: times });
  }

  console.log("\nTous les contrôles sont passés.");
}

run();
