import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

export type VisitorDay = {
  date: string;
  people: number;
  uniques: number | null;
  bots: number;
  scanners: number;
};

export type VisitorsReport = {
  asOf: string;
  days: VisitorDay[];
};

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const PAGES = new Set([
  "/",
  "/index.html",
  "/evidence/",
  "/evidence/index.html",
  "/settings.html",
  "/this-week/",
  "/this-week/index.html",
  "/visitors/",
  "/visitors/index.html",
]);

const LINE = /^(\S+) \S+ \S+ \[([^\]]+)\] "([A-Z]+) (\S+) [^"]*" (\d+) \S+ "[^"]*" "([^"]*)"(?: "([^"]*)" "[^"]*")?$/;
const STAMP = /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/;
const SCANNER_PATH = /\/(?:wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php|phpmyadmin|cgi-bin|boaform|vendor\/phpunit|admin\.php|setup\.php|phpinfo)|\/\.(?:env|git|aws)(?:$|\/)/i;
const BOT_UA = /bot|spider|crawler|curl\/|wget|python-requests|go-http-client|headless|scanner|coincreator|domainmonitor|semrush|ahrefs|bytespider|gptbot|claudebot|bingbot|googlebot|duckduck|yandex|baidu|applebot|btc-friday-check|scrapy|httpx|libwww|okhttp|^java\//i;

type Bucket = {
  people: number;
  bots: number;
  scanners: number;
  addresses: Set<string>;
};

function dayKey(time: Date): string {
  return time.toISOString().slice(0, 10);
}

function stampToUtc(stamp: string): Date | null {
  const match = STAMP.exec(stamp);
  if (match == null) return null;
  const month = MONTHS[match[2] ?? ""];
  if (month === undefined) return null;
  const sign = match[7] === "-" ? -1 : 1;
  const offsetMin = sign * ((Number(match[8]) * 60) + Number(match[9]));
  const utc = Date.UTC(
    Number(match[3]),
    month,
    Number(match[1]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  ) - (offsetMin * 60_000);
  return new Date(utc);
}

function isPublicAddress(value: string): boolean {
  if (value.includes(":")) {
    const lower = value.toLowerCase();
    if (lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return false;
    return true;
  }
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((part) => Number(part));
  if (nums.some((num) => !Number.isInteger(num) || num < 0 || num > 255)) return false;
  const [a, b] = nums;
  if (a === undefined || b === undefined) return false;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  return true;
}

function clientAddress(xff: string | undefined): string | null {
  if (xff == null || xff === "" || xff === "-") return null;
  const hops = xff.split(",").map((hop) => hop.trim()).filter((hop) => hop !== "");
  const last = hops[hops.length - 1];
  if (last == null || !isPublicAddress(last)) return null;
  return last;
}

function kindOf(path: string, ua: string): "person" | "bot" | "scanner" | "other" {
  if (SCANNER_PATH.test(path) || /^https?:\/\//i.test(ua)) return "scanner";
  if (ua === "" || ua === "-" || BOT_UA.test(ua)) return "bot";
  if (ua.includes("Mozilla")) return "person";
  return "other";
}

function emptyBucket(): Bucket {
  return { people: 0, bots: 0, scanners: 0, addresses: new Set() };
}

export function rollupAccessLog(text: string, now: Date): VisitorsReport {
  const buckets = new Map<string, Bucket>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    const match = LINE.exec(line);
    if (match == null) continue;
    const when = stampToUtc(match[2] ?? "");
    if (when == null) continue;
    const method = match[3] ?? "";
    const path = (match[4] ?? "").split("?", 1)[0] ?? "";
    const status = Number(match[5]);
    const ua = match[6] ?? "";
    const address = clientAddress(match[7]);
    const kind = kindOf(path, ua);
    const date = dayKey(when);
    const bucket = buckets.get(date) ?? emptyBucket();
    buckets.set(date, bucket);
    if (kind === "scanner") {
      bucket.scanners += 1;
      continue;
    }
    const pageVisit = (method === "GET" || method === "HEAD") && PAGES.has(path) && (status === 200 || status === 304);
    if (!pageVisit) continue;
    if (kind === "person") {
      bucket.people += 1;
      if (address != null) bucket.addresses.add(address);
    } else if (kind === "bot") {
      bucket.bots += 1;
    }
  }

  const days: VisitorDay[] = [];
  if (buckets.size > 0) {
    const start = [...buckets.keys()].sort()[0];
    const end = dayKey(now);
    if (start != null) {
      const cursor = new Date(`${start}T00:00:00Z`);
      const last = new Date(`${end}T00:00:00Z`);
      while (cursor.getTime() <= last.getTime()) {
        const date = dayKey(cursor);
        const bucket = buckets.get(date) ?? emptyBucket();
        days.push({
          date,
          people: bucket.people,
          uniques: bucket.people === 0 ? 0 : (bucket.addresses.size === 0 ? null : bucket.addresses.size),
          bots: bucket.bots,
          scanners: bucket.scanners,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
  }

  return { asOf: now.toISOString(), days };
}

function accessNames(names: string[]): string[] {
  return names.filter((name) => name === "access.log" || name === "access.log.1" || /^access\.log\.\d+\.gz$/.test(name)).sort();
}

export function readAccessLogs(dir: string): string {
  const chunks: string[] = [];
  for (const name of accessNames(readdirSync(dir))) {
    const bytes = readFileSync(join(dir, name));
    chunks.push(name.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : bytes.toString("utf8"));
  }
  return chunks.join("");
}
