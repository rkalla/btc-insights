import { chmod, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { sentenceDate } from "../contract/format.ts";
import { buildFriday } from "./friday.ts";
import type { HistoryRow, PublishedRecord } from "./friday.ts";
import { buildLive } from "./live.ts";
import type { FrozenFriday, LivePrint } from "./live.ts";
import { fitPowerLaw, trendAt } from "./powerlaw.ts";
import type { DatedPrice } from "./powerlaw.ts";
import {
  createPace,
  fetchBitcoinSpot,
  fetchCoinMetricsRange,
  fetchGoldQuote,
  rowForDate,
  rowPrice,
  VendorFailure,
} from "./vendors.ts";
import type { FetchLike, PaceClock } from "./vendors.ts";

const DEFAULT_DATA_DIR = "/var/www/html/data";
const DEFAULT_STATE_DIR = "/home/exedev/btc-insights/state";
const DEFAULT_METRICS_BASE = "https://community-api.coinmetrics.io";
const DEFAULT_GECKO_ORIGIN = "https://api.coingecko.com";
const PUBLISHED_MODE = 0o640;
const STATE_MODE = 0o600;

export const FRIDAY_RETRY_MS = 60_000;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type FridayStep = "idle" | "try" | "stop";

interface StoredGold {
  usd: number;
  asOf: string;
  filled: boolean;
}

interface StoredState {
  frozen: FrozenFriday;
  spotUsd: number;
  spotAsOf: string;
  printLabel: string;
  gold: StoredGold | null;
  lastMetricsDate: string | null;
  metricsCheckedOn: string | null;
  missingFriday: string | null;
}

interface Ctx {
  env: Record<string, string | undefined>;
  dataDir: string;
  stateDir: string;
  fetch: FetchLike;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  stderr: (line: string) => void;
  geckoOrigin: string;
  metricsBase: string;
  pace: PaceClock;
}

export interface RunOptions {
  env: Record<string, string | undefined>;
  argv?: readonly string[];
  mode?: "live" | "friday";
  fetch?: FetchLike;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  stderr?: (line: string) => void;
  umask?: (mask: number) => number;
}

export function fridayStep(now: Date): FridayStep {
  if (now.getUTCDay() !== 6) return "idle";
  const seconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  if (seconds < 5 * 60) return "idle";
  if (seconds >= 6 * 3600) return "stop";
  return "try";
}

export function fridayDate(now: Date): string | null {
  if (now.getUTCDay() !== 6) return null;
  const friday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return friday.toISOString().slice(0, 10);
}

export function addUtcDays(isoDate: string, days: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function jobMode(argv: readonly string[]): "live" | "friday" {
  for (const arg of argv) {
    if (arg === "live" || arg === "friday") return arg;
  }
  return "live";
}

function isoStamp(now: Date): string {
  return now.toISOString().replace(".000Z", "Z");
}

function dayOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function intradayLabel(iso: string): string {
  const date = iso.slice(0, 10);
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "Day";
  return `${weekday} ${sentenceDate(date)} print`;
}

function isEnoent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isInside(parent: string, child: string): boolean {
  const from = resolve(parent);
  const to = resolve(child);
  if (from === to) return true;
  const rel = relative(from, to);
  return rel !== "" && !rel.startsWith("..") && !rel.startsWith("/");
}

async function dirStatus(dir: string): Promise<"ok" | "missing"> {
  try {
    const info = await stat(dir);
    return info.isDirectory() ? "ok" : "missing";
  } catch (error) {
    if (isEnoent(error)) return "missing";
    throw error;
  }
}

async function readJson(path: string): Promise<unknown | null> {
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (isEnoent(error)) return null;
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function asRows(value: unknown): HistoryRow[] {
  if (!Array.isArray(value)) return [];
  const rows: HistoryRow[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const row = item as HistoryRow;
    if (typeof row.time !== "string") continue;
    rows.push({
      time: row.time,
      PriceUSD: row.PriceUSD ?? null,
      CapMVRVCur: row.CapMVRVCur ?? null,
    });
  }
  return rows;
}

function asRecord(value: unknown): PublishedRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as PublishedRecord;
  if (typeof record.official?.closeDate !== "string") return null;
  if (typeof record.anchors?.low !== "number") return null;
  return record;
}

function parseGoldState(value: unknown): StoredGold | null {
  if (typeof value !== "object" || value === null) return null;
  const gold = value as StoredGold;
  if (typeof gold.usd !== "number" || !(gold.usd > 0)) return null;
  if (typeof gold.asOf !== "string") return null;
  return { usd: gold.usd, asOf: gold.asOf, filled: gold.filled === true };
}

function parseState(value: unknown): StoredState | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as StoredState;
  const frozen = row.frozen;
  if (typeof frozen !== "object" || frozen === null) return null;
  if (typeof frozen.officialCloseDate !== "string") return null;
  if (typeof frozen.trend !== "number" || !(frozen.trend > 0)) return null;
  if (typeof row.spotUsd !== "number" || !(row.spotUsd > 0)) return null;
  if (typeof row.spotAsOf !== "string" || typeof row.printLabel !== "string") return null;
  if (typeof frozen.anchors !== "object" || frozen.anchors === null) return null;
  return {
    frozen: {
      officialCloseDate: frozen.officialCloseDate,
      trend: frozen.trend,
      realizedPrice: typeof frozen.realizedPrice === "number" ? frozen.realizedPrice : null,
      realizedAsOf: typeof frozen.realizedAsOf === "string" ? frozen.realizedAsOf : null,
      anchors: frozen.anchors,
    },
    spotUsd: row.spotUsd,
    spotAsOf: row.spotAsOf,
    printLabel: row.printLabel,
    gold: parseGoldState(row.gold),
    lastMetricsDate: typeof row.lastMetricsDate === "string" ? row.lastMetricsDate : null,
    metricsCheckedOn: typeof row.metricsCheckedOn === "string" ? row.metricsCheckedOn : null,
    missingFriday: typeof row.missingFriday === "string" ? row.missingFriday : null,
  };
}

async function readState(stateDir: string): Promise<StoredState | null> {
  return parseState(await readJson(join(stateDir, "state.json")));
}

async function removeTemp(path: string): Promise<void> {
  try {
    await rm(path, { force: true });
  } catch {
    // Keep the error that made the write fail.
  }
}

async function writeAtomic(dir: string, name: string, value: unknown, mode: number): Promise<void> {
  const target = join(dir, name);
  const temporary = join(dir, `.${name}.${process.pid}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(value)}\n`, { mode });
    await chmod(temporary, mode);
    await rename(temporary, target);
  } catch (error) {
    await removeTemp(temporary);
    throw error;
  }
}

