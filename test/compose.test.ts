import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { FridayDocument, HolderSettings, LiveSlice } from "../src/contract/types.ts";
import { compose } from "../src/compose/view-model.ts";
import { parseSettings } from "../src/settings/store.ts";

const OPENED = "2026-09-26T15:00:00.000Z";
const HOUR_MS = 60 * 60 * 1000;

function readText(name: string): string {
  return readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
}

const friday = JSON.parse(readText("friday-2026-09-25.json")) as FridayDocument;
const later = JSON.parse(readText("live-later.json")) as LiveSlice;
const sample = parseSettings(readText("settings-sample.json"));
const blank = parseSettings(readText("settings-blank.json"));

function live(patch: Partial<LiveSlice> = {}): LiveSlice {
  return {
    ...later,
    chartTip: { ...later.chartTip },
    progress: {
      ...later.progress,
      rows: later.progress.rows.map((row) => ({ ...row })),
    },
    ...patch,
  };
}

test("a later print moves the spot and does not move the official call", () => {
  const before = friday.cash.sentences[0];
  const fridayLead = friday.cycles.cards.find((card) => card.isProgress)?.lead;
  const vm = compose(friday, later, sample, OPENED);

  assert.equal(vm.openedAt, OPENED);
  assert.equal(vm.official.closeLabel, "Fri 25 Sep 2026");
  assert.equal(vm.official.nextCloseLabel, "Fri 2 Oct 2026");
  assert.equal(vm.cash.word, "All in");
  assert.equal(vm.cash.posture, "ALL_IN");
  assert.equal(vm.cash.tone, "buy");
  assert.deepEqual(vm.cash.recordRows, friday.cash.recordRows);
  assert.equal(vm.rails.cash, "ALL_IN");
  assert.equal(vm.rails.coins, "HOLD");
  assert.equal(vm.now.spotUsd, 90000);
  assert.equal(vm.now.gapPct, -0.36);
  assert.equal(vm.now.trendUsd, 141000);
  assert.equal(vm.now.printLabel, "Sat 26 Sep 2026 print");
  assert.equal(vm.now.isOfficialClose, false);
  assert.equal(vm.now.developing, "Developing: none.");
  assert.equal(vm.now.stale, false);
  assert.equal(vm.now.staleNote, null);
  assert.deepEqual(vm.chart.spot, { date: "2026-09-26", value: 90000 });
  assert.equal("spot" in friday.chart, false);
  const progress = vm.cycles.cards.find((card) => card.isProgress);
  assert.equal(progress?.lead, later.progress.lead);
  assert.equal(progress?.lead === fridayLead, false);
  assert.equal(fridayLead?.includes("+436%"), true);
  assert.deepEqual(
    vm.cycles.cards.filter((card) => card.isProgress === false),
    friday.cycles.cards.filter((card) => card.isProgress === false),
  );
  assert.equal(vm.countdown, "6 days left");
  assert.equal(vm.cash.window?.lastGraceCloseUtc, "2026-10-03T00:00:00Z");
  assert.equal(
    vm.cash.sentences[0],
    "Buy now, or by the Friday 2 Oct 2026 close. Up to $100,000.",
  );
  assert.equal(vm.disagreement, friday.disagreement);
  assert.equal(vm.longView.statement, friday.longView.statement);
  assert.deepEqual(vm.footer, friday.footer);
  assert.equal(vm.context[0]?.value, friday.context[0]?.value);
  assert.equal(friday.cash.sentences[0], before);
  assert.equal(friday.cash.word, "All in");
  assert.equal(later.spotUsd, 90000);
});

test("blank settings name the cash pile and do not invent dollars", () => {
  const vm = compose(friday, later, blank, OPENED);
  assert.equal(
    vm.cash.sentences[0],
    "Buy now, or by the Friday 2 Oct 2026 close. Use your cash available to invest.",
  );
  assert.equal(vm.cash.sentences[1], "After that close, the call is whatever that Friday says.");
  assert.equal(vm.cash.word, "All in");
  const text = vm.cash.sentences.join(" ");
  assert.equal(text.includes("$100,000"), false);
  assert.equal(text.includes("100000"), false);
  assert.equal(friday.cash.sentences.join(" ").includes("cash available"), false);
});

