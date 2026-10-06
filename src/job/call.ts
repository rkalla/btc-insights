import { fridayLabel } from "../contract/format.ts";
import type { FridayDocument } from "../contract/types.ts";
import type { CashFlags } from "./copy.ts";

// Locked thresholds from the signal strategy. At least 20% under the trend, and at least 55% over.
const LUMP_GAP = -0.2;
const SLOW_GAP = 0.55;

export interface FridayInputs {
  friday: string;
  gap: number;
  ratio: number | null;
  buys: readonly { date: string }[];
  sells: readonly { date: string }[];
  armedWait: boolean;
}

export interface FridayCall {
  flags: CashFlags;
  standDownPause: boolean;
  standDownFireDate: string | null;
  armedWait: boolean;
  dollarSlot: FridayDocument["dollarSlot"];
  official: FridayDocument["official"];
  activeFireDate: string | null;
}

export function addUtcDays(isoDate: string, days: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function addCalendarMonths(isoDate: string, months: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1 + months, day)).toISOString().slice(0, 10);
}

// The latest Friday whose Saturday 06:00 UTC publish deadline has passed.
export function dueFriday(now: Date): string | null {
  const latest = lastFridayOnOrBefore(now);
  if (deadlinePassed(latest, now)) return latest;
  const prior = addUtcDays(latest, -7);
  if (deadlinePassed(prior, now)) return prior;
  return null;
}

function lastFridayOnOrBefore(now: Date): string {
  const day = now.getUTCDay();
  const sinceFriday = day >= 5 ? day - 5 : day + 2;
  return addUtcDays(now.toISOString().slice(0, 10), -sinceFriday);
}

function deadlinePassed(friday: string, now: Date): boolean {
  return now.getTime() >= Date.parse(`${addUtcDays(friday, 1)}T06:00:00Z`);
}

// All in is the fire Friday and the Friday after it. The second grace Friday's document is the next posture.
function activeFire(friday: string, buys: readonly { date: string }[]): string | null {
  for (const buy of buys) {
    if (buy.date === friday || addUtcDays(buy.date, 7) === friday) return buy.date;
  }
  return null;
}

function openSell(friday: string, sells: readonly { date: string }[]): string | null {
  let found: string | null = null;
  for (const sell of sells) {
    if (sell.date > friday) continue;
    if (friday >= addCalendarMonths(sell.date, 12)) continue;
    if (found == null || sell.date > found) found = sell.date;
  }
  return found;
}

export function evaluateFridayCall(input: FridayInputs): FridayCall {
  const activeFireDate = activeFire(input.friday, input.buys);
  const allIn = activeFireDate != null;
  const build = input.ratio != null && input.ratio > 0 && input.ratio < 1;
  const standDownFireDate = openSell(input.friday, input.sells);
  const standDownPause = standDownFireDate != null;
  const armedWait = input.armedWait;
  let lumpIn = false;
  let slowIn = false;
  if (!allIn && !build && !standDownPause && !armedWait) {
    if (input.gap <= LUMP_GAP) lumpIn = true;
    else if (input.gap >= SLOW_GAP) slowIn = true;
  }
  const next = addUtcDays(input.friday, 7);
  return {
    flags: {
      allIn,
      build,
      standDownPause,
      lumpIn,
      slowIn,
      armedWait,
    },
    standDownPause,
    standDownFireDate,
    armedWait,
    dollarSlot: allIn || lumpIn ? { pile: "cashAvailable" } : null,
    official: {
      closeDate: input.friday,
      closeLabel: fridayLabel(input.friday),
      nextCloseDate: next,
      nextCloseLabel: fridayLabel(next),
    },
    activeFireDate,
  };
}