async function writeDataFile(dir: string, name: "friday.json" | "live.json", value: unknown): Promise<void> {
  await writeAtomic(dir, name, value, PUBLISHED_MODE);
}

async function writeState(stateDir: string, state: StoredState): Promise<void> {
  if ((await dirStatus(stateDir)) !== "ok") return;
  await writeAtomic(stateDir, "state.json", state, STATE_MODE);
}

function stopForVendor(ctx: Ctx, error: unknown): number | null {
  if (!(error instanceof VendorFailure)) return null;
  ctx.stderr(`vendor failure: ${error.status}`);
  return 0;
}

function realizedPrice(row: HistoryRow, price: number): number | null {
  const raw = row.CapMVRVCur;
  const ratio = typeof raw === "number" ? raw : raw == null ? Number.NaN : Number(raw);
  if (!(ratio > 0)) return null;
  return price / ratio;
}

function mergeRows(history: HistoryRow[], extra: readonly HistoryRow[]): HistoryRow[] {
  const byDate = new Map<string, HistoryRow>();
  for (const row of history) byDate.set(row.time.slice(0, 10), row);
  for (const row of extra) byDate.set(row.time.slice(0, 10), row);
  return [...byDate.values()].sort((left, right) => (left.time < right.time ? -1 : left.time > right.time ? 1 : 0));
}

