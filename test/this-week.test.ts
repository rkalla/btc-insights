import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import {
  addCalendarMonths,
  addModeFor,
  applyOverlay,
  composePlain,
  displayDollars,
  shareMeetsCeiling,
  stepForPosture,
  type FridayStateOverlay,
  type PlainView,
} from "../src/compose/plain.ts";
import { compose } from "../src/compose/view-model.ts";
import type { CashPosture, FridayDocument, HolderSettings, LiveSlice } from "../src/contract/types.ts";
import {
  BANNED_THIS_WEEK,
  COPY_WRITTEN_FOR,
  weekBlob,
  type WeekCopy,
} from "../src/copy/thisWeek.ts";
import { blankSettings } from "../src/settings/store.ts";

const OPENED = "2026-09-27T21:14:00.000Z";
const ZONE = "America/Phoenix";
const UNDER_PRICE =
  "Prices move every day. The Friday advice stays put. Selling some Bitcoin can turn on during the week if your share crosses the limit you set.";
const RISK_CLOSE = "Only use money you won't need for a few years.";
const BANNED = new RegExp(`\\b(?:${BANNED_THIS_WEEK.join("|")})\\b`, "gi");

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), "utf8")) as unknown;
}

const friday = readJson("fixtures/friday-2026-09-25.json") as FridayDocument;
const later = readJson("fixtures/live-later.json") as LiveSlice;

function overlay(name: string): FridayStateOverlay {
  return readJson(`fixtures/states/${name}.json`) as FridayStateOverlay;
}

function settings(patch: Partial<HolderSettings> = {}): HolderSettings {
  return { ...blankSettings(), ...patch };
}

function live(patch: Partial<LiveSlice> = {}): LiveSlice {
  return { ...later, ...patch };
}

function render(
  patch: FridayStateOverlay = {},
  holder: HolderSettings = settings(),
  slice: Partial<LiveSlice> = {},
  openedAt = OPENED,
  timeZone = ZONE,
): PlainView {
  return composePlain(applyOverlay(friday, patch), live(slice), holder, openedAt, timeZone);
}

function hits(text: string): string[] {
  return [...text.matchAll(new RegExp(BANNED.source, "gi"))].map((match) => match[0].toLowerCase());
}

function weekSentences(copy: WeekCopy): string[] {
  const sentences: string[] = [];
  for (const chunk of weekBlob(copy).split("\n")) {
    for (const sentence of chunk.split(/(?<=[.!?])\s+/)) {
      const trimmed = sentence.trim();
      if (trimmed !== "") sentences.push(trimmed);
    }
  }
  return sentences;
}

function sentenceWordCount(sentence: string): number {
  const bare = sentence.replace(/[.!?]+$/u, "").trim();
  if (bare === "") return 0;
  return bare.split(/\s+/).length;
}

function guard(copy: WeekCopy): void {
  const blob = weekBlob(copy);
  assert.equal(blob.includes("{"), false, blob);
  assert.equal(blob.includes("}"), false, blob);
  assert.equal(blob.includes("undefined"), false, blob);
  assert.equal(blob.includes("NaN"), false, blob);
  assert.equal(blob.includes("null"), false, blob);
  assert.equal(copy.underPrice, UNDER_PRICE);
  // The deck's ordinary verb "crosses" is also the jargon pattern. It is the only allowed hit.
  assert.deepEqual(hits(blob), ["crosses"], blob);
  assert.deepEqual(hits(blob.replaceAll(UNDER_PRICE, "")), []);
  for (const sentence of weekSentences(copy)) {
    const count = sentenceWordCount(sentence);
    assert.equal(count <= 25, true, `${count}: ${sentence}`);
  }
}

const trimHolder = settings({
  coinsHeld: 1,
  netWorth: 470000,
  targetShare: 10,
  ceilingShare: 15,
});

test("COPY_WRITTEN_FOR matches the Friday presentation", () => {
  assert.deepEqual(friday.presentation, COPY_WRITTEN_FOR);
  assert.equal(friday.chart.weekly.find((point) => point.date === "2026-09-25")?.close, 84413);
  assert.equal(friday.cash.word, "All in");
  assert.equal(friday.standDownFireDate, undefined);
});

test("a published Friday without presentation still uses the copy facts", () => {
  const { presentation: _ignored, ...rest } = friday;
  const published = rest as FridayDocument;
  const view = composePlain(published, live(), settings(), OPENED, ZONE);
  assert.equal(view.copy.headline, "A strong week to buy Bitcoin.");
  assert.equal(view.copy.track?.includes("beat spreading it over a year, all 4 times"), true);
  assert.equal(view.copy.tiles[0], "2015 +127%");
});

