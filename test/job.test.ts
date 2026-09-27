import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { FridayDocument, LiveSlice } from "../src/contract/types.ts";
import { cycleShare, progressCard } from "../src/job/cycle.ts";
import type { ProgressAnchors } from "../src/job/cycle.ts";
import {
  armedWaitCaveat,
  cashCopy,
  coinCopy,
  coinHold,
  disagreement,
  sameWeekCaveat,
} from "../src/job/copy.ts";
import type { CashFlags } from "../src/job/copy.ts";
import { buildFriday } from "../src/job/friday.ts";
import type { HistoryRow, PublishedRecord } from "../src/job/friday.ts";
import { goldFlag, goldShare } from "../src/job/gold-share.ts";
import { buildLive } from "../src/job/live.ts";
import type { FrozenFriday, LivePrint } from "../src/job/live.ts";
import { bandLower, bandUpper, fitPowerLaw, gapFraction, trendAt } from "../src/job/powerlaw.ts";
import { postureFromFlags } from "../src/job/posture.ts";
import { spellEnds } from "../src/job/spell.ts";
import { highConfidence, wilsonLower } from "../src/job/wilson.ts";
import { officialFeedMatchesPublished, zScore } from "../src/job/zscore.ts";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as unknown;
}

const history = readJson("../fixtures/history/btc-daily.json") as HistoryRow[];
const record = readJson("../fixtures/published-record.json") as PublishedRecord;
const fridayFixture = readJson("../fixtures/friday-2026-09-25.json") as FridayDocument;
const laterFixture = readJson("../fixtures/live-later.json") as LiveSlice;

function flags(over: Partial<CashFlags> = {}): CashFlags {
  return {
    allIn: false,
    build: false,
    standDownPause: false,
    lumpIn: false,
    slowIn: false,
    armedWait: false,
    ...over,
  };
}