function pointsOf(rows: readonly HistoryRow[]): DatedPrice[] {
  const points: DatedPrice[] = [];
  for (const row of rows) {
    const price = rowPrice(row);
    if (price == null) continue;
    points.push({ date: row.time.slice(0, 10), price });
  }
  return points;
}

function withMissingDate(state: StoredState): FrozenFriday {
  if (state.missingFriday == null) return state.frozen;
  return { ...state.frozen, officialCloseDate: state.missingFriday };
}

async function writeLive(ctx: Ctx, state: StoredState, print: LivePrint): Promise<void> {
  const live = buildLive(withMissingDate(state), print);
  await writeDataFile(ctx.dataDir, "live.json", live);
  await writeState(ctx.stateDir, {
    ...state,
    spotUsd: print.spot,
    spotAsOf: print.spotAsOf,
    printLabel: print.printLabel,
    gold: print.gold,
  });
}

function applyMetricRows(state: StoredState, rows: readonly HistoryRow[], today: string): StoredState {
  let next = state;
  for (const row of rows) {
    const price = rowPrice(row);
    if (price == null) continue;
    const date = row.time.slice(0, 10);
    const realized = realizedPrice(row, price);
    next = {
      ...next,
      frozen: {
        ...next.frozen,
        realizedPrice: realized ?? next.frozen.realizedPrice,
        realizedAsOf: realized != null ? date : next.frozen.realizedAsOf,
      },
      lastMetricsDate: date,
    };
  }
  return { ...next, metricsCheckedOn: today };
}

async function refreshMetrics(ctx: Ctx, state: StoredState, today: string): Promise<StoredState> {
  if (state.metricsCheckedOn === today) return state;
  const start = state.lastMetricsDate != null ? addUtcDays(state.lastMetricsDate, 1) : today;
  const end = addUtcDays(today, 1);
  if (start > today) return { ...state, metricsCheckedOn: today };
  const rows = await fetchCoinMetricsRange(
    ctx.metricsBase,
    start,
    end,
    ctx.fetch,
    ctx.pace,
    () => ctx.now().getTime(),
    ctx.sleep,
  );
  return applyMetricRows(state, rows, today);
}

async function runLive(ctx: Ctx): Promise<number> {
  const key = (ctx.env.COINGECKO_API_KEY ?? "").trim();
  if (key === "") return 0;
  let spot: number;
  try {
    spot = await fetchBitcoinSpot(ctx.geckoOrigin, key, ctx.fetch);
  } catch (error) {
    const stopped = stopForVendor(ctx, error);
    if (stopped != null) return stopped;
    throw error;
  }
  const goldUrl = (ctx.env.GOLD_QUOTE_URL ?? "").trim();
  let gold: StoredGold | null = null;
  if (goldUrl !== "") {
    try {
      gold = await fetchGoldQuote(goldUrl, ctx.fetch, isoStamp(ctx.now()));
    } catch (error) {
      const stopped = stopForVendor(ctx, error);
      if (stopped != null) return stopped;
      throw error;
    }
  }
  let state = await readState(ctx.stateDir);
  if (state == null) return 0;
  const today = dayOf(ctx.now());
  try {
    state = await refreshMetrics(ctx, state, today);
  } catch (error) {
    const stopped = stopForVendor(ctx, error);
    if (stopped != null) return stopped;
    throw error;
  }
  const spotAsOf = isoStamp(ctx.now());
  await writeLive(ctx, state, {
    spot,
    spotAsOf,
    printLabel: intradayLabel(spotAsOf),
    isOfficialClose: false,
    bitcoin: { usd: spot, asOf: spotAsOf },
    gold,
    now: spotAsOf,
    missingClose: state.missingFriday != null,
  });
  return 0;
}