test("state fixtures only change the fields a state needs", () => {
  const names = readdirSync(new URL("../fixtures/states/", import.meta.url))
    .filter((name) => name.endsWith(".json"))
    .sort();
  assert.deepEqual(names, [
    "build.json",
    "lump-in.json",
    "no-call.json",
    "slow-in.json",
    "stale.json",
    "stand-down.json",
    "stay.json",
  ]);
  const postures: Record<string, CashPosture> = {
    "build.json": "BUILD",
    "lump-in.json": "LUMP_IN",
    "no-call.json": "NO_CALL",
    "slow-in.json": "SLOW_IN",
    "stand-down.json": "STAND_DOWN",
    "stay.json": "STAY",
  };
  for (const name of names) {
    const value = readJson(`fixtures/states/${name}`) as Record<string, unknown>;
    assert.equal("chart" in value, false, name);
    assert.equal("presentation" in value, false, name);
    if (name === "stale.json") {
      assert.deepEqual(Object.keys(value), ["official"]);
      continue;
    }
    const posture = postures[name];
    assert.equal((value.cash as { posture: string }).posture, posture, name);
  }
  assert.equal(overlay("stand-down").standDownFireDate, "2026-03-06");
  assert.equal(addCalendarMonths("2026-03-06", 12), "2027-03-06");
});

test("buy strongly uses the deck, the gold line, and five days in Phoenix", () => {
  const before = friday.cash.posture;
  const view = render();
  guard(view.copy);
  assert.equal(friday.cash.posture, before);
  assert.equal(view.state, "BUY_STRONGLY");
  assert.equal(view.step, "Buy strongly");
  assert.equal(view.addMode, null);
  assert.equal(view.tone, "buy");
  assert.equal(view.gold, true);
  assert.equal(view.gettingClose, false);
  assert.equal(view.replacesPause, false);
  assert.equal(view.outOfDate, false);
  assert.equal(view.takeProfit, false);
  assert.equal(view.copy.headline, "A strong week to buy Bitcoin.");
  assert.equal(view.copy.underHeadline, "Keep any Bitcoin you already own.");
  assert.equal(view.copy.chip, "5 days left");
  assert.equal(
    view.copy.updateLine,
    "This week's advice, set Friday, Sep 25. Next update Friday, Oct 2, 5:00 pm your time.",
  );
  assert.equal(view.copy.disclaimer, "Research, not personal financial advice.");
  assert.equal(view.copy.scaleNote, "This shows what to do, not how sure we are.");
  assert.equal(
    view.copy.track,
    "The set-aside money went in at once and beat spreading it over a year, all 4 times. 4 is a small number.",
  );
  assert.deepEqual(view.copy.actions, [
    "Put the money you've set aside into Bitcoin by Friday, Oct 2, 5:00 pm your time.",
    "Keep your regular buys going.",
  ]);
  assert.equal(view.copy.after, "After that, this page switches to the next week's advice.");
  assert.equal(view.copy.personalise, "Want this in dollars? Add your amount in Settings. It stays on this device.");
  assert.equal(
    view.copy.why[0],
    "On Sep 18, our strongest buy signal turned on. Before this, it had turned on only 4 times: in 2015, 2019, 2020 and 2023. Those 4 times, putting the money in at once beat spreading it over the next year.",
  );
  assert.equal(
    view.copy.why[1],
    "Part of this move was gold rising, not only Bitcoin falling. The instruction stays the same.",
  );
  assert.equal(
    view.copy.worked,
    "Yes, all 4 times, against spreading the same money over a year. That's too few to be sure. A cautious reading is about 6 times in 10 or better. Treat it as a strong hint, not a promise.",
  );
  assert.deepEqual(view.copy.tiles, ["2015 +127%", "2019 +59%", "2020 +269%", "2023 +138%", "2026 In progress"]);
  assert.equal(view.copy.tileCaption, "Bitcoin's price one year after each signal.");
  assert.equal(
    view.copy.risks[0],
    "After past signals like this, Bitcoin still dropped as much as 27% below its signal-day price at some point in the next year. It has fallen 20% or more at some point in every year since 2012.",
  );
  assert.equal(view.copy.riskClose, RISK_CLOSE);
  assert.equal(view.copy.price, "Bitcoin today $90,000, Saturday, Sep 26, 5:00 am.");
  assert.equal(view.copy.evidence, "See the evidence behind this.");
  assert.equal(view.copy.evidenceSub, "Charts, the rules, and every past signal.");
  assert.equal(view.latestPriceUsd, 90000);
  assert.equal(view.copy.footer.includes("fee-only financial adviser."), true);
});

