/**
 * Vérifie que la timeline « Prochains tirages » reste cohérente avec
 * l’estimation « Restants avant minuit ».
 *
 * Usage : npx tsx scripts/verify-upcoming-cadence.mts
 */
import { parseISO } from "date-fns";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { computeDashboard } from "../src/lib/dashboard";
import {
  hoursUntilEndOfParisDay,
  parisDateKey,
  startOfNextParisDay,
  TZ,
} from "../src/lib/time";
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

function run() {
  // 1) En retard le même jour : intervalle = temps restant maintenant / restants
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
    // 200 ml tirés aujourd’hui → 600 ml restants / 100 ml ≈ 6 tirages
    assert(advice.remainingTiragesEstimate === 6, "restants = 6 (200 ml tirés)");
    assert(advice.upcoming[0]?.asap === true, "premier = Maintenant");
    const expectedInterval =
      hoursUntilEndOfParisDay(now) / advice.remainingTiragesEstimate;
    const second = parseISO(advice.upcoming[1]!.at);
    const deltaH = (second.getTime() - now.getTime()) / 3_600_000;
    assert(
      Math.abs(deltaH - expectedInterval) < 1 / 60,
      `espacement retard ≈ ${expectedInterval}h, obtenu ${deltaH}`,
    );
    console.log("ok: retard même jour", {
      restants: advice.remainingTiragesEstimate,
      upcoming: advice.upcoming.map((u) =>
        u.asap ? "Maintenant" : parisFmt(u.at),
      ),
    });
  }

  // 2) Dernier tirage hier : ne plus utiliser les heures jusqu’à minuit d’hier
  {
    const now = parseISO("2026-11-09T10:00:00+01:00");
    const advice = computeDashboard(
      [tirage("a", "2026-11-08T22:00:00+01:00", 100)],
      800,
      now,
    );
    assert(advice.remainingTiragesEstimate === 8, "restants = 8");
    assert(advice.upcoming[0]?.asap === true, "échéance hier → Maintenant");
    const expectedInterval =
      hoursUntilEndOfParisDay(now) / advice.remainingTiragesEstimate;
    assert(
      advice.suggestedIntervalHours != null &&
        Math.abs(advice.suggestedIntervalHours - expectedInterval) < 1e-9,
      "intervalle basé sur aujourd’hui, pas sur hier soir",
    );
    const end = startOfNextParisDay(now).getTime();
    for (const u of advice.upcoming.slice(1)) {
      assert(
        parseISO(u.at).getTime() < end,
        `créneau après le premier avant minuit: ${parisFmt(u.at)}`,
      );
    }
    console.log("ok: dernier tirage hier", {
      interval: advice.suggestedIntervalHours,
      upcoming: advice.upcoming.map((u) =>
        u.asap ? "Maintenant" : parisFmt(u.at),
      ),
    });
  }

  // 3) Pas en retard : échéance ancrée, créneaux du jour
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
    assert(advice.upcoming[0]?.asap === false, "pas en retard");
    assert(
      parisDateKey(advice.upcoming[0]!.at) === "2026-11-09",
      "prochaine échéance aujourd’hui",
    );
    assert(
      advice.upcoming.length <= advice.remainingTiragesEstimate,
      "pas plus de créneaux que de restants",
    );
    console.log("ok: journée en cours", {
      restants: advice.remainingTiragesEstimate,
      upcoming: advice.upcoming.map((u) => parisFmt(u.at)),
    });
  }

  console.log("\nTous les contrôles sont passés.");
}

run();
