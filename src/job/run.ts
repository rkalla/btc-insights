import { existsSync } from "node:fs";
import { chmod, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { money, sentenceDate, signedPercent } from "../contract/format.ts";
import type { FridayDocument } from "../contract/types.ts";
import { dueFriday, evaluateFridayCall } from "./call.ts";
import { buildFriday } from "./friday.ts";
import type { HistoryRow, PublishedRecord } from "./friday.ts";
import { buildLive } from "./live.ts";
import type { FrozenFriday, LivePrint } from "./live.ts";
import { fitPowerLaw, trendAt } from "./powerlaw.ts";
import { PROJECTION_PUBLIC } from "../projection/publish.ts";
import { buildProjectionDocument } from "./projection.ts";
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

function findFixtures(moduleUrl: string): { record: string; history: string } {
  let dir = dirname(fileURLToPath(moduleUrl));
  for (;;) {
    const record = join(dir, "fixtures", "published-record.json");
    if (existsSync(record)) {
      return { record, history: join(dir, "fixtures", "history", "btc-daily.json") };
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error("fixtures missing");
    dir = parent;
  }
}

const FIXTURES = findFixtures(import.meta.url);

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
  capCheckedOn: string | null;
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
  recordPath: string;
  historyPath: string;
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

export function fridayStep(now: Date): "idle" | "try" | "stop" {
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

function isoStamp(now: Date): string {
  return now.toISOString().replace(".000Z", "Z");
}

function errorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return null;
}

async function dirStatus(dir: string): Promise<"ok" | "missing"> {
  try {
    const info = await stat(dir);
    return info.isDirectory() ? "ok" : "missing";
  } catch (error) {
    if (errorCode(error) === "ENOENT") return "missing";
    throw error;
  }
}

async function readJson(path: string): Promise<unknown | null> {
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return null;
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

async function readState(stateDir: string): Promise<StoredState | null> {
  const value = await readJson(join(stateDir, "state.json"));
  if (typeof value !== "object" || value === null) return null;
  const row = value as StoredState;
  const frozen = row.frozen;
  if (typeof frozen !== "object" || frozen === null) return null;
  if (typeof frozen.officialCloseDate !== "string") return null;
  if (typeof frozen.trend !== "number" || !(frozen.trend > 0)) return null;
  if (typeof row.spotUsd !== "number" || !(row.spotUsd > 0)) return null;
  if (typeof row.spotAsOf !== "string" || typeof row.printLabel !== "string") return null;
  if (typeof frozen.anchors !== "object" || frozen.anchors === null) return null;
  let gold: StoredGold | null = null;
  if (typeof row.gold === "object" && row.gold !== null) {
    const parsed = row.gold;
    if (typeof parsed.usd === "number" && parsed.usd > 0 && typeof parsed.asOf === "string") {
      gold = { usd: parsed.usd, asOf: parsed.asOf, filled: parsed.filled === true };
    }
  }
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
    gold,
    lastMetricsDate: typeof row.lastMetricsDate === "string" ? row.lastMetricsDate : null,
    metricsCheckedOn: typeof row.metricsCheckedOn === "string" ? row.metricsCheckedOn : null,
    missingFriday: typeof row.missingFriday === "string" ? row.missingFriday : null,
    capCheckedOn: typeof row.capCheckedOn === "string" ? row.capCheckedOn : null,
  };
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

async function writeDataFile(
  dir: string,
  name: "friday.json" | "live.json" | "projection.json",
  value: unknown,
): Promise<void> {
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

function positiveCap(row: HistoryRow): number | null {
  const raw = row.CapMVRVCur;
  const ratio = typeof raw === "number" ? raw : raw == null ? Number.NaN : Number(raw);
  return ratio > 0 ? ratio : null;
}

function realizedPrice(row: HistoryRow, price: number): number | null {
  const ratio = positiveCap(row);
  if (ratio == null) return null;
  return price / ratio;
}

function mergeRows(history: HistoryRow[], extra: readonly HistoryRow[]): HistoryRow[] {
  const byDate = new Map<string, HistoryRow>();
  for (const row of history) byDate.set(row.time.slice(0, 10), row);
  for (const row of extra) {
    const date = row.time.slice(0, 10);
    const prior = byDate.get(date);
    if (prior != null && positiveCap(prior) != null && positiveCap(row) == null) {
      byDate.set(date, { ...row, CapMVRVCur: prior.CapMVRVCur });
    } else {
      byDate.set(date, row);
    }
  }
  return [...byDate.values()].sort((left, right) => (left.time < right.time ? -1 : left.time > right.time ? 1 : 0));
}

async function readHistory(ctx: Ctx, extra: readonly HistoryRow[]): Promise<HistoryRow[]> {
  const stored = asRows(await readJson(join(ctx.stateDir, "history.json")));
  if (stored.length > 0) return mergeRows(stored, extra);
  const seeded = asRows(await readJson(ctx.historyPath));
  if (seeded.length === 0) throw new Error("history seed missing");
  return mergeRows(seeded, extra);
}

async function writeLive(
  ctx: Ctx,
  state: StoredState,
  print: LivePrint,
  keepNewerMissing: boolean,
): Promise<void> {
  const lockPath = join(ctx.stateDir, ".live.lock");
  let locked = false;
  if ((await dirStatus(ctx.stateDir)) === "ok") {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        await writeFile(lockPath, `${process.pid}\n`, { flag: "wx", mode: STATE_MODE });
        locked = true;
        break;
      } catch (error) {
        if (errorCode(error) !== "EEXIST") throw error;
        let running = false;
        try {
          const held = Number.parseInt((await readFile(lockPath, "utf8")).trim(), 10);
          if (Number.isInteger(held) && held > 0) {
            try {
              process.kill(held, 0);
              running = true;
            } catch (signalError) {
              running = errorCode(signalError) !== "ESRCH";
            }
          }
        } catch (readError) {
          if (errorCode(readError) !== "ENOENT") throw readError;
        }
        if (!running) {
          await rm(lockPath, { force: true });
          continue;
        }
        await delay(20);
      }
    }
    if (!locked) throw new Error("state lock");
  }
  try {
    let nextState = state;
    let nextPrint = print;
    if (keepNewerMissing && nextPrint.missingClose === false) {
      const latest = await readState(ctx.stateDir);
      const disk = await readJson(join(ctx.dataDir, "live.json"));
      const diskMissing =
        typeof disk === "object" && disk !== null && (disk as { missingClose?: unknown }).missingClose === true;
      const diskDate =
        typeof disk === "object" &&
        disk !== null &&
        typeof (disk as { officialCloseDate?: unknown }).officialCloseDate === "string"
          ? (disk as { officialCloseDate: string }).officialCloseDate
          : null;
      const newer = latest?.missingFriday ?? (diskMissing ? diskDate : null);
      if (newer != null) {
        nextState = { ...nextState, missingFriday: newer };
        nextPrint = { ...nextPrint, missingClose: true };
      }
    }
    const frozen =
      nextState.missingFriday != null
        ? { ...nextState.frozen, officialCloseDate: nextState.missingFriday }
        : nextState.frozen;
    await writeDataFile(ctx.dataDir, "live.json", buildLive(frozen, nextPrint));
    await writeState(ctx.stateDir, {
      ...nextState,
      spotUsd: nextPrint.spot,
      spotAsOf: nextPrint.spotAsOf,
      printLabel: nextPrint.printLabel,
      gold: nextPrint.gold,
    });
  } finally {
    if (locked) await removeTemp(lockPath);
  }
}

function laterDate(current: string | null, candidate: string): string {
  if (current == null || current < candidate) return candidate;
  return current;
}

function earliestMissingCap(history: readonly HistoryRow[], today: string): string | null {
  let found: string | null = null;
  for (const row of history) {
    const date = row.time.slice(0, 10);
    if (date >= today) continue;
    if (rowPrice(row) == null || positiveCap(row) != null) continue;
    if (found == null || date < found) found = date;
  }
  return found;
}

async function loadKnownHistory(ctx: Ctx): Promise<HistoryRow[]> {
  const stored = asRows(await readJson(join(ctx.stateDir, "history.json")));
  if (stored.length > 0) return stored;
  return asRows(await readJson(ctx.historyPath));
}

async function rememberMissing(ctx: Ctx, state: StoredState): Promise<StoredState> {
  const latest = await readState(ctx.stateDir);
  if (latest?.missingFriday == null) return state;
  return { ...state, missingFriday: latest.missingFriday };
}

async function storeDailyRows(
  ctx: Ctx,
  state: StoredState,
  rows: readonly HistoryRow[],
  checkedCaps: string | null,
): Promise<StoredState> {
  const priced = rows.filter((row) => rowPrice(row) != null);
  if (priced.length === 0) {
    if (checkedCaps == null) return state;
    const next = await rememberMissing(ctx, { ...state, capCheckedOn: checkedCaps });
    await writeState(ctx.stateDir, next);
    return next;
  }
  const history = await readHistory(ctx, priced);
  await writeAtomic(ctx.stateDir, "history.json", history, STATE_MODE);
  let next = state;
  for (const row of priced) {
    const price = rowPrice(row);
    if (price == null) continue;
    const date = row.time.slice(0, 10);
    const realized = realizedPrice(row, price);
    const advanceRealized =
      realized != null && (next.frozen.realizedAsOf == null || date >= next.frozen.realizedAsOf);
    const advanceCursor = next.lastMetricsDate == null || date > next.lastMetricsDate;
    next = {
      ...next,
      frozen: {
        ...next.frozen,
        realizedPrice: advanceRealized ? realized : next.frozen.realizedPrice,
        realizedAsOf: advanceRealized ? date : next.frozen.realizedAsOf,
      },
      lastMetricsDate: advanceCursor ? date : next.lastMetricsDate,
      metricsCheckedOn: advanceCursor ? date : next.metricsCheckedOn,
    };
  }
  if (checkedCaps != null) next = { ...next, capCheckedOn: checkedCaps };
  next = await rememberMissing(ctx, next);
  await writeState(ctx.stateDir, next);
  return next;
}

async function refillMetrics(ctx: Ctx, state: StoredState): Promise<StoredState | number> {
  const today = ctx.now().toISOString().slice(0, 10);
  const missing = earliestMissingCap(await loadKnownHistory(ctx), today);
  const needNew = state.lastMetricsDate == null || state.lastMetricsDate < today;
  const capDue = missing != null && state.capCheckedOn !== today;
  if (!needNew && !capDue) return state;
  let start = needNew ? (state.lastMetricsDate != null ? addUtcDays(state.lastMetricsDate, 1) : today) : today;
  if (missing != null && missing < start) start = missing;
  if (start > today) return state;
  let rows: HistoryRow[];
  try {
    rows = await fetchCoinMetricsRange(
      ctx.metricsBase,
      start,
      addUtcDays(today, 1),
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
  const checked = missing != null && missing < today ? today : null;
  return storeDailyRows(ctx, state, rows, checked);
}

async function runLive(ctx: Ctx): Promise<number> {
  let state = await readState(ctx.stateDir);
  if (state != null) {
    const filled = await refillMetrics(ctx, state);
    if (typeof filled === "number") return filled;
    state = filled;
  }
  await publishCatchUp(ctx);
  state = (await readState(ctx.stateDir)) ?? state;
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
      gold = await fetchGoldQuote(goldUrl, ctx.fetch, isoStamp(ctx.now()), ctx.env.GOLD_QUOTE_API_KEY ?? "");
    } catch (error) {
      const stopped = stopForVendor(ctx, error);
      if (stopped != null) return stopped;
      throw error;
    }
  }
  if (state == null) return 0;
  const spotAsOf = isoStamp(ctx.now());
  const date = spotAsOf.slice(0, 10);
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "Day";
  await writeLive(
    ctx,
    state,
    {
      spot,
      spotAsOf,
      printLabel: `${weekday} ${sentenceDate(date)} print`,
      isOfficialClose: false,
      bitcoin: { usd: spot, asOf: spotAsOf },
      gold,
      now: spotAsOf,
      missingClose: state.missingFriday != null,
    },
    true,
  );
  return 0;
}

function fitCaveat(gap: number, trend: number): string {
  const rounded = Math.round(trend / 1000) * 1000;
  return `Gap about ${signedPercent(gap)} on this fit (trend about ${money(rounded)}). Not a price target.`;
}

function realizedReading(
  item: PublishedRecord["context"][number],
  ratio: number | null,
  price: number,
): PublishedRecord["context"][number] {
  if (ratio == null) {
    return {
      ...item,
      flag: "NO PRINT",
      flagTone: "muted",
      value: "Friday cost print has not arrived. Build stays off.",
      note: "Build is off.",
    };
  }
  const above = ratio - 1;
  const pct = Math.abs(Math.round(above * 100));
  const direction = above < 0 ? "below" : "above";
  return {
    ...item,
    flag: signedPercent(above),
    flagTone: "neutral",
    value: `About ${pct}% ${direction} cost. Cost about ${money(Math.round(price / ratio))}.`,
    note: ratio < 1 ? "Build slices this Friday." : "Build is off.",
  };
}

function parsePrevious(value: unknown): FridayDocument["previousOfficial"] | undefined {
  if (value == null) return null;
  if (typeof value !== "object") return undefined;
  const row = value as { closeDate?: unknown; closeLabel?: unknown; context?: unknown };
  if (typeof row.closeDate !== "string" || typeof row.closeLabel !== "string" || !Array.isArray(row.context)) {
    return undefined;
  }
  return {
    closeDate: row.closeDate,
    closeLabel: row.closeLabel,
    context: row.context as FridayDocument["context"],
  };
}

function carriedPrevious(
  existing: unknown,
  friday: string,
  fallback: FridayDocument["previousOfficial"],
): FridayDocument["previousOfficial"] {
  if (typeof existing !== "object" || existing === null) return fallback;
  const doc = existing as {
    official?: { closeDate?: unknown; closeLabel?: unknown };
    context?: unknown;
    previousOfficial?: unknown;
  };
  const closeDate = doc.official?.closeDate;
  const closeLabel = doc.official?.closeLabel;
  if (typeof closeDate !== "string" || typeof closeLabel !== "string" || !Array.isArray(doc.context)) {
    return fallback;
  }
  if (closeDate < friday) {
    return { closeDate, closeLabel, context: doc.context as FridayDocument["context"] };
  }
  if (closeDate === friday) {
    const kept = parsePrevious(doc.previousOfficial);
    return kept === undefined ? fallback : kept;
  }
  return fallback;
}

function isoCloseDate(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const official = (value as { official?: { closeDate?: unknown } }).official;
  const closeDate = official?.closeDate;
  if (typeof closeDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(closeDate)) return null;
  return closeDate;
}

async function onFridayBar(ctx: Ctx, friday: string, rows: HistoryRow[]): Promise<void> {
  const bar = rowForDate(rows, friday);
  const price = bar == null ? null : rowPrice(bar);
  if (bar == null || price == null) return;
  const state = await readState(ctx.stateDir);
  if (state != null) await storeDailyRows(ctx, state, [bar], null);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(ctx.recordPath, "utf8")) as unknown;
  } catch {
    throw new Error("record unreadable");
  }
  if (typeof parsed !== "object" || parsed === null) throw new Error("record unreadable");
  const record = parsed as PublishedRecord;
  if (typeof record.official?.closeDate !== "string" || typeof record.anchors?.low !== "number") {
    throw new Error("record unreadable");
  }
  const history = await readHistory(ctx, rows);
  const points: { date: string; price: number }[] = [];
  for (const row of history) {
    const point = rowPrice(row);
    if (point == null) continue;
    points.push({ date: row.time.slice(0, 10), price: point });
  }
  const fit = fitPowerLaw(points, friday);
  const trend = trendAt(fit, friday);
  const ratio = positiveCap(bar);
  const call = evaluateFridayCall({
    friday,
    gap: price / trend - 1,
    ratio,
    buys: Array.isArray(record.buys) ? record.buys : [],
    sells: Array.isArray(record.sells) ? record.sells : [],
    armedWait: record.armedWait === true,
  });
  const previousOfficial = carriedPrevious(
    await readJson(join(ctx.dataDir, "friday.json")),
    friday,
    record.previousOfficial,
  );
  const nextRecord: PublishedRecord = {
    ...record,
    official: call.official,
    cashFlags: call.flags,
    standDownPause: call.standDownPause,
    armedWait: call.armedWait,
    dollarSlot: call.dollarSlot,
    activeFireDate: call.activeFireDate,
    caveats: record.caveats.map((item) =>
      item.kind === "fit" ? { ...item, body: fitCaveat(price / trend - 1, trend) } : item,
    ),
    context: record.context.map((item) => (item.key === "realizedPrice" ? realizedReading(item, ratio, price) : item)),
    previousOfficial,
  };
  const doc = buildFriday(history, nextRecord);
  const spotAsOf = `${friday}T00:00:00Z`;
  const label = `${sentenceDate(friday)} daily close`;
  const fresh = (await readState(ctx.stateDir)) ?? state;
  const realized = ratio == null ? null : price / ratio;
  const newerRealized =
    fresh != null &&
    fresh.frozen.realizedAsOf != null &&
    fresh.frozen.realizedAsOf > friday &&
    fresh.frozen.realizedPrice != null;
  const frozen: FrozenFriday = {
    officialCloseDate: friday,
    trend,
    realizedPrice: newerRealized ? fresh.frozen.realizedPrice : (realized ?? fresh?.frozen.realizedPrice ?? null),
    realizedAsOf: newerRealized ? fresh.frozen.realizedAsOf : (realized != null ? friday : (fresh?.frozen.realizedAsOf ?? null)),
    anchors: record.anchors,
  };
  await writeDataFile(ctx.dataDir, "friday.json", doc);
  if (PROJECTION_PUBLIC) {
    await writeDataFile(ctx.dataDir, "projection.json", buildProjectionDocument(points, friday, fit));
  }
  const next: StoredState = {
    frozen,
    spotUsd: price,
    spotAsOf,
    printLabel: label,
    gold: fresh?.gold ?? null,
    lastMetricsDate: laterDate(fresh?.lastMetricsDate ?? null, friday),
    metricsCheckedOn: laterDate(fresh?.metricsCheckedOn ?? null, friday),
    missingFriday: null,
    capCheckedOn: fresh?.capCheckedOn ?? null,
  };
  await writeLive(
    ctx,
    next,
    {
      spot: price,
      spotAsOf,
      printLabel: label,
      isOfficialClose: true,
      bitcoin: { usd: price, asOf: spotAsOf },
      gold: next.gold,
      now: isoStamp(ctx.now()),
      missingClose: false,
    },
    false,
  );
  if ((await dirStatus(ctx.stateDir)) === "ok") {
    await writeAtomic(ctx.stateDir, "history.json", history, STATE_MODE);
  }
}