async function readRecord(ctx: Ctx): Promise<PublishedRecord | null> {
  const configured = (ctx.env.RECORD_PATH ?? "").trim();
  const path = configured !== "" ? configured : "fixtures/published-record.json";
  return asRecord(await readJson(path));
}

async function readHistory(ctx: Ctx, fetched: readonly HistoryRow[]): Promise<HistoryRow[]> {
  const stored = asRows(await readJson(join(ctx.stateDir, "history.json")));
  if (stored.length > 0) return mergeRows(stored, fetched);
  const configured = (ctx.env.HISTORY_PATH ?? "").trim();
  const path = configured !== "" ? configured : "fixtures/history/btc-daily.json";
  return mergeRows(asRows(await readJson(path)), fetched);
}

async function onFridayBar(ctx: Ctx, friday: string, rows: HistoryRow[]): Promise<void> {
  const bar = rowForDate(rows, friday);
  if (bar == null) return;
  const price = rowPrice(bar);
  if (price == null) return;
  const state = await readState(ctx.stateDir);
  const record = await readRecord(ctx);
  const spotAsOf = `${friday}T00:00:00Z`;
  const label = `${sentenceDate(friday)} daily close`;
  if (record != null && record.official.closeDate === friday) {
    const history = await readHistory(ctx, rows);
    const doc = buildFriday(history, record);
    const fit = fitPowerLaw(pointsOf(history), friday);
    const frozen: FrozenFriday = {
      officialCloseDate: friday,
      trend: trendAt(fit, friday),
      realizedPrice: realizedPrice(bar, price) ?? state?.frozen.realizedPrice ?? null,
      realizedAsOf: friday,
      anchors: record.anchors,
    };
    await writeDataFile(ctx.dataDir, "friday.json", doc);
    const next: StoredState = {
      frozen,
      spotUsd: price,
      spotAsOf,
      printLabel: label,
      gold: state?.gold ?? null,
      lastMetricsDate: friday,
      metricsCheckedOn: dayOf(ctx.now()),
      missingFriday: null,
    };
    await writeLive(ctx, next, {
      spot: price,
      spotAsOf,
      printLabel: label,
      isOfficialClose: true,
      bitcoin: { usd: price, asOf: spotAsOf },
      gold: next.gold,
      now: isoStamp(ctx.now()),
      missingClose: false,
    });
    if ((await dirStatus(ctx.stateDir)) === "ok") {
      await writeAtomic(ctx.stateDir, "history.json", history, STATE_MODE);
    }
    return;
  }
  if (state == null) return;
  const realized = realizedPrice(bar, price);
  const next: StoredState = {
    ...state,
    frozen: {
      ...state.frozen,
      realizedPrice: realized ?? state.frozen.realizedPrice,
      realizedAsOf: realized != null ? friday : state.frozen.realizedAsOf,
    },
    lastMetricsDate: friday,
    metricsCheckedOn: dayOf(ctx.now()),
    missingFriday: null,
  };
  await writeLive(ctx, next, {
    spot: price,
    spotAsOf,
    printLabel: label,
    isOfficialClose: false,
    bitcoin: { usd: price, asOf: spotAsOf },
    gold: state.gold,
    now: isoStamp(ctx.now()),
    missingClose: false,
  });
}