test("a saved amount and a regular buy replace the blank lines", () => {
  const view = render({}, settings({ cashAvailable: 10000, standingAmount: 200, standingEvery: "week" }));
  guard(view.copy);
  assert.equal(view.copy.personalise, null);
  assert.deepEqual(view.copy.actions, [
    "Put $10,000 into Bitcoin by Friday, Oct 2, 5:00 pm your time.",
    "Keep your regular buys going ($200 a week).",
  ]);
  const monthly = render({}, settings({ cashAvailable: 10000, standingAmount: 200, standingEvery: "month" }));
  assert.equal(monthly.copy.actions[1], "Keep your regular buys going ($200 a month).");
});

test("gold is only on buy strongly, and an armed buy is not getting close", () => {
  const quiet = render({ caveats: [] });
  guard(quiet.copy);
  assert.equal(quiet.gold, false);
  assert.equal(quiet.copy.why.length, 1);
  const armed = render({ armedWait: true });
  assert.equal(armed.gettingClose, false);
  assert.equal(armed.copy.callout, null);
});

test("the four zones and the Phoenix day count", () => {
  const zones: [string, string][] = [
    ["America/Phoenix", "Friday, Oct 2, 5:00 pm"],
    ["America/New_York", "Friday, Oct 2, 8:00 pm"],
    ["Europe/London", "Saturday, Oct 3, 1:00 am"],
    ["UTC", "Friday, Oct 2 at midnight"],
  ];
  for (const [timeZone, deadline] of zones) {
    const view = render({}, settings(), {}, OPENED, timeZone);
    guard(view.copy);
    assert.equal(view.copy.actions[0], `Put the money you've set aside into Bitcoin by ${deadline} your time.`);
    assert.equal(view.copy.updateLine?.includes(`${deadline} your time.`), true, timeZone);
  }
  assert.equal(render().copy.chip, "5 days left");
  assert.equal(render({}, settings(), {}, "2026-10-01T21:14:00.000Z").copy.chip, "1 day left");
  assert.equal(render({}, settings(), {}, "2026-10-02T16:00:00.000Z").copy.chip, "Due today");
  const soon = render({}, settings(), {}, "2026-10-03T03:00:00.000Z");
  assert.equal(soon.copy.chip, "Updating soon");
  assert.equal(soon.outOfDate, false);
  const exact = render({}, settings(), {}, "2026-10-03T06:00:00.000Z");
  assert.equal(exact.outOfDate, false);
  assert.equal(exact.copy.chip, "Updating soon");
  const stale = render({}, settings(), {}, "2026-10-03T06:00:01.000Z");
  assert.equal(stale.outOfDate, true);
  assert.equal(stale.copy.chip, null);
  assert.equal(stale.copy.updateLine, null);
  assert.equal(
    stale.copy.banner,
    "This page hasn't updated since Friday, Sep 25, 5:00 pm. Don't act on it until it does.",
  );
});

