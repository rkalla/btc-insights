import { chartMoney, money, sentenceDate } from "../contract/format.ts";
import { daysSinceGenesis, trendAt, type PowerLawFit } from "../job/powerlaw.ts";
import type { PeakDecay, ProjectionDocument } from "../job/projection.ts";

const DAY_MS = 86_400_000;
const HORIZON_YEARS = 10;
const LEAD_ONE = "If the peaks keep falling toward the long-run trend, this is about what your Bitcoin would be worth. It is not a promise.";
const LEAD_TWO = "The height above the trend follows the highs since 2011, including the latest one. Five finished cycles is a small number.";
const BLANK = "Add the Bitcoin you own in Settings to draw this.";
const STALE = "This price is late, so the projection is using an older price.";
const NO_PRICE = "Today's price is not available, so this cannot start.";
const NO_REPLAY = "The projection is not available right now.";
const NO_COINS_NO_BUY = "This starts from no Bitcoin and adds none.";

export const PROJECTION_COPY = {
  leadOne: LEAD_ONE,
  leadTwo: LEAD_TWO,
  blank: BLANK,
  stale: STALE,
  noPrice: NO_PRICE,
  noReplay: NO_REPLAY,
  noCoinsNoBuy: NO_COINS_NO_BUY,
} as const;

export interface ProjectionPoint {
  date: string;
  price: number;
  coins: number;
  value: number;
  trendValue: number;
  phase: number | null;
  mark: "high" | "low" | null;
}

export interface ProjectionReady {
  status: "ready";
  leads: [string, string];
  input: string;
  stale: string | null;
  chart: boolean;
  points: ProjectionPoint[];
  readings: string[];
  numbers: string[];
  caption: string;
}

export interface ProjectionBlank {
  status: "blank";
  leads: [string, string];
  message: string;
}

export function projectionFromDocuments(
  document: ProjectionDocument,
  spot: number,
  spotDate: string,
  coinsHeld: number | null,
  standingAmount: number | null,
  standingEvery: "week" | "month" | null,
  stale: boolean,
): ProjectionReady | ProjectionBlank {
  if (coinsHeld == null) {
    return { status: "blank", leads: [LEAD_ONE, LEAD_TWO], message: BLANK };
  }
  const buy = regularBuy(standingAmount, standingEvery);
  const input = inputLine(coinsHeld, buy);
  if (coinsHeld === 0 && buy == null) {
    return {
      status: "ready",
      leads: [LEAD_ONE, LEAD_TWO],
      input,
      stale: stale ? STALE : null,
      chart: false,
      points: [],
      readings: [],
      numbers: numberLines(document, spot, spotDate, []),
      caption: "",
    };
  }
  const phase = matchPhase(document.template, document.highIndex, spot / trendAt(document.fit, spotDate));
  const points = walk(document, spot, spotDate, coinsHeld, buy, phase);
  const readings = readingLines(points);
  return {
    status: "ready",
    leads: [LEAD_ONE, LEAD_TWO],
    input,
    stale: stale ? STALE : null,
    chart: true,
    points,
    readings,
    numbers: numberLines(document, spot, spotDate, points),
    caption: `Your Bitcoin, on a log scale, through ${points[points.length - 1]?.date.slice(0, 4) ?? spotDate.slice(0, 4)}.`,
  };
}