async function publishCatchUp(ctx: Ctx): Promise<void> {
  try {
    const due = dueFriday(ctx.now());
    if (due == null) return;
    const existing = await readJson(join(ctx.dataDir, "friday.json"));
    const close = isoCloseDate(existing);
    if (close == null || close >= due) return;
    const stored = rowForDate(await loadKnownHistory(ctx), due);
    let rows = stored == null ? [] : [stored];
    if (stored == null) {
      try {
        rows = await fetchCoinMetricsRange(
          ctx.metricsBase,
          due,
          addUtcDays(due, 1),
          ctx.fetch,
          ctx.pace,
          () => ctx.now().getTime(),
          ctx.sleep,
        );
      } catch (error) {
        if (stopForVendor(ctx, error) != null) return;
        throw error;
      }
    }
    if (rowForDate(rows, due) == null) {
      ctx.stderr(`friday ${due} still missing`);
      return;
    }
    await onFridayBar(ctx, due, rows);
  } catch (error) {
    if (stopForVendor(ctx, error) != null) return;
    ctx.stderr(error instanceof Error ? error.message : "publish failed");
  }
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
  await writeLive(
    ctx,
    { ...state, missingFriday: friday },
    {
      spot: state.spotUsd,
      spotAsOf: state.spotAsOf,
      printLabel: state.printLabel,
      isOfficialClose: false,
      bitcoin: { usd: state.spotUsd, asOf: state.spotAsOf },
      gold: state.gold,
      now: isoStamp(ctx.now()),
      missingClose: true,
    },
    false,
  );
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
    await onFridayBar(ctx, friday, rows);
    return 0;
  }
}