test("sample cash available appends the dollar clause", () => {
  const vm = compose(friday, later, sample, OPENED);
  assert.equal(sample.cashAvailable, 100000);
  assert.equal(
    vm.cash.sentences[0],
    "Buy now, or by the Friday 2 Oct 2026 close. Up to $100,000.",
  );
  assert.equal(vm.cash.word, "All in");
  assert.equal(vm.rails.cash, "ALL_IN");
});

test("a stale print notes the spot date and does not change the cash word", () => {
  const agedAt = new Date(Date.parse(OPENED) - 27 * HOUR_MS).toISOString();
  const aged = live({ spotAsOf: agedAt, stale: false });
  const vm = compose(friday, aged, sample, OPENED);
  assert.equal(vm.now.stale, true);
  assert.equal(vm.now.staleNote, "The latest print is from 25 Sep 2026. Levels may be out of date.");
  assert.equal(vm.now.staleNote?.includes("Fri"), false);
  assert.equal(vm.now.printLabel, later.printLabel);
  assert.equal(vm.cash.word, "All in");
  assert.equal(vm.cash.posture, "ALL_IN");
  assert.deepEqual(vm.cash.recordRows, friday.cash.recordRows);
  assert.equal(vm.rails.cash, "ALL_IN");

  const exact = live({
    spotAsOf: new Date(Date.parse(OPENED) - 26 * HOUR_MS).toISOString(),
    stale: false,
  });
  const freshByRule = compose(friday, exact, sample, OPENED);
  assert.equal(freshByRule.now.stale, false);
  assert.equal(freshByRule.now.staleNote, null);
  assert.equal(freshByRule.cash.word, "All in");

  const flagged = live({ stale: true });
  const forced = compose(friday, flagged, blank, OPENED);
  assert.equal(forced.now.stale, true);
  assert.equal(
    forced.now.staleNote,
    "The latest print is from 26 Sep 2026. Levels may be out of date.",
  );
  assert.equal(forced.cash.word, "All in");
  assert.equal(forced.rails.cash, "ALL_IN");
});

test("a missing close with a previous Friday says no call and suffixes context", () => {
  const source = friday.context.map((reading) => ({ ...reading }));
  const withPrevious: FridayDocument = {
    ...friday,
    previousOfficial: {
      closeDate: "2026-09-18",
      closeLabel: "Fri 18 Sep 2026",
      context: source,
    },
  };
  const missing = live({ missingClose: true, officialCloseDate: "2026-10-02" });
  const vm = compose(withPrevious, missing, sample, OPENED);

  assert.equal(vm.cash.word, "No call");
  assert.equal(vm.cash.tone, "neutral");
  assert.equal(vm.cash.posture, "NO_CALL");
  assert.deepEqual(vm.cash.sentences, [
    "The Friday 2 Oct 2026 close is missing. There is no official call until it arrives.",
  ]);
  assert.equal(vm.cash.sentences[0]?.includes("$100,000"), false);
  assert.deepEqual(vm.cash.recordRows, []);
  assert.equal(vm.rails.cash, null);
  assert.equal("window" in vm.cash, false);
  assert.equal(vm.countdown, null);
  assert.equal(vm.coins.word, "Hold");
  assert.deepEqual(vm.coins.sentences, ["Coins already held stay held."]);
  assert.equal(vm.rails.coins, "HOLD");
  assert.equal(vm.context.length, source.length);
  assert.equal(vm.context[0]?.value, "Fired 18 Sep 2026. Open. (from Fri 18 Sep 2026)");
  assert.equal(vm.context[0]?.value.includes("Fri Fri"), false);
  assert.equal(vm.context[0]?.note, source[0]?.note);
  for (const reading of vm.context) {
    assert.equal(reading.value.endsWith(" (from Fri 18 Sep 2026)"), true);
  }
  assert.equal(source[0]?.value, "Fired 18 Sep 2026. Open.");
  assert.equal(friday.cash.word, "All in");
  assert.equal(friday.previousOfficial, null);

  const bareLabel: FridayDocument = {
    ...friday,
    previousOfficial: {
      closeDate: "2026-09-18",
      closeLabel: "18 Sep 2026",
      context: [source[0]!],
    },
  };
  const bare = compose(bareLabel, missing, blank, OPENED);
  assert.equal(bare.context[0]?.value, "Fired 18 Sep 2026. Open. (from Fri 18 Sep 2026)");
});

