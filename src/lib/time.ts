import {
  addHours,
  differenceInMinutes,
  format,
  isAfter,
  parseISO,
  startOfDay,
  subHours,
} from "date-fns";
import { fr } from "date-fns/locale";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const TZ = "Europe/Paris";
export const TARGET_ML_24H = 800;
export const MAX_GAP_DAY_HOURS = 6;
export const MAX_GAP_NIGHT_HOURS = 5;
/** Night window in Europe/Paris local hours: 22:00 → 06:00 */
export const NIGHT_START_HOUR = 22;
export const NIGHT_END_HOUR = 6;

export function nowParis(): Date {
  return toZonedTime(new Date(), TZ);
}

export function toParis(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(d, TZ);
}

export function parisDateKey(date: Date | string): string {
  return format(toParis(date), "yyyy-MM-dd");
}

export function formatParisTime(date: Date | string): string {
  return format(toParis(date), "HH:mm", { locale: fr });
}

export function formatParisDate(date: Date | string): string {
  return format(toParis(date), "EEEE d MMMM", { locale: fr });
}

export function formatParisDateShort(date: Date | string): string {
  return format(toParis(date), "EEE d MMM", { locale: fr });
}

export function formatGap(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, "0")}`;
}

export function isNightAt(date: Date | string): boolean {
  const hour = toParis(date).getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

export function maxGapHoursAt(date: Date | string): number {
  return isNightAt(date) ? MAX_GAP_NIGHT_HOURS : MAX_GAP_DAY_HOURS;
}

/** Round datetime down/up to nearest 10 minutes in Paris time, return ISO UTC */
export function roundToTenMinutesISO(date = new Date()): string {
  const paris = toParis(date);
  const minutes = paris.getMinutes();
  const rounded = Math.round(minutes / 10) * 10;
  paris.setMinutes(rounded, 0, 0);
  if (rounded === 60) {
    paris.setHours(paris.getHours() + 1);
    paris.setMinutes(0);
  }
  return fromZonedTime(paris, TZ).toISOString();
}

/** Build ISO from Paris local date + HH:mm */
export function parisLocalToISO(dateKey: string, timeHHmm: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  return fromZonedTime(local, TZ).toISOString();
}

export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      options.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      );
    }
  }
  return options;
}

export function minutesBetween(
  later: Date | string,
  earlier: Date | string,
): number {
  const a = typeof later === "string" ? parseISO(later) : later;
  const b = typeof earlier === "string" ? parseISO(earlier) : earlier;
  return Math.max(0, differenceInMinutes(a, b));
}

export function nextDeadlineFrom(lastTirageISO: string): {
  deadline: Date;
  maxGapHours: number;
  isNight: boolean;
} {
  const last = parseISO(lastTirageISO);
  const maxGapHours = maxGapHoursAt(last);
  const isNight = isNightAt(last);
  return {
    deadline: addHours(last, maxGapHours),
    maxGapHours,
    isNight,
  };
}

export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isAfter(new Date(), d);
}

export function rollingWindowStart(hours: number): Date {
  return subHours(new Date(), hours);
}

export function startOfParisDay(date = new Date()): Date {
  return fromZonedTime(startOfDay(toParis(date)), TZ);
}
