import type { HistoryRow } from "./friday.ts";

export const COINGECKO_SPOT_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

export const COIN_METRICS_MAX_REQUESTS = 10;
export const COIN_METRICS_WINDOW_MS = 6_000;

export interface FetchLike {
  (url: string, init?: { headers?: Record<string, string> }): Promise<FetchResponse>;
}

export interface FetchResponse {
  status: number;
  ok: boolean;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export interface PaceClock {
  stamps: number[];
}

export class VendorFailure extends Error {
  readonly status: number | "network";

  constructor(status: number | "network") {
    super(status === "network" ? "network" : `http ${status}`);
    this.name = "VendorFailure";
    this.status = status;
  }
}

export function createPace(): PaceClock {
  return { stamps: [] };
}

export function coinGeckoSpotUrl(origin: string): string {
  const root = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${root}/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`;
}

export function createPaceWindow(now: number, stamps: readonly number[]): number[] {
  return stamps.filter((stamp) => now - stamp < COIN_METRICS_WINDOW_MS);
}

export async function paceCoinMetrics(
  clock: PaceClock,
  now: () => number,
  sleep: (ms: number) => Promise<void>,
): Promise<void> {
  const current = now();
  clock.stamps = createPaceWindow(current, clock.stamps);
  if (clock.stamps.length >= COIN_METRICS_MAX_REQUESTS) {
    const oldest = clock.stamps[0] ?? current;
    const wait = COIN_METRICS_WINDOW_MS - (current - oldest);
    await sleep(wait > 0 ? wait : 0);
    clock.stamps = createPaceWindow(now(), clock.stamps);
    if (clock.stamps.length >= COIN_METRICS_MAX_REQUESTS) {
      clock.stamps.shift();
    }
  }
  clock.stamps.push(now());
}

export async function getJson(
  fetchImpl: FetchLike,
  url: string,
  headers?: Record<string, string>,
): Promise<unknown> {
  let response: FetchResponse;
  try {
    response = await fetchImpl(url, headers ? { headers } : undefined);
  } catch {
    throw new VendorFailure("network");
  }
  if (response.status === 429 || !response.ok) {
    try {
      await response.text();
    } catch {
      // The status is already the failure.
    }
    throw new VendorFailure(response.status);
  }
  try {
    return await response.json();
  } catch {
    throw new VendorFailure("network");
  }
}

export async function fetchBitcoinSpot(origin: string, key: string, fetchImpl: FetchLike): Promise<number> {
  const body = await getJson(fetchImpl, coinGeckoSpotUrl(origin), { "x-cg-demo-api-key": key });
  if (typeof body !== "object" || body === null) throw new VendorFailure("network");
  const usd = (body as { bitcoin?: { usd?: unknown } }).bitcoin?.usd;
  if (typeof usd !== "number" || !(usd > 0)) throw new VendorFailure("network");
  return usd;
}

function positivePrice(value: unknown): number | null {
  const price = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  return price > 0 ? price : null;
}

function isoFromEpochMs(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return new Date(value).toISOString().replace(".000Z", "Z");
}

export async function fetchGoldQuote(
  url: string,
  fetchImpl: FetchLike,
  nowIso: string,
  apiKey = "",
): Promise<{ usd: number; asOf: string; filled: boolean }> {
  const headers: Record<string, string> = { Accept: "application/json", "Accept-Encoding": "gzip" };
  const key = apiKey.trim();
  if (key !== "") headers["X-API-Key"] = key;
  const body = await getJson(fetchImpl, url, headers);
  if (typeof body !== "object" || body === null) throw new VendorFailure("network");
  const record = body as {
    usd?: unknown;
    price?: unknown;
    asOf?: unknown;
    filled?: unknown;
    data?: unknown;
    meta?: { as_of?: unknown };
  };
  const direct = positivePrice(record.usd) ?? positivePrice(record.price);
  if (direct != null) {
    return {
      usd: direct,
      asOf: typeof record.asOf === "string" && record.asOf.trim() !== "" ? record.asOf : nowIso,
      filled: record.filled === true,
    };
  }
  if (!Array.isArray(record.data)) throw new VendorFailure("network");
  let row: { p?: unknown; t?: unknown } | null = null;
  for (const item of record.data) {
    if (typeof item !== "object" || item === null) continue;
    const candidate = item as { s?: unknown; p?: unknown; t?: unknown };
    if (typeof candidate.s === "string" && candidate.s.toUpperCase() === "XAUUSD") {
      row = candidate;
      break;
    }
  }
  const usd = row == null ? null : positivePrice(row.p);
  if (row == null || usd == null) throw new VendorFailure("network");
  const metaAsOf = typeof record.meta?.as_of === "string" && record.meta.as_of.trim() !== "" ? record.meta.as_of : null;
  return {
    usd,
    asOf: isoFromEpochMs(row.t) ?? metaAsOf ?? nowIso,
    filled: false,
  };
}

export async function fetchCoinMetricsRange(
  base: string,
  start: string,
  end: string,
  fetchImpl: FetchLike,
  pace: PaceClock,
  now: () => number,
  sleep: (ms: number) => Promise<void>,
): Promise<HistoryRow[]> {
  await paceCoinMetrics(pace, now, sleep);
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  const query = [
    "assets=btc",
    "metrics=PriceUSD%2CCapMVRVCur",
    "frequency=1d",
    `start_time=${start}`,
    `end_time=${end}`,
    "page_size=10000",
  ].join("&");
  const body = await getJson(fetchImpl, `${root}/v4/timeseries/asset-metrics?${query}`);
  const data =
    typeof body === "object" && body !== null && "data" in body
      ? (body as { data?: unknown }).data
      : body;
  if (!Array.isArray(data)) return [];
  const rows: HistoryRow[] = [];
  for (const item of data) {
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

export function rowPrice(row: HistoryRow): number | null {
  const raw = row.PriceUSD;
  const price = typeof raw === "number" ? raw : raw == null ? Number.NaN : Number(raw);
  return price > 0 ? price : null;
}

export function rowForDate(rows: readonly HistoryRow[], date: string): HistoryRow | null {
  for (const row of rows) {
    if (row.time.slice(0, 10) !== date) continue;
    if (rowPrice(row) == null) continue;
    return row;
  }
  return null;
}
