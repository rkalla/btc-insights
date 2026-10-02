import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { PROJECTION_PUBLIC } from "../src/projection/publish.ts";
import { readAccessLogs, rollupAccessLog, type VisitorsReport } from "../src/visitors/log.ts";
import {
  VISITORS_POLL_MS,
  nextVisitorsView,
  reduceVisitorsPoll,
  visitorsShell,
} from "../src/visitors/page.ts";

const NOW = new Date("2026-10-01T22:00:00Z");
const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function line(partial: {
  time?: string;
  method?: string;
  path?: string;
  status?: number;
  ua?: string;
  xff?: string;
  host?: string;
}): string {
  const time = partial.time ?? "01/Oct/2026:12:00:00 +0000";
  const method = partial.method ?? "GET";
  const path = partial.path ?? "/";
  const status = partial.status ?? 200;
  const ua = partial.ua ?? CHROME;
  const tail =
    partial.xff === undefined && partial.host === undefined
      ? ""
      : ` "${partial.xff ?? "-"}" "${partial.host ?? "btcfriday.app"}"`;
  return `127.0.0.1 - - [${time}] "${method} ${path} HTTP/1.1" ${status} 1000 "-" "${ua}"${tail}`;
}

test("a browser page view with no forwarded address counts as a person and leaves uniques unknown", () => {
  const report = rollupAccessLog(line({}) + "\n", NOW);
  assert.deepEqual(report.days, [
    { date: "2026-10-01", people: 1, uniques: null, bots: 0, scanners: 0 },
  ]);
});

test("unique addresses use the last forwarded hop and never appear in the report", () => {
  const text = [
    line({ xff: "198.51.100.9, 203.0.113.10" }),
    line({ xff: "198.51.100.9, 203.0.113.10", path: "/evidence/" }),
    line({ xff: "203.0.113.10, 203.0.113.20", path: "/settings.html" }),
    line({ xff: "127.0.0.1" }),
  ].join("\n");
  const report = rollupAccessLog(text, NOW);
  const day = report.days.find((item) => item.date === "2026-10-01");
  assert.equal(day?.people, 4);
  assert.equal(day?.uniques, 2);
  const encoded = JSON.stringify(report);
  assert.equal(encoded.includes("203.0.113"), false);
  assert.equal(encoded.includes("198.51.100"), false);
});

test("assets, polls, and a failed page load are not visits", () => {
  const text = [
    line({ path: "/assets/this-week.js" }),
    line({ path: "/data/live.json" }),
    line({ path: "/data/friday.json" }),
    line({ path: "/fonts/geist-latin-400-normal.woff2" }),
    line({ status: 401 }),
    line({ status: 404 }),
    line({ method: "POST" }),
  ].join("\n");
  const report = rollupAccessLog(text, NOW);
  assert.deepEqual(report.days, [
    { date: "2026-10-01", people: 0, uniques: 0, bots: 0, scanners: 0 },
  ]);
});

