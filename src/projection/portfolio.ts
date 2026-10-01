import { chartMoney, money, sentenceDate } from "../contract/format.ts";
import { trendAt, type PowerLawFit } from "../job/powerlaw.ts";
import type { ProjectionDocument } from "../job/projection.ts";

const DAY_MS = 86_400_000;
const LEAD_ONE = "If the last five finished cycles repeated, this is about what your Bitcoin would be worth. It replays those cycles. It is not a promise.";
const LEAD_TWO = "The shape is taken from five cycles, 2010 through 2022. Five is a small number.";
const BLANK = "Add the Bitcoin you own in Settings to draw this.";
const STALE = "This price is late, so the projection is using an older price.";
const NO_PRICE = "Today's price is not available, so this cannot start.";
const NO_REPLAY = "The replay is not available right now.";
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
  const readings = readingLines(points, document.highIndex, document.lowIndex);
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
  if (record.schema !== 1 || record.genesis !== "2009-01-03" || record.samples !== 204) return false;
  if (!isFit(record.fit)) return false;
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
  return true;
}

function walk(
  document: ProjectionDocument,
  spot: number,
  spotDate: string,
  coinsHeld: number,
  buy: { amount: number; every: "week" | "month" } | null,
  phase: number,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [
    { date: spotDate, price: spot, coins: coinsHeld, value: coinsHeld * spot, phase: null, mark: null },
  ];
  const end = lastFridayOnOrBefore(addYears(spotDate, 20));
  let coins = coinsHeld;
  let step = (phase + 1) % document.samples;
  for (let date = nextFridayAfter(spotDate); date <= end; date = addDays(date, 7)) {
    const price = trendAt(document.fit, date) * (document.template[step] ?? 0);
    if (buy != null && (buy.every === "week" || isFirstFridayOfMonth(date))) {
      coins += buy.amount / price;
    }
    const mark = step === document.highIndex ? "high" : step === document.lowIndex ? "low" : null;
    points.push({ date, price, coins, value: coins * price, phase: step, mark });
    step = (step + 1) % document.samples;
  }
  return points;
}

function readingLines(points: readonly ProjectionPoint[], highIndex: number, lowIndex: number): string[] {
  const lines: string[] = [];
  for (const point of points) {
    if (point.phase === highIndex) lines.push(reading("high", point));
    if (point.phase === lowIndex) lines.push(reading("low", point));
  }
  const last = points[points.length - 1];
  if (last != null && last.phase !== highIndex && last.phase !== lowIndex) {
    lines.push(`In ${last.date.slice(0, 4)}, at the end of the 20 years, about ${chartMoney(last.value)}.`);
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