test("an official Friday close is labeled and aged from the next UTC midnight", () => {
  const official = readJson("fixtures/live-2026-09-25.json") as LiveSlice;
  assert.equal(official.spotAsOf, "2026-09-25T00:00:00Z");
  assert.equal(official.isOfficialClose, true);
  assert.equal(official.chartTip.date, "2026-09-25");
  const zones: [string, string][] = [
    ["America/Phoenix", "Friday, Sep 25, 5:00 pm"],
    ["America/New_York", "Friday, Sep 25, 8:00 pm"],
    ["Europe/London", "Saturday, Sep 26, 1:00 am"],
    ["UTC", "Friday, Sep 25 at midnight"],
  ];
  for (const [timeZone, when] of zones) {
    const view = composePlain(friday, official, settings(), "2026-09-26T02:00:00Z", timeZone);
    guard(view.copy);
    assert.equal(view.copy.price, `Bitcoin today $84,413, ${when}.`, timeZone);
    assert.equal(view.latestPriceUtc, "2026-09-25T00:00:00Z", timeZone);
  }

  const quote = { ...official, isOfficialClose: false };
  const unshifted = composePlain(friday, quote, settings(), "2026-09-26T02:00:00Z", "America/Phoenix");
  assert.equal(unshifted.copy.price, "Bitcoin today $84,413, Thursday, Sep 24, 5:00 pm.");
  assert.equal(unshifted.latestPriceUtc, "2026-09-25T00:00:00Z");
  const midday = composePlain(
    friday,
    { ...official, spotAsOf: "2026-09-25T18:00:00Z" },
    settings(),
    OPENED,
    "America/Phoenix",
  );
  assert.equal(midday.copy.price, "Bitcoin today $84,413, Friday, Sep 25, 11:00 am.");
  assert.equal(midday.latestPriceUtc, "2026-09-25T18:00:00Z");

  const holder = settings();
  const early = compose(friday, official, holder, "2026-09-26T02:00:00Z");
  assert.equal(early.now.stale, false);
  assert.equal(early.now.staleNote, null);
  assert.equal(early.chart.spot.date, "2026-09-25");
  assert.equal(official.chartTip.date, "2026-09-25");
  assert.equal(official.spotAsOf, "2026-09-25T00:00:00Z");

  const onTheLine = compose(friday, official, holder, "2026-09-27T02:00:00Z");
  assert.equal(onTheLine.now.stale, true);
  assert.equal(onTheLine.now.staleNote, "The latest print is from 26 Sep 2026. Levels may be out of date.");
  assert.equal(onTheLine.chart.spot.date, "2026-09-25");

  const duringFriday = compose(friday, official, holder, "2026-09-26T03:00:00Z");
  assert.equal(duringFriday.now.stale, false);
  const quoteAged = compose(friday, quote, holder, "2026-09-26T03:00:00Z");
  assert.equal(quoteAged.now.stale, true);
  assert.equal(quoteAged.now.staleNote, "The latest print is from 25 Sep 2026. Levels may be out of date.");
  assert.equal(quoteAged.chart.spot.date, "2026-09-25");
  const quoteOnTheLine = compose(friday, quote, holder, "2026-09-26T02:00:00Z");
  assert.equal(quoteOnTheLine.now.stale, false);

  const flagged = { ...official, stale: true };
  const publishedEarly = compose(friday, flagged, holder, "2026-09-26T03:00:00Z");
  assert.equal(publishedEarly.now.stale, false);
  assert.equal(publishedEarly.now.staleNote, null);
  assert.equal(publishedEarly.chart.spot.date, "2026-09-25");
  assert.equal(flagged.spotAsOf, "2026-09-25T00:00:00Z");
  const publishedLate = compose(friday, flagged, holder, "2026-09-27T02:00:00Z");
  assert.equal(publishedLate.now.stale, true);
  assert.equal(publishedLate.now.staleNote, "The latest print is from 26 Sep 2026. Levels may be out of date.");
  assert.equal(publishedLate.chart.spot.date, "2026-09-25");
  assert.equal(compose(friday, flagged, holder, "not-a-time").now.stale, true);
  assert.equal(compose(friday, { ...flagged, spotAsOf: "bogusT00:00:00Z" }, holder, "2026-09-26T03:00:00Z").now.stale, true);
});

