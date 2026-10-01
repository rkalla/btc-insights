import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BANNED_THIS_WEEK } from "../src/copy/thisWeek.ts";
import { trendAt } from "../src/job/powerlaw.ts";
import { buildProjectionDocument } from "../src/job/projection.ts";
import type { DatedPrice } from "../src/job/powerlaw.ts";
import { paintProjection, projectionShell, projectionSvg } from "../src/painter/projection.ts";
import {
  PROJECTION_COPY,
  cycleRatio,
  formatCoins,
  isProjectionDocument,
  matchPhase,
  peakMultiple,
  projectionFromDocuments,
} from "../src/projection/portfolio.ts";
import type { ProjectionReady } from "../src/projection/portfolio.ts";

const BANNED = new RegExp(`\\b(?:${BANNED_THIS_WEEK.join("|")})\\b`, "gi");
const SPOT = 84413;
const SPOT_DATE = "2026-09-25";

function historyPoints(): DatedPrice[] {
  const rows = JSON.parse(readFileSync(new URL("../fixtures/history/btc-daily.json", import.meta.url), "utf8")) as {
    time: string;
    PriceUSD: unknown;
  }[];
  return rows
    .map((row) => ({ date: row.time.slice(0, 10), price: Number(row.PriceUSD) }))
    .filter((point) => point.price > 0);
}

const points = historyPoints();
const document = buildProjectionDocument(points, SPOT_DATE);

function weekday(iso: string): number {
  return new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))).getUTCDay();
}

function sentences(text: string): string[] {
  return text
    .split("\n")
    .flatMap((chunk) => chunk.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "");
}

function wordCount(sentence: string): number {
  const bare = sentence.replace(/[.!?]+$/u, "").trim();
  if (bare === "") return 0;
  return bare.split(/\s+/).length;
}

function openText(model: ProjectionReady): string {
  return [model.leads[0], model.leads[1], model.input, model.stale ?? "", model.caption, ...model.readings].join("\n");
}

test("five finished price cycles are averaged and the open cycle is stored apart", () => {
  assert.deepEqual(
    document.cycles.map((cycle) => [cycle.low, cycle.high, cycle.end]),
    [
      ["2010-07-25", "2011-06-08", "2011-11-18"],
      ["2011-11-18", "2013-04-09", "2013-07-06"],
      ["2013-07-06", "2013-12-04", "2015-01-14"],
      ["2015-01-14", "2017-12-16", "2018-12-15"],
      ["2018-12-15", "2021-11-08", "2022-11-09"],
    ],
  );
  assert.deepEqual(
    document.cycles.map((cycle) => cycle.highRatio),
    [15.16, 4.11, 10.38, 5.55, 3.37],
  );
  assert.equal(document.cyclesUsed, 5);
  assert.equal(document.open?.low, "2022-11-09");
  assert.equal(document.open?.high, "2025-10-06");
  assert.equal(Math.round(document.open?.highPrice ?? 0), 124824);
  assert.equal(document.open?.highRatio, 1.21);
  assert.equal(document.cycles.some((cycle) => cycle.high === "2025-10-06"), false);
  assert.equal(document.schema, 2);
  assert.equal(document.decay.intercept.toFixed(6), "2.781389");
  assert.equal(document.decay.slope.toFixed(12), "-0.000387248093");
});

test("the five-cycle template locks the measured shape", () => {
  assert.equal(document.template.length, 204);
  assert.equal(document.samples, 204);
  assert.equal(document.highIndex, 135);
  assert.equal(document.lowIndex, 0);
  assert.equal(document.template[0]?.toFixed(3), "0.592");
  assert.equal(document.template[135]?.toFixed(3), "4.413");
  assert.equal(document.template[203]?.toFixed(3), "0.616");
  assert.equal(document.genesis, "2009-01-03");
  assert.equal(isProjectionDocument(document), true);
  assert.equal(isProjectionDocument({ ...document, cycles: undefined }), false);
  assert.equal(isProjectionDocument({ ...document, schema: 1 }), false);
  assert.equal(isProjectionDocument({ ...document, decay: undefined }), false);
});