export function matchPhase(template: readonly number[], highIndex: number, ratio: number): number {
  let best = highIndex;
  let bestDistance = Infinity;
  for (let index = highIndex; index < template.length; index += 1) {
    const distance = Math.abs((template[index] ?? 0) - ratio);
    if (distance < bestDistance || (distance === bestDistance && index > best)) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

export function isProjectionDocument(value: unknown): value is ProjectionDocument {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<ProjectionDocument>;
  if (record.schema !== 2 || record.genesis !== "2009-01-03" || record.samples !== 204) return false;
  if (!isFit(record.fit) || !isDecay(record.decay)) return false;
  if (!Array.isArray(record.template) || record.template.length !== 204) return false;
  if (!record.template.every((ratio) => typeof ratio === "number" && Number.isFinite(ratio) && ratio > 0)) return false;
  if (!Number.isInteger(record.highIndex) || record.highIndex! < 0 || record.highIndex! > 203) return false;
  if (!Number.isInteger(record.lowIndex) || record.lowIndex! < 0 || record.lowIndex! > 203) return false;
  if (!Array.isArray(record.cycles)) return false;
  for (const cycle of record.cycles) {
    if (typeof cycle !== "object" || cycle === null) return false;
    const row = cycle as Partial<ProjectionDocument["cycles"][number]>;
    if (typeof row.low !== "string" || typeof row.high !== "string" || typeof row.end !== "string") return false;
    if (typeof row.highRatio !== "number" || !Number.isFinite(row.highRatio)) return false;
  }
  if (record.open != null) {
    if (typeof record.open !== "object") return false;
    if (typeof record.open.highRatio !== "number" || !(record.open.highRatio > 0)) return false;
  }
  return true;
}

export function peakMultiple(decay: PeakDecay, date: string): number {
  const raw = Math.exp(decay.intercept + decay.slope * daysSinceGenesis(date));
  return raw < 1 ? 1 : raw;
}

export function cycleRatio(templateValue: number, templatePeak: number, multiple: number): number {
  if (!(templateValue > 0)) return templateValue;
  if (!(templatePeak > 1) || templateValue <= 1) return templateValue;
  if (multiple <= 1) return 1;
  const scale = Math.log(multiple) / Math.log(templatePeak);
  return Math.exp(Math.log(templateValue) * scale);
}

function walk(
  document: ProjectionDocument,
  spot: number,
  spotDate: string,
  coinsHeld: number,
  buy: { amount: number; every: "week" | "month" } | null,
  phase: number,
): ProjectionPoint[] {
  const spotTrend = trendAt(document.fit, spotDate);
  const points: ProjectionPoint[] = [
    {
      date: spotDate,
      price: spot,
      coins: coinsHeld,
      value: coinsHeld * spot,
      trendValue: coinsHeld * spotTrend,
      phase: null,
      mark: null,
    },
  ];
  const end = lastFridayOnOrBefore(addYears(spotDate, HORIZON_YEARS));
  const templatePeak = document.template[document.highIndex] ?? 1;
  let coins = coinsHeld;
  let step = (phase + 1) % document.samples;
  for (let date = nextFridayAfter(spotDate); date <= end; date = addDays(date, 7)) {
    const trendPrice = trendAt(document.fit, date);
    const price = trendPrice * cycleRatio(document.template[step] ?? 0, templatePeak, peakMultiple(document.decay, date));
    if (buy != null && (buy.every === "week" || isFirstFridayOfMonth(date))) coins += buy.amount / price;
    const mark = step === document.highIndex ? "high" : step === document.lowIndex ? "low" : null;
    points.push({ date, price, coins, value: coins * price, trendValue: coins * trendPrice, phase: step, mark });
    step = (step + 1) % document.samples;
  }
  placeHighs(points);
  return points;
}

function placeHighs(points: ProjectionPoint[]): void {
  const lows: number[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (point?.mark === "low") lows.push(index);
    if (point?.mark === "high") point.mark = null;
  }
  for (let index = 0; index < lows.length; index += 1) {
    const start = (lows[index] ?? 0) + 1;
    const end = index + 1 < lows.length ? lows[index + 1]! : points.length;
    let best = start;
    for (let cursor = start; cursor < end; cursor += 1) {
      if ((points[cursor]?.value ?? 0) >= (points[best]?.value ?? 0)) best = cursor;
    }
    const chosen = points[best];
    if (chosen != null && chosen.mark == null) chosen.mark = "high";
  }
}

function readingLines(points: readonly ProjectionPoint[]): string[] {
  const lines: string[] = [];
  for (const point of points) {
    if (point.mark === "high" || point.mark === "low") lines.push(reading(point.mark, point));
  }
  const last = points[points.length - 1];
  if (last != null && last.mark == null) {
    lines.push(`In ${last.date.slice(0, 4)}, at the end of the ${HORIZON_YEARS} years, about ${chartMoney(last.value)}.`);
  }
  return lines;
}

function reading(kind: "high" | "low", point: ProjectionPoint): string {
  const place = kind === "high" ? "high" : "low";
  return `In ${point.date.slice(0, 4)}, at the ${place}, about ${chartMoney(point.value)}.`;
}

function numberLines(
  document: ProjectionDocument,
  spot: number,
  spotDate: string,
  points: readonly ProjectionPoint[],
): string[] {
  const trend = trendAt(document.fit, spotDate);
  const gap = spot / trend - 1;
  const percent = Math.abs(Math.round(gap * 100));
  const side = gap < 0 ? "below" : "above";
  const lines = [
    `Today's price is ${money(spot)}.`,
    `The long-run trend is ${money(trend)}.`,
    `Price is about ${percent}% ${side} the long-run trend.`,
  ];
  for (const cycle of document.cycles) {
    lines.push(
      `${sentenceDate(cycle.low)} to ${sentenceDate(cycle.end)}. The high was about ${cycle.highRatio} times the long-run trend.`,
    );
  }
  if (document.open != null) {
    lines.push(
      `${sentenceDate(document.open.high)}. The latest high was about ${document.open.highRatio} times the long-run trend.`,
    );
  }
  for (const point of points) {
    if (point.mark == null) continue;
    const place = point.mark === "high" ? "high" : "low";
    lines.push(
      `In ${point.date.slice(0, 4)}, at the ${place}, the long-run trend is about ${chartMoney(trendAt(document.fit, point.date))} and the portfolio is about ${chartMoney(point.value)}.`,
    );
  }
  return lines;
}

function inputLine(coins: number, buy: { amount: number; every: "week" | "month" } | null): string {
  if (coins === 0 && buy == null) return NO_COINS_NO_BUY;
  if (coins === 0 && buy != null) return `Starts from no Bitcoin and adds ${money(buy.amount)} every ${buy.every}.`;
  if (buy == null) return `Starts from ${formatCoins(coins)} Bitcoin. No regular buy is set, so this adds no new Bitcoin.`;
  return `Starts from ${formatCoins(coins)} Bitcoin and adds ${money(buy.amount)} every ${buy.every}.`;
}

function regularBuy(
  amount: number | null,
  every: "week" | "month" | null,
): { amount: number; every: "week" | "month" } | null {
  if (every !== "week" && every !== "month") return null;
  if (typeof amount !== "number" || !Number.isFinite(amount) || !(amount > 0)) return null;
  return { amount, every };
}

export function formatCoins(value: number): string {
  const fixed = value.toFixed(8);
  return fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function isFit(value: unknown): value is PowerLawFit {
  if (typeof value !== "object" || value === null) return false;
  const fit = value as Partial<PowerLawFit>;
  return typeof fit.a === "number" && Number.isFinite(fit.a) && typeof fit.b === "number" && Number.isFinite(fit.b);
}

function isDecay(value: unknown): value is PeakDecay {
  if (typeof value !== "object" || value === null) return false;
  const decay = value as Partial<PeakDecay>;
  return typeof decay.intercept === "number" && Number.isFinite(decay.intercept) && typeof decay.slope === "number" && Number.isFinite(decay.slope);
}

function utcMs(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return isoDate(utcMs(iso) + days * DAY_MS);
}

function addYears(iso: string, years: number): string {
  return `${Number(iso.slice(0, 4)) + years}-${iso.slice(5)}`;
}

function weekday(iso: string): number {
  return new Date(utcMs(iso)).getUTCDay();
}

function nextFridayAfter(iso: string): string {
  const delta = (5 - weekday(iso) + 7) % 7;
  return addDays(iso, delta === 0 ? 7 : delta);
}

function lastFridayOnOrBefore(iso: string): string {
  return addDays(iso, -((weekday(iso) - 5 + 7) % 7));
}

function isFirstFridayOfMonth(iso: string): boolean {
  return weekday(iso) === 5 && Number(iso.slice(8, 10)) <= 7;
}