test("add at once, add each week, and steady", () => {
  const lump = render(overlay("lump-in"), settings(), { gapPct: -0.41 });
  guard(lump.copy);
  assert.equal(lump.state, "ADD_AT_ONCE");
  assert.equal(lump.step, "Add");
  assert.equal(lump.addMode, "AT_ONCE");
  assert.equal(lump.gold, false);
  assert.equal(lump.copy.headline, "A good time to add to Bitcoin.");
  assert.equal(lump.copy.chip, "Holds until Fri, Oct 2");
  assert.equal(
    lump.copy.track,
    "Putting the money in at once beat spreading it over a year in all 6 finished stretches. One stretch is still open.",
  );
  assert.deepEqual(lump.copy.actions, [
    "Put the money you've set aside into Bitcoin when you have it. There's no need to spread it out.",
    "Keep your regular buys going.",
  ]);
  assert.equal(
    lump.copy.why[0],
    "Bitcoin is about 41% below its long-run trend. In stretches like this, putting money in at once beat spreading it over a year in all 6 finished cases. A cautious reading is about 7 times in 10 or better.",
  );
  assert.equal(
    lump.copy.worked,
    "Yes, in all 6 finished stretches. That's still a small number. A cautious reading is about 7 times in 10 or better. This stretch began in November 2025 and hasn't finished yet.",
  );
  assert.equal(lump.copy.personalise?.includes("Want this in dollars?"), true);

  const close = render({ ...overlay("lump-in"), armedWait: true }, settings(), { gapPct: -0.41 });
  guard(close.copy);
  assert.equal(close.gettingClose, true);
  assert.equal(
    close.copy.callout,
    "Our strongest buy signal is set up and has not turned on. Extra cash waits. This wait has not been tested.",
  );
  assert.equal(
    close.copy.why[1],
    "Bitcoin has fallen far enough against gold, and below its trend, to set up our strongest buy signal. It turns on when Bitcoin's price in gold climbs back to its one-year average.",
  );

  const build = render(overlay("build"));
  guard(build.copy);
  assert.equal(build.state, "ADD_WEEKLY");
  assert.equal(build.addMode, "WEEKLY");
  assert.equal(build.copy.headline, "Bitcoin is cheap. Add a little each week.");
  assert.equal(build.copy.actions[0], "Add a small, fixed amount to Bitcoin this week, and each week while it stays this cheap.");
  assert.equal(
    build.copy.track,
    "Bitcoin was up at least 50% a year later in about 79% of 91 weeks like this, across 4 stretches. The weekly pace was not tested.",
  );
  assert.equal(
    build.copy.why[0],
    "Bitcoin is trading below what the average holder paid for it. That has happened in 4 stretches since 2012. In those stretches, Bitcoin was up at least 50% a year later in about 79% of 91 weeks.",
  );
  assert.equal(
    build.copy.worked,
    "Yes, on that 50% test. The 91 weeks come from 4 stretches, and weeks close together move together. The weekly pace was not tested.",
  );
  const sliced = render(overlay("build"), settings({ buildAmount: 65000 }));
  assert.equal(sliced.copy.personalise, null);
  assert.equal(sliced.copy.actions[0], "Add $2,500 to Bitcoin this week, and each week while it stays this cheap.");
  assert.equal(
    render(overlay("build"), settings({ buildAmount: 999 })).copy.actions[0],
    "Add $38 to Bitcoin this week, and each week while it stays this cheap.",
  );
  assert.equal(
    render(overlay("build"), settings({ buildAmount: 100000 })).copy.actions[0],
    "Add $3,850 to Bitcoin this week, and each week while it stays this cheap.",
  );
  const buildClose = render({ ...overlay("build"), armedWait: true });
  assert.equal(buildClose.gettingClose, true);
  guard(buildClose.copy);

  const stay = render(overlay("stay"), settings(), { gapPct: -0.08 });
  guard(stay.copy);
  assert.equal(stay.state, "STEADY");
  assert.equal(stay.step, "Steady");
  assert.equal(stay.tone, "neutral");
  assert.equal(stay.copy.headline, "A normal week. Keep your regular buys.");
  assert.equal(stay.copy.track, "None needed. This is the normal plan.");
  assert.equal(
    stay.copy.why[0],
    "Bitcoin is about 8% below its long-run trend, which is within its normal range. None of our buy or caution signals is on.",
  );
  assert.equal(
    stay.copy.actions[1],
    "Have new money to invest? History shows no clear winner in weeks like this, so put it in now or spread it out, whichever you prefer.",
  );
  assert.equal(
    stay.copy.worked,
    "Nothing to test this week. There's no special signal, so there's no record to show. Regular buying is the default plan.",
  );
  const above = render(overlay("stay"), settings(), { gapPct: 0.12 });
  assert.equal(
    above.copy.why[0],
    "Bitcoin is about 12% above its long-run trend, which is within its normal range. None of our buy or caution signals is on.",
  );
  const flat = render(overlay("stay"), settings(), { gapPct: 0 });
  assert.equal(
    flat.copy.why[0],
    "Bitcoin is about 0% below its long-run trend, which is within its normal range. None of our buy or caution signals is on.",
  );
  const tinyAbove = render(overlay("stay"), settings(), { gapPct: 0.004 });
  assert.equal(tinyAbove.copy.why[0]?.includes("about 0% above"), true);
  const missingGap = render(overlay("stay"), settings(), { gapPct: Number.NaN });
  assert.equal(missingGap.copy.why[0], "None of our buy or caution signals is on.");
  assert.equal(missingGap.copy.why[0]?.includes("about 0% from"), false);
  const aboveLump = render(overlay("lump-in"), settings(), { gapPct: 0.4 });
  guard(aboveLump.copy);
  assert.equal(aboveLump.copy.why[0]?.includes("below"), false);
  assert.equal(
    aboveLump.copy.why[0],
    "In stretches like this, putting money in at once beat spreading it over a year in all 6 finished cases. A cautious reading is about 7 times in 10 or better.",
  );
  const stayClose = render({ ...overlay("stay"), armedWait: true }, settings(), { gapPct: -0.08 });
  assert.equal(stayClose.gettingClose, true);
  guard(stayClose.copy);
});

