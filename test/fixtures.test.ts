import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import type { FridayDocument, HolderSettings, LiveSlice } from "../src/contract/types.ts";

const fixtureNames = [
  "friday-2026-09-25.json",
  "live-2026-09-25.json",
  "live-later.json",
  "published-record.json",
  "settings-blank.json",
  "settings-sample.json",
];

function readFixture(name: string): { text: string; value: unknown } {
  const text = readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
  return { text, value: JSON.parse(text) as unknown };
}

function utcWeekday(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

test("reads every fixture", () => {
  const names = readdirSync(new URL("../fixtures/", import.meta.url))
    .filter((name) => name.endsWith(".json"))
    .sort();
  assert.deepEqual(names, fixtureNames);
  for (const name of names) {
    const parsed = readFixture(name).value;
    assert.equal(typeof parsed, "object");
    assert.equal(parsed === null, false);
  }
});

test("Friday sample matches the 26 September 2026 wireframe", () => {
  const { text, value } = readFixture("friday-2026-09-25.json");
  const friday = value as FridayDocument;
  assert.equal(text.includes("100000"), false);
  assert.equal(text.includes("100,000"), false);
  assert.equal(friday.schema, 1);
  assert.deepEqual(friday.official, {
    closeDate: "2026-09-25",
    closeLabel: "Fri 25 Sep 2026",
    nextCloseDate: "2026-10-02",
    nextCloseLabel: "Fri 2 Oct 2026",
  });
  assert.equal(friday.standDownPause, false);
  assert.equal(friday.armedWait, false);
  assert.deepEqual(friday.dollarSlot, { pile: "cashAvailable" });
  assert.equal(friday.cash.posture, "ALL_IN");
  assert.equal(friday.cash.word, "All in");
  assert.equal(friday.cash.tone, "buy");
  assert.deepEqual(friday.cash.sentences, [
    "Buy now, or by the Friday 2 Oct 2026 close.",
    "After that close, the call is whatever that Friday says.",
    "Standing contribution continues.",
  ]);
  assert.deepEqual(friday.cash.window, {
    steps: [
      { dateLabel: "Fri 18 Sep", caption: "fired", state: "done" },
      { dateLabel: "Fri 25 Sep", caption: "grace, this call", state: "current" },
      { dateLabel: "Fri 2 Oct", caption: "last grace", state: "next" },
    ],
    lastGraceCloseUtc: "2026-10-03T00:00:00Z",
  });
  assert.deepEqual(friday.cash.recordRows, [
    { key: "RECORD", text: "4 of 4. Floor about 60% (Wilson 90%). 4 episodes." },
    { key: "PAYOFF", text: "Beat a 52-week spread, 4 of 4, +18% to +92% coins." },
    { key: "STATUS", text: "This fire is open. Not high confidence." },
  ]);
  assert.equal(friday.cash.highConfidence, false);
  assert.deepEqual(friday.coinsHold, {
    word: "Hold",
    tone: "neutral",
    sentences: ["Coins already held stay held."],
  });
  assert.equal(friday.disagreement, null);
  assert.deepEqual(
    friday.caveats.map((caveat) => caveat.kind),
    ["gold", "fireWeek", "fit"],
  );
  assert.equal(friday.caveats[0]?.title, "Gold flag is on");
  assert.equal(
    friday.caveats[0]?.body,
    "Arm 21 Nov 2025. Gold share 24.5%, cut 15%. From 12 Sep 2025: Bitcoin about \u221227%, gold about +11%. The 38% year-over-year figure is a different window.",
  );
  assert.equal(friday.caveats[1]?.title, "Fire week");
  assert.equal(friday.caveats[1]?.body, "Led by Bitcoin (+10.4% to this close).");
  assert.equal(friday.caveats[2]?.title, "Fit range");
  assert.equal(
    friday.caveats[2]?.body,
    "Gap about \u221241% on this fit (trend about $141,000). Other start years: \u221229% to \u221246%. The arm holds. Not a price target.",
  );
  assert.equal(friday.context[1]?.flag, "GOLD FLAG");
  assert.equal(friday.context[1]?.flagTone, "sell");
  assert.equal(friday.context[1]?.value.includes("\u221227%"), true);
  assert.equal(friday.longView.statement, "Holds of 3, 4, 5, and 10 years were up in 99% or more of entry weeks.");
  assert.equal(friday.cycles.footnote, "2011 and 2013 had no buy-cross fire. They are not scored.");
  const finishedShares = friday.cycles.cards
    .filter((card) => card.isProgress === false)
    .flatMap((card) => card.rows.map((row) => row.sharePct));
  assert.deepEqual(finishedShares, [60, 71, 34, 54, 25, 84, 42, 51, 93, 44]);
  const progress = friday.cycles.cards.find((card) => card.isProgress);
  assert.equal(progress?.lead?.includes("+436%"), true);
  assert.equal(progress?.rows[0]?.detail.includes("+208%"), true);
  assert.equal(progress?.rows[0]?.detail.includes("+207%"), false);
  assert.deepEqual(
    progress?.rows.map((row) => row.sharePct),
    [48, 1, 92, 17],
  );
  assert.equal(progress?.rows[1]?.detail.includes("+4%"), true);
  assert.equal(progress?.rows[2]?.detail.includes("+402%"), true);
  assert.equal(progress?.rows[3]?.detail.includes("+76%"), true);
  assert.deepEqual(friday.footer, [
    "Research rule. A large position needs the holder's full balance sheet.",
    "This page does not trade and does not compute tax.",
  ]);
  assert.equal(friday.previousOfficial, null);

  const buys = friday.chart.fires.filter((fire) => fire.type === "buy");
  assert.deepEqual(
    buys.map((fire) => [fire.date, fire.price, fire.status, fire.resultLabel]),
    [
      ["2015-07-24", 289, "completed", "Finished year: +127%"],
      ["2019-05-03", 5658, "completed", "Finished year: +59%"],
      ["2020-07-31", 11338, "completed", "Finished year: +269%"],
      ["2023-03-17", 27451, "completed", "Finished year: +138%"],
      ["2026-09-18", 80944, "open", "Open. Not in the completed count."],
    ],
  );

  const sells = friday.chart.fires.filter((fire) => fire.type === "sell");
  const sellDates = sells.map((fire) => fire.date);
  assert.deepEqual(sellDates, [
    "2013-06-07",
    "2014-04-04",
    "2014-08-01",
    "2017-09-01",
    "2018-03-02",
    "2018-05-04",
    "2021-05-07",
    "2021-12-03",
  ]);
  const banned = ["2013-04", "2017-12", "2019-07", "2021-03"];
  for (const date of sellDates) {
    assert.equal(utcWeekday(date), 5, date);
    for (const prefix of banned) {
      assert.equal(date.includes(prefix), false, date);
    }
    assert.equal(sells.find((fire) => fire.date === date)?.status, "completed");
  }
  assert.deepEqual(
    sells.map((fire) => fire.resultLabel),
    ["Jun 2013", "Apr 2014", "Aug 2014", "Sep 2017", "Mar 2018", "May 2018", "May 2021", "Dec 2021"],
  );

  const weeklyDates = friday.chart.weekly.map((point) => point.date);
  assert.deepEqual(friday.chart.trend.map((point) => point.date), weeklyDates);
  assert.deepEqual(friday.chart.lower.map((point) => point.date), weeklyDates);
  assert.deepEqual(friday.chart.upper.map((point) => point.date), weeklyDates);
  assert.equal(weeklyDates.includes("2013-01-04"), true);
  assert.equal(friday.chart.weekly.find((point) => point.date === "2026-09-25")?.close, 84413);
  for (const fire of friday.chart.fires) {
    assert.equal(utcWeekday(fire.date), 5, fire.date);
    const close = friday.chart.weekly.find((point) => point.date === fire.date)?.close;
    assert.equal(close === undefined, false, fire.date);
    if (fire.type === "buy") {
      assert.equal(close, fire.price, fire.date);
    }
  }
  const endTrend = friday.chart.trend.find((point) => point.date === "2026-09-25");
  assert.equal(endTrend?.value, 141000);
  assert.equal(friday.chart.lower.find((point) => point.date === "2026-09-25")?.value, 112800);
  assert.equal(friday.chart.upper.find((point) => point.date === "2026-09-25")?.value, 218550);
  for (const point of friday.chart.trend) {
    assert.equal(
      friday.chart.lower.find((row) => row.date === point.date)?.value,
      point.value * 0.8,
    );
    assert.equal(
      friday.chart.upper.find((row) => row.date === point.date)?.value,
      point.value * 1.55,
    );
  }
  assert.equal(friday.chart.sma200w.length, 1);
  assert.equal(friday.chart.trendLabel, "Trend $141k");
  assert.equal(
    friday.chart.captions.includes("The 200-week average is a map line. It does not time a buy."),
    true,
  );
  assert.equal(friday.chart.captions.includes("July 2020 fired nearer the trend."), true);
});

test("live slices move the print and not the cash word", () => {
  const official = readFixture("live-2026-09-25.json");
  const later = readFixture("live-later.json");
  const friday = readFixture("friday-2026-09-25.json").value as FridayDocument;
  const live = official.value as LiveSlice;
  const moved = later.value as LiveSlice;
  assert.equal(official.text.includes("All in"), false);
  assert.equal(official.text.includes("ALL_IN"), false);
  assert.equal(later.text.includes("All in"), false);
  assert.equal(later.text.includes("ALL_IN"), false);
  assert.equal(live.schema, 1);
  assert.equal(live.officialCloseDate, "2026-09-25");
  assert.equal(live.spotUsd, 84413);
  assert.equal(live.gapPct, -0.41);
  assert.equal(live.trendUsd, 141000);
  assert.equal(live.spotAsOf, "2026-09-25T00:00:00Z");
  assert.equal(live.printLabel, "25 Sep 2026 daily close");
  assert.equal(live.isOfficialClose, true);
  assert.equal(live.developing, null);
  assert.equal(live.realizedRatio, 1.59);
  assert.equal(live.realizedAsOf, "2026-09-25");
  assert.equal(live.gold, null);
  assert.deepEqual(live.chartTip, { date: "2026-09-25", value: 84413 });
  assert.equal(live.stale, false);
  assert.equal(live.missingClose, false);
  assert.deepEqual(live.progress, friday.cycles.cards.find((card) => card.isProgress));
  assert.equal(moved.officialCloseDate, "2026-09-25");
  assert.equal(moved.spotUsd, 90000);
  assert.equal(moved.gapPct, -0.36);
  assert.equal(moved.isOfficialClose, false);
  assert.equal(moved.developing, null);
  assert.equal(moved.stale, false);
  assert.equal(moved.missingClose, false);
  assert.equal(moved.progress.lead === live.progress.lead, false);
  assert.equal(moved.chartTip.value, 90000);
  const spot = 90000;
  const low = 15758;
  const rise = spot / low - 1;
  const share = (entry: number): number => Math.round(((spot / entry - 1) / rise) * 100);
  assert.equal(moved.progress.rows.find((row) => row.name === "Build")?.sharePct, share(16806));
  assert.equal(moved.progress.rows.find((row) => row.name === "Lump in")?.sharePct, share(48026));
  assert.equal(share(16806), 92);
  assert.equal(share(48026), 19);
});

test("settings fixtures keep amounts empty except the sample cash pile", () => {
  const blank = readFixture("settings-blank.json").value as HolderSettings;
  const sample = readFixture("settings-sample.json").value as HolderSettings;
  assert.deepEqual(blank, {
    standingAmount: null,
    standingEvery: null,
    buildAmount: null,
    cashAvailable: null,
    coinsHeld: null,
    netWorth: null,
    targetShare: null,
    ceilingShare: null,
    thesisBroken: false,
    thesisDate: null,
    account: null,
  });
  assert.equal(sample.cashAvailable, 100000);
  assert.equal(sample.standingAmount, null);
  assert.equal(sample.standingEvery, null);
  assert.equal(sample.buildAmount, null);
  assert.equal(sample.coinsHeld, null);
  assert.equal(sample.netWorth, null);
  assert.equal(sample.targetShare, null);
  assert.equal(sample.ceilingShare, null);
  assert.equal(sample.thesisBroken, false);
  assert.equal(sample.thesisDate, null);
  assert.equal(sample.account, null);
});