test("a missing close with no previous Friday does not invent a call", () => {
  const missing = live({ missingClose: true });
  const vm = compose(friday, missing, blank, OPENED);
  assert.equal(friday.previousOfficial, null);
  assert.equal(vm.cash.word, "No call");
  assert.equal(vm.cash.posture, "NO_CALL");
  assert.deepEqual(vm.cash.recordRows, []);
  assert.equal(vm.rails.cash, null);
  assert.deepEqual(vm.context, []);
  assert.equal(vm.coins.word, "Hold");
  assert.equal(vm.coins.sentences[0], "Coins already held stay held.");
  assert.deepEqual(vm.cash.sentences, [
    "The Friday 25 Sep 2026 close is missing. There is no official call until it arrives.",
  ]);
});

test("a developing sentence does not change the cash posture", () => {
  const sentence = "Developing: z-score would cross above zero. Not an official fire.";
  const vm = compose(friday, live({ developing: sentence }), sample, OPENED);
  assert.equal(vm.now.developing, sentence);
  assert.equal(vm.cash.posture, "ALL_IN");
  assert.equal(vm.cash.word, "All in");
  assert.equal(vm.rails.cash, "ALL_IN");
  assert.deepEqual(vm.cash.recordRows, friday.cash.recordRows);
});

test("countdown is whole days, closes today, then drops the window", () => {
  const today = compose(friday, later, blank, "2026-10-02T15:00:00.000Z");
  assert.equal(today.countdown, "Closes today");
  assert.equal(today.cash.window?.lastGraceCloseUtc, friday.cash.window?.lastGraceCloseUtc);
  assert.equal(today.cash.word, "All in");

  const oneDay = compose(friday, later, blank, "2026-10-02T00:00:00.000Z");
  assert.equal(oneDay.countdown, "1 day left");

  const atClose = compose(friday, later, sample, "2026-10-03T00:00:00.000Z");
  assert.equal(atClose.countdown, null);
  assert.equal("window" in atClose.cash, false);
  assert.equal(atClose.cash.word, "All in");
  assert.deepEqual(atClose.cash.recordRows, friday.cash.recordRows);
  assert.equal(atClose.rails.cash, "ALL_IN");
  assert.equal(friday.cash.window?.lastGraceCloseUtc, "2026-10-03T00:00:00Z");

  const after = compose(friday, later, blank, "2026-10-03T00:00:01.000Z");
  assert.equal(after.countdown, null);
  assert.equal("window" in after.cash, false);
  assert.equal(after.cash.word, "All in");
});

test("exit replaces the cash word and a later spot stays on the chart", () => {
  const exiting: HolderSettings = {
    ...blank,
    thesisBroken: true,
    thesisDate: "2026-09-26",
  };
  const vm = compose(friday, later, exiting, OPENED);
  assert.equal(vm.cash.word, "No new buy");
  assert.equal(vm.cash.posture, "NO_NEW_BUY");
  assert.equal(vm.rails.cash, null);
  assert.equal(vm.rails.coins, "EXIT");
  assert.equal(vm.coins.word, "Exit");
  assert.equal(vm.coins.declarationDateLabel, "26 Sep 2026");
  assert.equal(vm.now.spotUsd, 90000);
  assert.equal(vm.chart.spot.value, 90000);
  assert.equal(vm.countdown, null);
  assert.equal(friday.cash.word, "All in");
});