test("go slow and stand down", () => {
  const slow = render(overlay("slow-in"));
  guard(slow.copy);
  assert.equal(slow.state, "GO_SLOW");
  assert.equal(slow.step, "Go slow");
  assert.equal(slow.tone, "caution");
  assert.equal(slow.copy.headline, "Prices are stretched. Go slow with new money.");
  assert.equal(slow.copy.track, "Worked 2 of 3 times, our weakest record.");
  assert.deepEqual(slow.copy.actions, [
    "Spread any new lump sum evenly over the next 12 months.",
    "Keep your regular buys going.",
  ]);
  assert.equal(
    slow.copy.why[0],
    "Bitcoin is more than 55% above its long-run trend. At times like this, spreading new money out did better than investing it at once in 2 of 3 cases.",
  );
  assert.equal(
    slow.copy.worked,
    "2 of 3 times. With only 3 cases, we can't say it beats a coin flip. Treat it as a hint, not a rule.",
  );
  assert.equal(slow.copy.risks[0], "If prices keep rising, spreading out means paying more for some of your Bitcoin.");

  const pause = render(overlay("stand-down"));
  guard(pause.copy);
  assert.equal(pause.state, "PAUSE");
  assert.equal(pause.step, "Pause");
  assert.equal(pause.pauseEnds, "2027-03-06");
  assert.equal(pause.copy.headline, "Pause new buying for now.");
  assert.equal(
    pause.copy.track,
    "Pausing got more Bitcoin for the same money 7 of 8 times. Those overlap, so count about six stretches. June 2013 was the miss.",
  );
  assert.deepEqual(pause.copy.actions, [
    "Pause new buys, including your regular ones.",
    "Keep that money somewhere safe that pays interest, such as Treasury bills or a high-yield savings account.",
    "This pause ends when the page says Buy strongly or Add each week. If neither has happened by Mar 6, 2027, that money is available again and follows the advice that day.",
  ]);
  assert.equal(
    pause.copy.why[0],
    "On Mar 6, our caution signal turned on: after a big run-up above its long-run trend, Bitcoin fell 10% from its peak. Pausing and buying later got more Bitcoin for the same money in 7 of 8 cases, about six stretches.",
  );
  assert.equal(
    pause.copy.worked,
    "7 of 8 times, about six stretches. In June 2013, pausing missed a large rise. The signal also stayed off before two big drops, in 2019\u201320 and 2025\u201326. A 12-month pause has not been tested on its own.",
  );
  assert.equal(pause.copy.risks[0], "Pausing can mean buying back at a higher price. In 2013, it meant missing a large rise.");
  assert.equal(pause.gold, false);

  const undated = render({ cash: { posture: "STAND_DOWN" }, standDownPause: true, standDownFireDate: null });
  guard(undated.copy);
  assert.equal(undated.pauseEnds, null);
  assert.equal(undated.copy.why[0]?.includes("On ,"), false);
  assert.equal(
    undated.copy.why[0],
    "Our caution signal turned on: after a big run-up above its long-run trend, Bitcoin fell 10% from its peak. Pausing and buying later got more Bitcoin for the same money in 7 of 8 cases, about six stretches.",
  );
  assert.equal(undated.copy.actions[2], "This pause ends when the page says Buy strongly or Add each week.");
});

test("sell follows the viewer and an IRA drops the tax sentence", () => {
  const sell = render({}, settings({ thesisBroken: true, thesisDate: "2026-09-01", account: "taxable" }));
  guard(sell.copy);
  assert.equal(sell.state, "SELL");
  assert.equal(sell.step, "Pause");
  assert.equal(sell.copy.chip, null);
  assert.equal(sell.copy.headline, "Stop buying, and sell your Bitcoin.");
  assert.equal(sell.copy.underHeadline, "You've told us Bitcoin's long-term case is broken.");
  assert.equal(sell.copy.track, "None. This follows your decision, not a market signal.");
  assert.deepEqual(sell.copy.actions, [
    "Sell the Bitcoin you hold. Selling can create a tax bill, so check with a tax adviser first.",
    "Stop new buys, including your regular ones.",
  ]);
  assert.equal(
    sell.copy.why[0],
    "On Sep 1, you said in Settings that you no longer believe in Bitcoin's long-term case.",
  );
  assert.equal(sell.copy.worked, "There's no record for this. It's your decision, not a signal, so there's nothing to test.");
  assert.equal(sell.copy.riskClose, null);
  assert.equal(sell.copy.risks[0], "If you change your mind, you may buy back at a higher price. You can undo this in Settings.");
  assert.equal(sell.takeProfit, false);

  const ira = render({}, settings({ thesisBroken: true, thesisDate: "2026-09-01", account: "ira" }));
  guard(ira.copy);
  assert.equal(ira.copy.actions[0], "Sell the Bitcoin you hold.");
  assert.equal(ira.copy.actions[0]?.includes("tax"), false);

  const undated = render({}, settings({ thesisBroken: true, thesisDate: null }));
  assert.equal(undated.state, "BUY_STRONGLY");

  const holder = settings({ thesisBroken: true, thesisDate: "2026-09-01" });
  const missing = render({}, holder, { missingClose: true });
  guard(missing.copy);
  assert.equal(missing.state, "SELL");
  assert.equal(missing.outOfDate, true);
  assert.equal(missing.copy.headline, "Stop buying, and sell your Bitcoin.");
  assert.equal(missing.copy.banner?.includes("hasn't updated since"), true);
  assert.equal(missing.copy.actions.some((action) => action.includes("Keep your regular buys")), false);
  assert.equal(missing.copy.actions[1], "Stop new buys, including your regular ones.");
  assert.equal(missing.takeProfit, false);

  const noCall = render(overlay("no-call"), holder);
  guard(noCall.copy);
  assert.equal(noCall.state, "SELL");
  assert.equal(noCall.outOfDate, false);
  assert.equal(noCall.copy.headline, "Stop buying, and sell your Bitcoin.");
  assert.equal(noCall.copy.actions.some((action) => action.includes("Keep your regular buys")), false);
});