function utcWeekday(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function daysApart(left: string, right: string): number {
  return (Date.parse(`${right}T00:00:00Z`) - Date.parse(`${left}T00:00:00Z`)) / 86_400_000;
}

const anchors: ProgressAnchors = record.anchors;

function frozenAt(trend: number): FrozenFriday {
  return {
    officialCloseDate: "2026-09-25",
    trend,
    realizedPrice: 53000,
    realizedAsOf: "2026-09-25",
    anchors,
  };
}

function printAt(over: Partial<LivePrint> & Pick<LivePrint, "spot" | "spotAsOf">): LivePrint {
  return {
    printLabel: "print",
    isOfficialClose: false,
    bitcoin: { usd: over.spot, asOf: over.spotAsOf },
    gold: null,
    now: over.spotAsOf,
    missingClose: false,
    ...over,
  };
}

test("gold share flags the open arm and ignores a falling or flat gold price", () => {
  assert.equal(goldShare.length, 4);
  const share = goldShare(116149, 84948, 3686, 4080);
  assert.equal(Math.abs(share - 0.245) <= 0.002, true);
  assert.equal(goldFlag(share), true);
  assert.equal(goldShare(100, 80, 200, 180), 0);
  assert.equal(goldFlag(goldShare(100, 80, 200, 180)), false);
  assert.equal(goldShare(100, 80, 200, 200), 0);
  assert.equal(goldFlag(goldShare(100, 80, 200, 200)), false);
  assert.equal(goldShare(100, 100, 50, 50), 0);
});

test("Wilson 90% lower bounds and the high-confidence cut", () => {
  const pairs: [number, number, number][] = [
    [4, 4, 0.597],
    [6, 8, 0.46],
    [11, 16, 0.482],
    [8, 8, 0.747],
    [10, 10, 0.787],
    [11, 11, 0.803],
    [19, 20, 0.804],
    [16, 16, 0.855],
  ];
  for (const [hits, n, expected] of pairs) {
    assert.equal(Math.abs(wilsonLower(hits, n) - expected) <= 0.002, true, `${hits}/${n}`);
  }
  assert.equal(highConfidence(wilsonLower(4, 4)), false);
  assert.equal(highConfidence(wilsonLower(11, 11)), true);
});

test("posture order lets All in win over Build and a stand-down pause", () => {
  assert.equal(postureFromFlags(true, true, true, true, true), "ALL_IN");
  assert.equal(postureFromFlags(true, true, false, false, false), "ALL_IN");
  assert.equal(postureFromFlags(true, false, true, false, false), "ALL_IN");
  assert.equal(postureFromFlags(false, true, true, true, true), "BUILD");
  assert.equal(postureFromFlags(false, false, true, true, true), "STAND_DOWN");
  assert.equal(postureFromFlags(false, false, false, true, true), "LUMP_IN");
  assert.equal(postureFromFlags(false, false, false, false, true), "SLOW_IN");
  assert.equal(postureFromFlags(false, false, false, false, false), "STAY");
});

test("a cheap spell ends on the fifth Friday, and the 2022 run of four does not", () => {
  const run = ["2022-07-22", "2022-07-29", "2022-08-05", "2022-08-12"];
  assert.equal(run.length, 4);
  for (let index = 0; index < run.length; index += 1) {
    const date = run[index] ?? "";
    assert.equal(utcWeekday(date), 5, date);
    if (index > 0) assert.equal(daysApart(run[index - 1] ?? "", date), 7);
  }
  assert.equal(spellEnds(4), false);
  assert.equal(spellEnds(run.length), false);
  assert.equal(spellEnds(5), true);
});

test("published cycle shares round from the recorded gains", () => {
  assert.equal(Math.round(100 * cycleShare(6689, 11082)), 60);
  assert.equal(Math.round(100 * cycleShare(1094, 2021)), 54);
  assert.equal(Math.round(100 * cycleShare(496, 2021)), 25);
  assert.equal(Math.round(100 * cycleShare(355, 692)), 51);
  const finished = record.cycles.finished.flatMap((card) => card.rows.map((row) => row.sharePct));
  assert.deepEqual(finished, [60, 71, 34, 54, 25, 84, 42, 51, 93, 44]);
});

test("z-score uses the sample deviation of 52 ratios, and one moved Friday does not match", () => {
  const ratios = Array.from({ length: 52 }, (_, index) => index + 1);
  const n = ratios.length;
  const mean = ratios.reduce((sum, value) => sum + value, 0) / n;
  let square = 0;
  for (const value of ratios) {
    const delta = value - mean;
    square += delta * delta;
  }
  const sampleStdev = Math.sqrt(square / (n - 1));
  const current = ratios[n - 1] ?? 0;
  assert.equal(zScore(ratios), (100 * (current - mean)) / sampleStdev);
  const published = record.zeroCrossFridays;
  assert.equal(officialFeedMatchesPublished([...published].reverse(), published), true);
  const moved = published.map((date, index) => (index === 0 ? "2015-07-31" : date));
  assert.equal(officialFeedMatchesPublished(moved, published), false);
});

test("a synthetic three-point series locks the power-law slope", () => {
  const epoch = Date.UTC(2009, 0, 3);
  const iso = (days: number): string => new Date(epoch + days * 86_400_000).toISOString().slice(0, 10);
  const a = -1.25;
  const b = 2.5;
  const days = [1000, 2500, 4000];
  const points = days.map((day) => ({
    date: iso(day),
    price: 10 ** (a + b * Math.log10(day)),
  }));
  const through = points[2]?.date ?? "";
  const fit = fitPowerLaw(points, through);
  assert.equal(Math.abs(fit.a - a) < 1e-9, true);
  assert.equal(Math.abs(fit.b - b) < 1e-9, true);
  const trend = trendAt(fit, through);
  assert.equal(Math.abs(gapFraction(points[2]?.price ?? 0, trend)) < 1e-9, true);
  assert.equal(bandLower(trend), trend * 0.8);
  assert.equal(bandUpper(trend), trend * 1.55);
  const spoiled = [
    ...points,
    { date: iso(8000), price: 10 ** (a + (b + 3) * Math.log10(8000)) },
  ];
  const held = fitPowerLaw(spoiled, through);
  assert.equal(Math.abs(held.b - b) < 1e-9, true);
});

test("the 2026-09-25 Coin Metrics fit stays inside the published gap band", () => {
  const points = history.flatMap((row) => {
    const date = row.time.slice(0, 10);
    const price = typeof row.PriceUSD === "number" ? row.PriceUSD : Number(row.PriceUSD);
    return price > 0 ? [{ date, price }] : [];
  });
  const through = "2026-09-25";
  const fit = fitPowerLaw(points, through);
  const price = points.find((point) => point.date === through)?.price ?? 0;
  const trend = trendAt(fit, through);
  const gap = gapFraction(price, trend);
  assert.equal(gap >= -0.46 && gap <= -0.29, true, `gap ${gap}`);
  assert.equal(Math.round(trend / 1000) * 1000, 141000);
  assert.equal(price === 84413, false);
});

test("cash copy matches the wireframe table and keeps the All-in floor in words", () => {
  const allIn = cashCopy(flags({ allIn: true }));
  assert.equal(allIn.word, "All in");
  assert.equal(allIn.tone, "buy");
  assert.equal(allIn.posture, "ALL_IN");
  assert.deepEqual(allIn.sentences, [
    "Buy now, or by the Friday 2 Oct 2026 close.",
    "After that close, the call is whatever that Friday says.",
    "Standing contribution continues.",
  ]);
  assert.equal(allIn.sentences.join(" ").includes("$"), false);
  assert.deepEqual(allIn.recordRows, fridayFixture.cash.recordRows);
  assert.equal(allIn.highConfidence, false);
  assert.equal(JSON.stringify(allIn).includes("59.7%"), false);
  assert.equal(JSON.stringify(allIn).includes("about 60%"), true);
  assert.deepEqual(allIn.window, fridayFixture.cash.window);

  const underCost = cashCopy(flags({ allIn: true, build: true }));
  assert.deepEqual(underCost.sentences, [
    ...allIn.sentences,
    "The build slice also runs.",
  ]);
  assert.deepEqual(underCost.recordRows, allIn.recordRows);

  const duringPause = cashCopy(flags({ allIn: true, standDownPause: true }));
  assert.deepEqual(duringPause.sentences, allIn.sentences);
  assert.deepEqual(duringPause.recordRows, allIn.recordRows);
  assert.equal(
    disagreement("ALL_IN", true),
    "Sell roll is also in its pause. All in still wins. The week is not cut in half.",
  );
  assert.equal(disagreement("ALL_IN", false), null);
  assert.equal(disagreement("BUILD", true), null);
  assert.equal(disagreement("STAND_DOWN", true), null);

  const build = cashCopy(flags({ build: true }));
  assert.equal(build.word, "Build");
  assert.equal(build.tone, "buy");
  assert.deepEqual(build.sentences, [
    "One tranche, sliced this Friday, while under cost.",
    "A stand-down pause ends. Standing contribution resumes.",
  ]);
  assert.deepEqual(build.recordRows, [
    { key: "RECORD", text: "79% of 91 weeks. 4 spells." },
    { key: "STATUS", text: "Schedule untested." },
  ]);

  const armedBuild = cashCopy(flags({ build: true, armedWait: true }));
  assert.deepEqual(armedBuild.sentences, [
    ...build.sentences,
    "Cash waiting on the cross stays put.",
  ]);
  assert.deepEqual(armedBuild.recordRows, [
    ...build.recordRows,
    { key: "STATUS", text: "Armed wait untested." },
  ]);

  const standDown = cashCopy(flags({ standDownPause: true }));
  assert.equal(standDown.word, "Stand down");
  assert.equal(standDown.tone, "sell");
  assert.deepEqual(standDown.sentences, [
    "Pause new money for up to 12 months, or until All in or Build.",
    "At 12 months the cash follows the gap switch.",
  ]);
  assert.deepEqual(standDown.recordRows, [
    { key: "RECORD", text: "7 of 8. Floor about 59%. About six episodes." },
    { key: "MISSES", text: "June 2013 lost. Missed 2019\u201320 and 2025\u201326." },
  ]);
  assert.equal(standDown.recordRows.some((row) => row.key === "STATUS"), false);
  assert.equal(JSON.stringify(standDown).includes("12-month pause untested"), false);

  const lump = cashCopy(flags({ lumpIn: true }));
  assert.equal(lump.word, "Lump in");
  assert.equal(lump.tone, "buy");
  assert.deepEqual(lump.sentences, [
    "Cash available goes in on the Friday it is available.",
    "Standing contribution continues.",
  ]);
  assert.deepEqual(lump.recordRows, [
    { key: "RECORD", text: "6 of 6 finished regimes. Floor 69%." },
    { key: "STATUS", text: "One regime open since November 2025." },
  ]);

  const slow = cashCopy(flags({ slowIn: true }));
  assert.equal(slow.word, "Slow in");
  assert.equal(slow.tone, "buy");
  assert.deepEqual(slow.sentences, [
    "A new lump sum spreads over 12 months.",
    "Standing contribution continues.",
  ]);
  assert.deepEqual(slow.recordRows, [
    { key: "RECORD", text: "2 of 3 regimes. Floor 25%." },
    { key: "STATUS", text: "Weakest record on the page." },
  ]);

  const stay = cashCopy(flags());
  assert.equal(stay.word, "Stay the course");
  assert.equal(stay.tone, "neutral");
  assert.deepEqual(stay.sentences, ["Standing contribution only."]);
  assert.deepEqual(stay.recordRows, [
    { key: "RECORD", text: "No event record." },
    { key: "STATUS", text: "Between the gap lines, a new lump sum has no measured edge." },
  ]);

  const armedStay = cashCopy(flags({ armedWait: true }));
  assert.equal(armedStay.word, "Stay the course");
  assert.equal(armedStay.tone, "neutral");
  assert.deepEqual(armedStay.sentences, ["Standing contribution continues. Extra cash waits."]);
  assert.deepEqual(armedStay.recordRows, [
    { key: "RECORD", text: "No event record." },
    { key: "STATUS", text: "Armed wait untested." },
  ]);

  assert.deepEqual(coinHold().sentences, ["Coins already held stay held."]);
  assert.equal(sameWeekCaveat(true, true), "This week is not a higher probability.");
  assert.equal(sameWeekCaveat(true, false), null);
  assert.equal(armedWaitCaveat("BUILD", true), "Extra cash waits for the z-score to cross above zero.");
  assert.equal(armedWaitCaveat("STAY", true), "Waiting for the cross. The cross has not fired.");
  assert.equal(armedWaitCaveat("STAY", false), null);

  const exitCash = cashCopy(flags({ exit: true, allIn: true }));
  assert.equal(exitCash.posture, "NO_NEW_BUY");
  assert.equal(exitCash.word, "No new buy");
  assert.deepEqual(exitCash.sentences, ["No new buy."]);
  assert.deepEqual(exitCash.recordRows, [{ key: "RECORD", text: "No floor." }]);
  const trim = coinCopy({ trim: true, exit: false, standDownPause: true });
  assert.equal(trim.word, "Trim");
  assert.equal(trim.sentences[0], "Sell from the ceiling down to the target, highest-cost lots first.");
  assert.equal(trim.taxLine, "A sale can create a tax bill. Rate not computed.");
  assert.equal(trim.sentences.includes("Sped up: finish by the end of the pause."), true);
  const exitCoins = coinCopy({
    trim: true,
    exit: true,
    standDownPause: false,
    declarationDateLabel: "18 Sep 2026",
  });
  assert.equal(exitCoins.word, "Exit");
  assert.equal(exitCoins.tone, "sell");
  assert.deepEqual(exitCoins.sentences, ["Sell all.", "No floor."]);
  assert.equal(exitCoins.declarationDateLabel, "18 Sep 2026");
});

test("buildFriday keeps published fires when a zero-cross date moves", () => {
  const friday = buildFriday(history, record);
  const buyDates = record.buys.map((buy) => buy.date);
  const sellDates = record.sells.map((sell) => sell.date);
  assert.deepEqual(
    friday.chart.fires.filter((fire) => fire.type === "buy").map((fire) => [fire.date, fire.price, fire.status, fire.resultLabel]),
    record.buys.map((buy) => [buy.date, buy.price, buy.status, buy.resultLabel]),
  );
  assert.deepEqual(
    friday.chart.fires.filter((fire) => fire.type === "sell").map((fire) => [fire.date, fire.resultLabel]),
    record.sells.map((sell) => [sell.date, sell.resultLabel]),
  );
  const banned = ["2013-04", "2017-12", "2019-07", "2021-03"];
  for (const fire of friday.chart.fires) {
    assert.equal(utcWeekday(fire.date), 5, fire.date);
    for (const prefix of banned) assert.equal(fire.date.startsWith(prefix), false, fire.date);
  }
  const moved = record.zeroCrossFridays.map((date, index) => (index === 0 ? "2015-07-31" : date));
  const kept = buildFriday(history, { ...record, feedCrossFridays: moved });
  assert.deepEqual(
    kept.chart.fires.filter((fire) => fire.type === "buy").map((fire) => fire.date),
    buyDates,
  );
  assert.deepEqual(
    kept.chart.fires.filter((fire) => fire.type === "sell").map((fire) => fire.date),
    sellDates,
  );
  const matched = buildFriday(history, {
    ...record,
    feedCrossFridays: [...record.zeroCrossFridays].reverse(),
  });
  assert.deepEqual(
    matched.chart.fires.filter((fire) => fire.type === "buy").map((fire) => fire.date),
    buyDates,
  );

  assert.equal(friday.chart.weekly[0]?.date, "2013-01-04");
  assert.equal(friday.chart.weekly[friday.chart.weekly.length - 1]?.date, "2026-09-25");
  assert.equal(friday.chart.weekly.some((point) => point.date === "2012-12-28"), false);
  for (let index = 1; index < friday.chart.weekly.length; index += 1) {
    const previous = friday.chart.weekly[index - 1]?.date ?? "";
    const date = friday.chart.weekly[index]?.date ?? "";
    assert.equal(daysApart(previous, date), 7, date);
  }
  const close = friday.chart.weekly.find((point) => point.date === "2026-09-25")?.close ?? 0;
  const row = history.find((item) => item.time.slice(0, 10) === "2026-09-25");
  assert.equal(close, Number(row?.PriceUSD));
  assert.equal(close === 84413, false);

  const trend = friday.chart.trend;
  assert.equal(trend[0]?.date, friday.chart.weekly[0]?.date);
  assert.equal(trend[trend.length - 1]?.date, "2026-09-25");
  for (let index = 1; index < trend.length; index += 1) {
    const previous = trend[index - 1]?.date ?? "";
    const date = trend[index]?.date ?? "";
    const span = daysApart(previous, date);
    assert.equal(span > 0 && span <= 28, true, date);
  }
  const end = trend.find((point) => point.date === "2026-09-25");
  assert.equal(end == null, false);
  const endTrend = end?.value ?? 0;
  assert.equal(gapFraction(close, endTrend) >= -0.46 && gapFraction(close, endTrend) <= -0.29, true);
  assert.equal(Math.round(endTrend / 1000) * 1000, 141000);
  for (const point of trend) {
    assert.equal(friday.chart.lower.find((row) => row.date === point.date)?.value, point.value * 0.8);
    assert.equal(friday.chart.upper.find((row) => row.date === point.date)?.value, point.value * 1.55);
  }
  const tail = friday.chart.weekly.slice(-200);
  const mean = tail.reduce((sum, point) => sum + point.close, 0) / tail.length;
  assert.deepEqual(friday.chart.sma200w, [{ date: "2026-09-25", value: mean }]);
  const finishedShares = friday.cycles.cards
    .filter((card) => card.isProgress === false)
    .flatMap((card) => card.rows.map((row) => row.sharePct));
  assert.deepEqual(finishedShares, [60, 71, 34, 54, 25, 84, 42, 51, 93, 44]);
  assert.equal(friday.cash.word, "All in");
  assert.deepEqual(friday.coinsHold.sentences, ["Coins already held stay held."]);
});

test("history checksum matches SHA256SUMS", () => {
  const text = readFileSync(new URL("../fixtures/history/btc-daily.json", import.meta.url), "utf8");
  const hash = createHash("sha256").update(text).digest("hex");
  const sums = readFileSync(new URL("../fixtures/history/SHA256SUMS", import.meta.url), "utf8");
  assert.equal(sums.split(/\s+/)[0], hash);
});

test("buildLive moves the print and does not emit a cash word", () => {
  const trend = 141000;
  const pinned = buildLive(
    frozenAt(trend),
    printAt({
      spot: 84413,
      spotAsOf: "2026-09-25T00:00:00Z",
      printLabel: "25 Sep 2026 daily close",
      isOfficialClose: true,
      now: "2026-09-25T12:00:00Z",
    }),
  );
  assert.equal(Object.hasOwn(pinned, "cash"), false);
  assert.equal(JSON.stringify(pinned).includes("All in"), false);
  assert.equal(JSON.stringify(pinned).includes("ALL_IN"), false);
  assert.equal(pinned.officialCloseDate, "2026-09-25");
  assert.equal(pinned.gapPct, 84413 / trend - 1);
  assert.deepEqual(pinned.chartTip, { date: "2026-09-25", value: 84413 });
  assert.equal(pinned.developing, null);
  assert.equal(pinned.missingClose, false);
  const expected = fridayFixture.cycles.cards.find((card) => card.isProgress);
  assert.deepEqual(pinned.progress, expected);
  assert.equal(pinned.progress.rows[0]?.detail.includes("+208%"), true);
  assert.equal(pinned.progress.rows[0]?.detail.includes("+207%"), false);
  assert.equal(pinned.progress.rows[0]?.sharePct, 48);

  const later = buildLive(
    frozenAt(trend),
    printAt({
      spot: 90000,
      spotAsOf: "2026-09-26T12:00:00Z",
      printLabel: "Sat 26 Sep 2026 print",
      now: "2026-09-26T12:00:00Z",
    }),
  );
  assert.equal(later.gapPct, 90000 / trend - 1);
  assert.deepEqual(later.chartTip, { date: "2026-09-26", value: 90000 });
  assert.deepEqual(later.progress, laterFixture.progress);
  assert.equal(Object.hasOwn(later, "cash"), false);
  const rise = 90000 / 15758 - 1;
  const share = (entry: number): number => Math.round(((90000 / entry - 1) / rise) * 100);
  assert.equal(later.progress.rows.find((row) => row.name === "Build")?.sharePct, share(16806));
  assert.equal(later.progress.rows.find((row) => row.name === "Lump in")?.sharePct, share(48026));

  const both = buildLive(
    frozenAt(trend),
    printAt({
      spot: 84413,
      spotAsOf: "2026-09-25T00:00:00Z",
      now: "2026-09-25T12:00:00Z",
      gold: { usd: 4080, asOf: "2026-09-25T00:00:00Z", filled: false },
    }),
  );
  assert.equal(both.developing?.endsWith("Not an official fire."), true);
  assert.equal(JSON.stringify(both).includes("All in"), false);
  assert.deepEqual(both.gold, { usd: 4080, asOf: "2026-09-25T00:00:00Z", filled: false });

  const staleGold = buildLive(
    frozenAt(trend),
    printAt({
      spot: 84413,
      spotAsOf: "2026-09-25T00:00:00Z",
      now: "2026-09-25T12:00:00Z",
      gold: { usd: 4000, asOf: "2026-09-14T00:00:00Z", filled: true },
    }),
  );
  assert.equal(staleGold.gold, null);
  assert.equal(staleGold.developing, null);
  const filledWithinTen = buildLive(
    frozenAt(trend),
    printAt({
      spot: 84413,
      spotAsOf: "2026-09-25T00:00:00Z",
      now: "2026-09-25T12:00:00Z",
      bitcoin: null,
      gold: { usd: 4000, asOf: "2026-09-15T00:00:00Z", filled: true },
    }),
  );
  assert.equal(filledWithinTen.developing, null);
  assert.deepEqual(filledWithinTen.gold, { usd: 4000, asOf: "2026-09-15T00:00:00Z", filled: true });

  const fresh = buildLive(
    frozenAt(trend),
    printAt({
      spot: 84413,
      spotAsOf: "2026-09-25T00:00:00Z",
      now: "2026-09-26T02:00:00Z",
    }),
  );
  assert.equal(fresh.stale, false);
  const stale = buildLive(
    frozenAt(trend),
    printAt({
      spot: 84413,
      spotAsOf: "2026-09-25T00:00:00Z",
      now: "2026-09-26T02:00:01Z",
    }),
  );
  assert.equal(stale.stale, true);
  const missing = buildLive(
    frozenAt(trend),
    printAt({
      spot: 84413,
      spotAsOf: "2026-09-25T00:00:00Z",
      now: "2026-09-25T12:00:00Z",
      missingClose: true,
    }),
  );
  assert.equal(missing.missingClose, true);
  assert.equal(progressCard(84413, "2026-09-26", anchors).rows[0]?.detail.includes("+208%"), true);
});
