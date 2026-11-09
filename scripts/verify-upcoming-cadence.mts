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
  // 1) Dernier tirage > 5 h → Maintenant + 2 suivants depuis maintenant
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
    // 200 ml aujourd’hui → 600 restants / 100 = 6
    assert(advice.remainingTiragesEstimate === 6, "restants = 6");
    assert(advice.upcoming.length === 3, "affiche 3 créneaux");
    assert(advice.upcoming[0]?.asap === true, "premier = Maintenant");
    assert(advice.maxGapOverdue === true, "plus de 5 h");
    console.log("ok: > 5 h depuis dernier", {
      restants: advice.remainingTiragesEstimate,
      upcoming: labels(advice),
    });
  }

  // 2) Dernier tirage < 5 h → créneaux depuis le dernier (pas Maintenant)
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
    // 300 ml → 500 / 100 = 5 restants ; depuis 08:00, I = 16/5 = 3.2
    // → 11:12, 14:24, 17:36
    assert(advice.remainingTiragesEstimate === 5, "restants = 5");
    assert(advice.upcoming.length === 3, "affiche 3 créneaux");
    assert(advice.upcoming[0]?.asap === false, "pas en retard");
    assert(labels(advice)[0] === "2026-11-09 11:12", "1er depuis dernier");
    assert(labels(advice)[1] === "2026-11-09 14:24", "2e");
    assert(labels(advice)[2] === "2026-11-09 17:36", "3e");
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

  // 4) Beaucoup de restants en fin de journée → intervalle plancher 1 h
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
    // 150 ml tirés → 650 / 50 = 13 restants ; 3 h restantes / 13 < 1 → plancher 1 h
    assert(advice.remainingTiragesEstimate === 13, "restants = 13");
    assert(advice.suggestedIntervalHours === 1, "plancher 1 h");
    assert(labels(advice)[0] === "2026-11-09 21:00", "1er à +1 h");
    assert(labels(advice)[1] === "2026-11-09 22:00", "2e à +2 h");
    assert(labels(advice)[2] === "2026-11-09 23:00", "3e à +3 h");
    console.log("ok: plancher 1 h", {
      interval: advice.suggestedIntervalHours,
      upcoming: labels(advice),
    });
  }

  console.log("\nTous les contrôles sont passés.");
}

run();