async function writeMissingClose(ctx: Ctx, friday: string): Promise<void> {
  const state = await readState(ctx.stateDir);
  if (state == null) {
    const existing = await readJson(join(ctx.dataDir, "live.json"));
    if (typeof existing !== "object" || existing === null) return;
    const next = { ...(existing as Record<string, unknown>), officialCloseDate: friday, missingClose: true };
    await writeDataFile(ctx.dataDir, "live.json", next);
    return;
  }
  const next: StoredState = { ...state, missingFriday: friday };
  await writeLive(ctx, next, {
    spot: state.spotUsd,
    spotAsOf: state.spotAsOf,
    printLabel: state.printLabel,
    isOfficialClose: false,
    bitcoin: { usd: state.spotUsd, asOf: state.spotAsOf },
    gold: state.gold,
    now: isoStamp(ctx.now()),
    missingClose: true,
  });
}

async function runFriday(ctx: Ctx): Promise<number> {
  let sawAbsence = false;
  for (;;) {
    const now = ctx.now();
    const step = fridayStep(now);
    const friday = fridayDate(now);
    if (step === "stop" || friday == null) {
      if (sawAbsence && friday != null) await writeMissingClose(ctx, friday);
      return 0;
    }
    if (step === "idle") return 0;
    let rows: HistoryRow[];
    try {
      rows = await fetchCoinMetricsRange(
        ctx.metricsBase,
        friday,
        addUtcDays(friday, 1),
        ctx.fetch,
        ctx.pace,
        () => ctx.now().getTime(),
        ctx.sleep,
      );
    } catch (error) {
      const stopped = stopForVendor(ctx, error);
      if (stopped != null) return stopped;
      throw error;
    }
    if (rowForDate(rows, friday) == null) {
      sawAbsence = true;
      await ctx.sleep(FRIDAY_RETRY_MS);
      continue;
    }
    try {
      await onFridayBar(ctx, friday, rows);
    } catch (error) {
      const stopped = stopForVendor(ctx, error);
      if (stopped != null) return stopped;
      ctx.stderr("vendor failure: friday");
      return 0;
    }
    return 0;
  }
}

async function execute(options: RunOptions): Promise<number> {
  const env = options.env;
  const dataDir = (env.DATA_DIR ?? "").trim() || DEFAULT_DATA_DIR;
  const stateDir = (env.STATE_DIR ?? "").trim() || DEFAULT_STATE_DIR;
  if (isInside(dataDir, stateDir)) return 1;
  if ((await dirStatus(dataDir)) !== "ok") {
    (options.stderr ?? (() => undefined))("data dir missing");
    return 1;
  }
  const fetchImpl: FetchLike =
    options.fetch ??
    ((url, init) => fetch(url, init));
  const ctx: Ctx = {
    env,
    dataDir,
    stateDir,
    fetch: fetchImpl,
    now: options.now ?? (() => new Date()),
    sleep: options.sleep ?? ((ms) => delay(ms)),
    stderr: options.stderr ?? ((line) => process.stderr.write(`${line}\n`)),
    geckoOrigin: (env.COINGECKO_BASE_URL ?? "").trim() || DEFAULT_GECKO_ORIGIN,
    metricsBase: (env.COINMETRICS_BASE_URL ?? "").trim() || DEFAULT_METRICS_BASE,
    pace: createPace(),
  };
  const mode = options.mode ?? jobMode(options.argv ?? []);
  if (mode === "friday") return runFriday(ctx);
  return runLive(ctx);
}

export async function run(options: RunOptions): Promise<number> {
  const setUmask = options.umask ?? ((mask: number) => process.umask(mask));
  const previous = setUmask(0o027);
  try {
    return await execute(options);
  } finally {
    setUmask(previous);
  }
}

function isDirectRun(entry: string | undefined, moduleUrl: string): boolean {
  if (!entry) return false;
  return pathToFileURL(entry).href === moduleUrl;
}

if (isDirectRun(process.argv[1], import.meta.url)) {
  run({
    env: process.env,
    argv: process.argv,
    stderr: (line) => {
      process.stderr.write(`${line}\n`);
    },
  })
    .then((code) => {
      process.exit(code);
    })
    .catch(() => {
      process.stderr.write("vendor failure: crash\n");
      process.exit(1);
    });
}