async function execute(options: RunOptions): Promise<number> {
  const env = options.env;
  const dataDir = (env.DATA_DIR ?? "").trim() || DEFAULT_DATA_DIR;
  const stateDir = (env.STATE_DIR ?? "").trim() || DEFAULT_STATE_DIR;
  if ((await dirStatus(dataDir)) !== "ok") {
    (options.stderr ?? (() => undefined))("data dir missing");
    return 1;
  }
  const dataReal = await realpath(dataDir);
  if ((await dirStatus(stateDir)) === "ok") {
    const stateReal = await realpath(stateDir);
    const rel = relative(dataReal, stateReal);
    if (rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"))) return 1;
  }
  const fetchImpl: FetchLike = options.fetch ?? ((url, init) => fetch(url, init));
  let mode: "live" | "friday" = options.mode ?? "live";
  if (options.mode == null) {
    for (const arg of options.argv ?? []) {
      if (arg === "live" || arg === "friday") {
        mode = arg;
        break;
      }
    }
  }
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
    recordPath: (env.RECORD_PATH ?? "").trim() || FIXTURES.record,
    historyPath: (env.HISTORY_PATH ?? "").trim() || FIXTURES.history,
  };
  if (mode === "friday") return runFriday(ctx);
  return runLive(ctx);
}

export async function run(options: RunOptions): Promise<number> {
  const setUmask = options.umask ?? ((mask: number) => process.umask(mask));
  const previous = setUmask(0o027);
  try {
    return await execute(options);
  } catch (error) {
    const write = options.stderr ?? ((line: string) => process.stderr.write(`${line}\n`));
    if (error instanceof VendorFailure) {
      write(`vendor failure: ${error.status}`);
      return 0;
    }
    write(error instanceof Error ? error.message : "publish failed");
    return 1;
  } finally {
    setUmask(previous);
  }
}

const entry = process.argv[1];
if (entry != null && pathToFileURL(entry).href === import.meta.url) {
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
      process.stderr.write("publish failed\n");
      process.exit(1);
    });
}