test("peaks above the trend fall toward it and the trough stays put", () => {
  const peak = document.template[document.highIndex] ?? 0;
  assert.equal(peakMultiple(document.decay, "2029-05-04"), 1);
  assert.equal(peakMultiple(document.decay, SPOT_DATE).toFixed(3), "1.316");
  assert.equal(cycleRatio(peak, peak, peakMultiple(document.decay, "2029-05-04")), 1);
  assert.equal(cycleRatio(document.template[0] ?? 0, peak, 1.3), document.template[0]);
  assert.equal(cycleRatio(peak, peak, peakMultiple(document.decay, SPOT_DATE)).toFixed(3), "1.316");
});

test("25 September 2026 matches the last sample for the history close and for spot 84413", () => {
  const close = points.find((point) => point.date === SPOT_DATE);
  assert.equal(close != null, true);
  const historyPhase = matchPhase(document.template, document.highIndex, (close?.price ?? 0) / trendAt(document.fit, SPOT_DATE));
  const spotPhase = matchPhase(document.template, document.highIndex, SPOT / trendAt(document.fit, SPOT_DATE));
  assert.equal(historyPhase, 203);
  assert.equal(spotPhase, 203);
  assert.equal(matchPhase(document.template, document.highIndex, document.template[135] ?? 0), 135);
});

test("one bitcoin and $100 a month locks the 2030 high", () => {
  const model = projectionFromDocuments(document, SPOT, SPOT_DATE, 1, 100, "month", false);
  assert.equal(model.status, "ready");
  if (model.status !== "ready") return;
  assert.equal(model.chart, true);
  assert.equal(model.input, "Starts from 1 Bitcoin and adds $100 every month.");
  assert.equal(model.caption, "Your Bitcoin, on a log scale, through 2046.");
  const high = model.points.find((point) => point.mark === "high");
  assert.equal(high?.date, "2030-07-19");
  assert.equal(Math.round(high?.value ?? 0), 433_968);
  assert.equal(model.readings[1], "In 2030, at the high, about $434k.");
  assert.equal(model.readings[0], "In 2026, at the low, about $84.4k.");
  assert.equal((model.points[0]?.trendValue ?? 0) > (model.points[0]?.value ?? 0), true);
  assert.equal(
    model.points.every((point) => Math.abs(point.trendValue - point.coins * trendAt(document.fit, point.date)) < 0.01),
    true,
  );
  assert.equal(Math.abs((high?.trendValue ?? 0) - (high?.value ?? 0)) < 1, true);
  assert.equal(model.points[0]?.coins, 1);
  assert.equal(model.points[0]?.phase, null);
  const october2 = model.points.find((point) => point.date === "2026-10-02");
  const october9 = model.points.find((point) => point.date === "2026-10-09");
  assert.equal(october2 != null && october9 != null, true);
  assert.equal((october2?.coins ?? 0) > 1, true);
  assert.equal(october9?.coins, october2?.coins);
  const last = model.points[model.points.length - 1];
  assert.equal(last?.date, "2046-09-21");
  assert.equal(weekday(last?.date ?? ""), 5);
  assert.equal(model.readings[model.readings.length - 1], "In 2046, at the end of the 20 years, about $9M.");
  const html = paintProjection(model);
  assert.equal(html.includes("Long-run trend"), true);
  assert.equal(html.includes('stroke="var(--ink-2)"'), true);
  assert.equal(html.includes('stroke="var(--ink)"'), true);
  assert.equal(model.numbers[0], "Today's price is $84,413.");
  assert.equal(model.numbers.some((line) => line.includes("power law")), false);
});