test("no update, a stale Friday, and a stale print stay distinct", () => {
  const missing = render(overlay("no-call"));
  guard(missing.copy);
  assert.equal(missing.state, "NO_UPDATE");
  assert.equal(missing.step, null);
  assert.equal(missing.outOfDate, false);
  assert.equal(missing.copy.headline, "No update this week.");
  assert.equal(missing.copy.scaleNote, "No step is marked this week.");
  assert.equal(missing.copy.track, null);
  assert.equal(missing.copy.worked, null);
  assert.equal(missing.copy.chip, null);
  assert.equal(missing.copy.banner, null);
  assert.deepEqual(missing.copy.actions, [
    "Keep your regular buys going.",
    "Check back later. We'll update as soon as the data comes through.",
  ]);
  assert.equal(missing.copy.why[0], "This week's price data didn't arrive, or it failed our checks. We won't guess.");

  const closed = render({}, settings(), { missingClose: true });
  guard(closed.copy);
  assert.equal(closed.state, "NO_UPDATE");
  assert.equal(closed.outOfDate, true);
  assert.equal(closed.copy.updateLine, null);
  assert.equal(
    closed.copy.banner,
    "This page hasn't updated since Friday, Sep 25, 5:00 pm. Don't act on it until it does.",
  );

  const old = render(overlay("stale"));
  guard(old.copy);
  assert.equal(old.state, "BUY_STRONGLY");
  assert.equal(old.outOfDate, true);
  assert.equal(old.copy.chip, null);
  assert.equal(old.copy.updateLine, null);
  assert.equal(old.copy.headline, "A strong week to buy Bitcoin.");
  assert.equal(
    old.copy.banner,
    "This page hasn't updated since Friday, Sep 18, 5:00 pm. Don't act on it until it does.",
  );

  const print = render({}, settings(), { stale: true, spotAsOf: "2026-09-25T12:00:00.000Z" });
  assert.equal(print.outOfDate, false);
  assert.equal(print.copy.banner, null);
  assert.equal(print.copy.chip, "5 days left");
  assert.equal(print.state, "BUY_STRONGLY");
});

test("a buy replaces a pause only for buy strongly and add each week", () => {
  const bought = render({ standDownPause: true });
  guard(bought.copy);
  assert.equal(bought.replacesPause, true);
  assert.equal(bought.copy.replacesPause, "An earlier signal said to pause. This week's buy signal replaces it.");
  assert.equal(bought.copy.actions[1], "Restart your regular buys.");
  const weekly = render({ ...overlay("build"), standDownPause: true }, settings({ standingAmount: 200, standingEvery: "week" }));
  guard(weekly.copy);
  assert.equal(weekly.replacesPause, true);
  assert.equal(weekly.copy.actions[1], "Restart your regular buys ($200 a week).");
  const lump = render({ ...overlay("lump-in"), standDownPause: true });
  assert.equal(lump.replacesPause, false);
  assert.equal(lump.copy.actions[1], "Keep your regular buys going.");
});