test("a conditional page load counts, and a bot page load is not a person", () => {
  const text = [
    line({ status: 304, path: "/evidence/" }),
    line({ ua: "curl/8.18.0" }),
    line({ ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36" }),
    line({ ua: "btc-friday-check", path: "/evidence/" }),
    line({ ua: "CoinCreatorScanner/1.0 (new-zones node)" }),
  ].join("\n");
  const report = rollupAccessLog(text, NOW);
  const day = report.days[0];
  assert.equal(day?.people, 1);
  assert.equal(day?.bots, 4);
  assert.equal(day?.scanners, 0);
});

test("probe paths and a url user-agent count as scanners even when the agent looks like a browser", () => {
  const text = [
    line({ path: "/wp-login.php", status: 404 }),
    line({ path: "/.env", status: 403 }),
    line({ path: "/visitors/", ua: "http://btcfriday.app/wp-admin/install.php?step=1", status: 401 }),
  ].join("\n");
  const report = rollupAccessLog(text, NOW);
  const day = report.days[0];
  assert.equal(day?.scanners, 3);
  assert.equal(day?.people, 0);
  assert.equal(day?.bots, 0);
});

test("quiet days between the first line and now stay in the series", () => {
  const report = rollupAccessLog(line({ time: "29/Sep/2026:08:00:00 +0000" }) + "\n", NOW);
  assert.deepEqual(
    report.days.map((day) => day.date),
    ["2026-09-29", "2026-09-30", "2026-10-01"],
  );
  assert.equal(report.days[1]?.people, 0);
  assert.equal(report.days[1]?.uniques, 0);
  assert.equal(report.days[0]?.uniques, null);
});

test("readAccessLogs joins the plain log and the compressed rotations", () => {
  const dir = mkdtempSync(join(tmpdir(), "visitors-logs-"));
  writeFileSync(join(dir, "access.log"), line({ path: "/evidence/" }) + "\n");
  writeFileSync(join(dir, "access.log.1"), line({ time: "30/Sep/2026:08:00:00 +0000" }) + "\n");
  writeFileSync(join(dir, "access.log.2.gz"), gzipSync(line({ time: "29/Sep/2026:08:00:00 +0000", path: "/settings.html" }) + "\n"));
  writeFileSync(join(dir, "error.log"), "ignore me\n");
  const report = rollupAccessLog(readAccessLogs(dir), NOW);
  assert.deepEqual(
    report.days.map((day) => day.people),
    [1, 1, 1],
  );
});

const SAMPLE: VisitorsReport = {
  asOf: "2026-10-01T22:00:00.000Z",
  days: [
    { date: "2026-09-30", people: 0, uniques: 0, bots: 2, scanners: 1 },
    { date: "2026-10-01", people: 4, uniques: null, bots: 1, scanners: 3 },
  ],
};

test("the visitors shell is a private page with the shared header and no Visitors tab", () => {
  const html = visitorsShell('<link rel="icon" href="/favicon.ico">');
  assert.equal(html.includes("<title>Visitors · BTC Friday</title>"), true);
  assert.equal(html.includes("data-color-mode"), true);
  assert.equal(html.includes('href="/assets/site.css"'), true);
  assert.equal(html.includes('src="/assets/visitors.js"'), true);
  assert.equal(html.includes(">Visitors</a>"), false);
  assert.equal(html.includes('aria-current="page"'), false);
  assert.equal(html.includes(">This week</a>"), true);
  assert.equal(html.includes(">Evidence</a>"), true);
  assert.equal(html.includes('href="/projection/">Projection</a>'), PROJECTION_PUBLIC);
});

test("the chart and table show the three daily counts and an unrecorded unique", () => {
  const html = nextVisitorsView("", { ok: true, report: SAMPLE });
  assert.equal(html.includes("<h1>Visitors</h1>"), true);
  assert.equal(html.includes("People"), true);
  assert.equal(html.includes("Bots"), true);
  assert.equal(html.includes("Scanners"), true);
  assert.equal(html.includes("Not recorded"), true);
  assert.equal(html.includes("30 Sep"), true);
  assert.equal(html.includes("1 Oct"), true);
  assert.equal(html.includes("Updated 1 Oct 2026, 22:00 UTC"), true);
  const people = /class="bar bar-people" data-date="2026-10-01" height="(\d+)"/.exec(html);
  const bots = /class="bar bar-bots" data-date="2026-10-01" height="(\d+)"/.exec(html);
  const quiet = /class="bar bar-people" data-date="2026-09-30" height="(\d+)"/.exec(html);
  assert.equal(people != null && bots != null && quiet != null, true);
  assert.equal(Number(people?.[1]) > Number(bots?.[1]), true);
  assert.equal(quiet?.[1], "0");
});

test("a failed refresh keeps the chart that is already on the page", () => {
  const shown = nextVisitorsView("", { ok: true, report: SAMPLE });
  assert.equal(nextVisitorsView(shown, { ok: false }), shown);
  const fresh = nextVisitorsView("", { ok: false });
  assert.equal(fresh.includes("not available"), true);
  assert.equal(fresh.includes("<svg"), false);
});

test("an open tab reloads the counts once a minute", () => {
  assert.equal(VISITORS_POLL_MS, 60_000);
  const opened = reduceVisitorsPoll(
    { visible: false, timerArmed: false },
    { type: "visibility", visible: true },
  );
  assert.deepEqual(opened.commands, [
    { type: "fetch" },
    { type: "schedule", ms: 60_000 },
  ]);
  const tick = reduceVisitorsPoll(opened.state, { type: "timer" });
  assert.deepEqual(tick.commands, [
    { type: "fetch" },
    { type: "schedule", ms: 60_000 },
  ]);
  const hidden = reduceVisitorsPoll(tick.state, { type: "visibility", visible: false });
  assert.deepEqual(hidden.commands, [{ type: "clear" }]);
  assert.equal(hidden.state.timerArmed, false);
});