test("a blank buy leaves the coin count unchanged and a blank coin field draws no dollars", () => {
  const held = projectionFromDocuments(document, SPOT, SPOT_DATE, 1.5, null, "week", false);
  assert.equal(held.status, "ready");
  if (held.status !== "ready") return;
  assert.equal(held.input, "Starts from 1.5 Bitcoin. No regular buy is set, so this adds no new Bitcoin.");
  assert.equal(held.points.every((point) => point.coins === 1.5), true);

  const blankAmount = projectionFromDocuments(document, SPOT, SPOT_DATE, 2, null, "month", false);
  assert.equal(blankAmount.status, "ready");
  if (blankAmount.status === "ready") {
    assert.equal(blankAmount.points.every((point) => point.coins === 2), true);
  }
  const zeroAmount = projectionFromDocuments(document, SPOT, SPOT_DATE, 2, 0, "week", false);
  assert.equal(zeroAmount.status, "ready");
  if (zeroAmount.status === "ready") {
    assert.equal(zeroAmount.points.every((point) => point.coins === 2), true);
  }

  const blank = projectionFromDocuments(document, SPOT, SPOT_DATE, null, 100, "month", true);
  assert.deepEqual(blank, {
    status: "blank",
    leads: [PROJECTION_COPY.leadOne, PROJECTION_COPY.leadTwo],
    message: PROJECTION_COPY.blank,
  });
  const blankHtml = paintProjection(blank);
  assert.equal(blankHtml.includes("$"), false);
  assert.equal(blankHtml.includes('href="/settings.html"'), true);
  assert.equal(blankHtml.includes(PROJECTION_COPY.blank), true);

  const none = projectionFromDocuments(document, SPOT, SPOT_DATE, 0, null, null, false);
  assert.equal(none.status, "ready");
  if (none.status !== "ready") return;
  assert.equal(none.chart, false);
  assert.equal(none.input, "This starts from no Bitcoin and adds none.");
  assert.equal(none.points.length, 0);
  assert.equal(projectionSvg(none.points), "");

  const buying = projectionFromDocuments(document, SPOT, SPOT_DATE, 0, 50, "week", false);
  assert.equal(buying.status, "ready");
  if (buying.status !== "ready") return;
  assert.equal(buying.chart, true);
  assert.equal(buying.input, "Starts from no Bitcoin and adds $50 every week.");
  assert.equal((buying.points[2]?.coins ?? 0) > (buying.points[1]?.coins ?? 0), true);
  assert.equal((buying.points[1]?.coins ?? 0) > 0, true);
});

test("open projection text stays inside the voice rules", () => {
  const model = projectionFromDocuments(document, SPOT, SPOT_DATE, 1, 100, "month", true);
  assert.equal(model.status, "ready");
  if (model.status !== "ready") return;
  assert.equal(model.stale, "This price is late, so the projection is using an older price.");
  const open = openText(model);
  assert.deepEqual(open.match(BANNED), null, open);
  assert.equal(open.includes("{"), false);
  assert.equal(open.includes("}"), false);
  assert.equal(open.includes("undefined"), false);
  assert.equal(open.includes("NaN"), false);
  assert.equal(open.includes("null"), false);
  assert.equal(open.toLowerCase().includes("power law"), false);
  for (const sentence of sentences(open)) {
    const count = wordCount(sentence);
    assert.equal(count <= 25, true, `${count}: ${sentence}`);
  }
  assert.equal(formatCoins(1.5), "1.5");
  assert.equal(formatCoins(1), "1");
  assert.equal(formatCoins(0.1), "0.1");
});

test("the projection shell has the tab, the color boot, and only the repository link", () => {
  const shell = projectionShell('<link rel="icon" href="/favicon.ico">');
  assert.equal(shell.includes('aria-current="page">Projection'), true);
  assert.equal(shell.indexOf(">This week</a>") < shell.indexOf(">Evidence</a>"), true);
  assert.equal(shell.indexOf(">Evidence</a>") < shell.indexOf(">Projection</a>"), true);
  assert.equal(shell.includes('href="/projection/"'), true);
  assert.equal(shell.includes("btc-friday.color-mode"), true);
  assert.equal(shell.indexOf("btc-friday.color-mode") < shell.indexOf('href="/assets/site.css"'), true);
  assert.equal(shell.includes("Loading the projection."), true);
  const rest = shell.split("https://github.com/rkalla/btc-insights").join("");
  assert.equal(rest.includes("https://"), false);
  assert.equal(rest.includes("http://"), false);
  assert.equal(shell.toLowerCase().includes("power law"), false);
});