test("trim uses the latest spot, the 1e-6 tolerance, and stays off when a field is blank", () => {
  assert.equal(displayDollars(37413), "$37,400");
  assert.equal(displayDollars(53000), "$53,000");
  assert.equal(displayDollars(38.4), "$38");
  assert.equal(shareMeetsCeiling(15 - 1e-6, 15), true);
  assert.equal(shareMeetsCeiling(15 - 1e-6 - 1e-8, 15), false);

  const atClose = render({}, trimHolder, { spotUsd: 84413 });
  guard(atClose.copy);
  assert.equal(atClose.takeProfit, true);
  assert.equal(atClose.sharePct, 18);
  assert.ok(Math.abs((atClose.trimUsd ?? 0) - 37413) < 1e-6);
  assert.ok(Math.abs((atClose.trimBtc ?? 0) - 37413 / 84413) < 1e-9);
  assert.equal(atClose.latestPriceUsd, 84413);
  assert.equal(atClose.copy.underHeadline, "Take some profit: sell part of your Bitcoin.");
  assert.equal(
    atClose.copy.actions[2],
    "Sell about $37,400 of Bitcoin (about 0.44 bitcoin) to get back to 10% of your investments. Sell the coins that cost you the most first, over about 12 months. Selling can create a tax bill.",
  );
  assert.equal(
    atClose.copy.why.at(-1),
    "Bitcoin has grown to 18% of your investments, above the 15% limit you set. This uses the latest price, so it can change before Friday.",
  );

  const laterSpot = render({}, trimHolder, { spotUsd: 100000 });
  guard(laterSpot.copy);
  assert.equal(laterSpot.sharePct, 21);
  assert.ok(Math.abs((laterSpot.trimUsd ?? 0) - 53000) < 1e-6);
  assert.equal(
    laterSpot.copy.actions[2],
    "Sell about $53,000 of Bitcoin (about 0.53 bitcoin) to get back to 10% of your investments. Sell the coins that cost you the most first, over about 12 months. Selling can create a tax bill.",
  );
  assert.equal(laterSpot.copy.why.at(-1)?.includes("grown to 21%"), true);

  const paused = render(overlay("stand-down"), trimHolder, { spotUsd: 84413 });
  guard(paused.copy);
  assert.equal(paused.copy.actions[3]?.endsWith("Finish by Mar 6, 2027."), true);
  const pausedIra = render(
    overlay("stand-down"),
    settings({ ...trimHolder, account: "ira" }),
    { spotUsd: 84413 },
  );
  assert.equal(pausedIra.copy.actions[3]?.includes("tax"), false);
  assert.equal(pausedIra.copy.actions[3]?.endsWith("Finish by Mar 6, 2027."), true);

  for (const field of ["coinsHeld", "netWorth", "targetShare", "ceilingShare"] as const) {
    const blank = render({}, settings({ ...trimHolder, [field]: null }), { spotUsd: 84413 });
    assert.equal(blank.takeProfit, false, field);
    assert.equal(blank.copy.underHeadline, "Keep any Bitcoin you already own.");
    assert.equal(blank.copy.actions.some((action) => action.includes("Sell about")), false, field);
  }
  const under = render({}, settings({ ...trimHolder, netWorth: 1_000_000 }), { spotUsd: 84413 });
  assert.equal(under.takeProfit, false);
  assert.equal(under.sharePct, 8);
  const zero = render({}, settings({ ...trimHolder, netWorth: 0 }), { spotUsd: 84413 });
  assert.equal(zero.takeProfit, false);
  assert.equal(zero.sharePct, null);

  const sold = render({}, settings({ ...trimHolder, thesisBroken: true, thesisDate: "2026-09-01" }), { spotUsd: 84413 });
  assert.equal(sold.state, "SELL");
  assert.equal(sold.takeProfit, false);
  const noCall = render(overlay("no-call"), trimHolder, { spotUsd: 84413 });
  assert.equal(noCall.takeProfit, false);
  guard(noCall.copy);
});

test("every cash posture maps to one step", () => {
  const rows: [CashPosture, PlainView["state"], PlainView["addMode"]][] = [
    ["ALL_IN", "BUY_STRONGLY", null],
    ["LUMP_IN", "ADD_AT_ONCE", "AT_ONCE"],
    ["BUILD", "ADD_WEEKLY", "WEEKLY"],
    ["STAY", "STEADY", null],
    ["SLOW_IN", "GO_SLOW", null],
    ["STAND_DOWN", "PAUSE", null],
    ["NO_NEW_BUY", "PAUSE", null],
    ["NO_CALL", "NO_UPDATE", null],
  ];
  for (const [posture, state, mode] of rows) {
    const patch: FridayStateOverlay = { cash: { posture }, armedWait: false, standDownPause: false };
    if (posture === "STAND_DOWN" || posture === "NO_NEW_BUY") patch.standDownFireDate = "2026-03-06";
    const view = render(patch);
    guard(view.copy);
    assert.equal(view.step, stepForPosture(posture), posture);
    assert.equal(view.addMode, mode, posture);
    assert.equal(view.addMode, state === "NO_UPDATE" ? null : addModeFor(posture), posture);
    assert.equal(view.state, state, posture);
  }
  const missing = render({}, settings(), { missingClose: true });
  assert.equal(missing.step, null);
  assert.equal(stepForPosture("ALL_IN"), "Buy strongly");
});
