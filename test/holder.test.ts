import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { FridayDocument, HolderSettings } from "../src/contract/types.ts";
import { applyHolder } from "../src/settings/holder.ts";
import {
  SETTINGS_KEY,
  blankSettings,
  loadSettings,
  parseSettings,
  saveSettings,
  type SettingsStorage,
} from "../src/settings/store.ts";
import { validateSettings } from "../src/settings/validate.ts";

function readText(name: string): string {
  return readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
}

const friday = JSON.parse(readText("friday-2026-09-25.json")) as FridayDocument;
const sampleText = readText("settings-sample.json");

function settings(patch: Partial<HolderSettings> = {}): HolderSettings {
  return { ...blankSettings(), ...patch };
}

function memory(): SettingsStorage & { raw(key: string): string | null } {
  const items = new Map<string, string>();
  return {
    getItem(key: string) {
      return items.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      items.set(key, value);
    },
    raw(key: string) {
      return items.get(key) ?? null;
    },
  };
}

const trimReady = {
  coinsHeld: 1,
  netWorth: 100000,
  targetShare: 10,
  ceilingShare: 50,
};

test("blank settings parse to empty amounts", () => {
  assert.equal(SETTINGS_KEY, "btc-insights.settings.v1");
  assert.deepEqual(blankSettings(), {
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
  assert.deepEqual(parseSettings(null), blankSettings());
  assert.deepEqual(parseSettings(""), blankSettings());
  assert.deepEqual(parseSettings("{}"), blankSettings());
  assert.deepEqual(parseSettings(readText("settings-blank.json")), blankSettings());
  assert.deepEqual(validateSettings(blankSettings()), []);
});

test("corrupt JSON parses as blank settings", () => {
  for (const raw of ["{", "not json", "null", "[]", "12", "\"x\"", "   "]) {
    assert.deepEqual(parseSettings(raw), blankSettings(), raw);
  }
  const parsed = parseSettings(
    '{"cashAvailable":"100000","coinsHeld":1,"thesisBroken":1,"account":"roth","standingEvery":"year","thesisDate":20260926,"extra":true}',
  );
  assert.equal(parsed.cashAvailable, null);
  assert.equal(parsed.coinsHeld, 1);
  assert.equal(parsed.thesisBroken, false);
  assert.equal(parsed.account, null);
  assert.equal(parsed.standingEvery, null);
  assert.equal(parsed.thesisDate, null);
  assert.equal("extra" in parsed, false);

  const kept = parseSettings(
    '{"cashAvailable":100000,"standingEvery":"week","account":"fund","thesisBroken":false,"nope":1}',
  );
  assert.equal(kept.cashAvailable, 100000);
  assert.equal(kept.standingEvery, "week");
  assert.equal(kept.account, "fund");
  assert.equal(kept.standingAmount, null);
  assert.equal("nope" in kept, false);

  assert.equal(parseSettings('{"netWorth":-5}').netWorth, -5);
});

test("sample cash available appends the 100000 clause", () => {
  const before = friday.cash.sentences[0];
  const result = applyHolder(friday, parseSettings(sampleText), 84413);
  assert.equal(
    result.cash.sentences[0],
    "Buy now, or by the Friday 2 Oct 2026 close. Up to $100,000.",
  );
  assert.equal(result.cash.sentences[1], "After that close, the call is whatever that Friday says.");
  assert.equal(result.cash.sentences[2], "Standing contribution continues.");
  assert.equal(result.cash.word, "All in");
  assert.equal(result.coins.word, "Hold");
  assert.deepEqual(result.coins.sentences, ["Coins already held stay held."]);
  assert.deepEqual(result.coins.offChips, [
    "Trim off · ceiling not set",
    "Exit off · thesis not declared",
  ]);
  assert.equal(result.rails.cash, "ALL_IN");
  assert.equal(result.rails.coins, "HOLD");
  assert.equal(friday.cash.sentences[0], before);
  assert.equal(friday.cash.sentences[0]?.includes("100,000"), false);
});

test("blank cash available names the pile", () => {
  const result = applyHolder(friday, blankSettings(), 84413);
  assert.equal(
    result.cash.sentences[0],
    "Buy now, or by the Friday 2 Oct 2026 close. Use your cash available to invest.",
  );
  assert.equal(result.cash.sentences.join(" ").includes("100,000"), false);
  assert.equal(result.cash.sentences.join(" ").includes("100000"), false);
});

test("a null dollar slot does not add a dollar", () => {
  const quiet: FridayDocument = { ...friday, dollarSlot: null };
  const result = applyHolder(quiet, settings({ cashAvailable: 100000 }), 84413);
  assert.deepEqual(result.cash.sentences, friday.cash.sentences);
  assert.equal(result.cash.sentences.join(" ").includes("100,000"), false);
  assert.equal(result.cash.sentences.join(" ").includes("cash available"), false);
});

test("partial Trim stays off", () => {
  const partial = settings({ coinsHeld: 1.5, targetShare: 20, ceilingShare: 40 });
  assert.deepEqual(validateSettings(partial), []);
  const named = applyHolder(friday, partial, 84413);
  assert.equal(named.coins.posture, "HOLD");
  assert.equal(named.coins.word, "Hold");
  assert.equal(named.coins.offChips[0], "Trim off · net worth not set");
  assert.equal(named.rails.coins, "HOLD");

  const ceilingBlank = applyHolder(
    friday,
    settings({ coinsHeld: 1.5, netWorth: 100000, targetShare: 20 }),
    84413,
  );
  assert.equal(ceilingBlank.coins.posture, "HOLD");
  assert.equal(ceilingBlank.coins.offChips[0], "Trim off · ceiling not set");
});

test("zero net worth stays off", () => {
  const result = applyHolder(
    friday,
    settings({ coinsHeld: 1, netWorth: 0, targetShare: 10, ceilingShare: 25 }),
    50000,
  );
  assert.equal(result.coins.posture, "HOLD");
  assert.equal(result.coins.word, "Hold");
  assert.equal(result.coins.offChips[0], "Trim off · net worth is zero");
  assert.equal(result.cash.word, "All in");
});

test("ceiling math turns Trim on", () => {
  const on = applyHolder(friday, settings(trimReady), 50000);
  assert.equal(on.coins.posture, "TRIM");
  assert.equal(on.coins.word, "Trim");
  assert.equal(on.coins.tone, "sell");
  assert.deepEqual(on.coins.sentences, [
    "Sell from the ceiling down to the target, highest-cost lots first.",
    "A sale can create a tax bill. Rate not computed.",
  ]);
  assert.equal(on.coins.taxLine, "A sale can create a tax bill. Rate not computed.");
  assert.deepEqual(on.coins.offChips, ["Exit off · thesis not declared"]);
  assert.equal(on.rails.coins, "TRIM");
  assert.equal(on.rails.cash, "ALL_IN");
  assert.equal(on.cash.word, "All in");
  assert.equal(on.cash.highConfidence, friday.cash.highConfidence);
  assert.equal(on.cash.window?.lastGraceCloseUtc, friday.cash.window?.lastGraceCloseUtc);
  assert.equal(on.coins.sentences.includes("Sped up: finish by the end of the pause."), false);

  const under = applyHolder(friday, settings({ ...trimReady, ceilingShare: 50.01 }), 50000);
  assert.equal(under.coins.posture, "HOLD");
  assert.equal(under.coins.offChips[0], "Trim off · share under the ceiling");

  const flagged: FridayDocument = {
    ...friday,
    cash: { ...friday.cash, highConfidence: true },
  };
  const kept = applyHolder(flagged, settings(trimReady), 50000);
  assert.equal(kept.coins.posture, "TRIM");
  assert.equal(kept.cash.highConfidence, true);
  assert.equal(kept.cash.window?.lastGraceCloseUtc, friday.cash.window?.lastGraceCloseUtc);

  const onePointOne = applyHolder(
    friday,
    settings({ coinsHeld: 1, netWorth: 100000, targetShare: 1, ceilingShare: 1.1 }),
    1100,
  );
  assert.equal(onePointOne.coins.posture, "TRIM");
  for (const [spot, ceiling] of [
    [66670, 66.67],
    [33340, 33.34],
    [2200, 2.2],
  ] as const) {
    const hit = applyHolder(
      friday,
      settings({ coinsHeld: 1, netWorth: 100000, targetShare: 1, ceilingShare: ceiling }),
      spot,
    );
    assert.equal(hit.coins.posture, "TRIM", String(ceiling));
  }
});

test("Exit without a date stays off", () => {
  const missing = applyHolder(friday, settings({ thesisBroken: true }), 84413);
  assert.equal(missing.coins.posture, "HOLD");
  assert.equal(missing.coins.word, "Hold");
  assert.equal(missing.cash.word, "All in");
  assert.equal(missing.rails.cash, "ALL_IN");
  assert.deepEqual(missing.coins.offChips, [
    "Trim off · ceiling not set",
    "Exit off · date not set",
  ]);

  const bad = applyHolder(friday, settings({ thesisBroken: true, thesisDate: "26 Sep 2026" }), 84413);
  assert.equal(bad.coins.posture, "HOLD");
  assert.equal(bad.coins.offChips[1], "Exit off · date not set");

  const impossible = applyHolder(
    friday,
    settings({ thesisBroken: true, thesisDate: "2026-13-01" }),
    84413,
  );
  assert.equal(impossible.coins.posture, "HOLD");
  assert.equal(impossible.coins.declarationDateLabel, undefined);
  assert.equal(impossible.cash.window?.lastGraceCloseUtc, friday.cash.window?.lastGraceCloseUtc);
});

test("Exit with a date wins over Trim", () => {
  const longView = friday.longView.statement;
  const paused: FridayDocument = {
    ...friday,
    standDownPause: true,
    cash: { ...friday.cash, highConfidence: true },
  };
  const result = applyHolder(
    paused,
    settings({
      ...trimReady,
      thesisBroken: true,
      thesisDate: "2026-09-26",
      account: "taxable",
    }),
    50000,
  );
  assert.equal(result.cash.posture, "NO_NEW_BUY");
  assert.equal(result.cash.word, "No new buy");
  assert.equal(result.cash.tone, "neutral");
  assert.deepEqual(result.cash.sentences, ["No new buy."]);
  assert.deepEqual(result.cash.recordRows, [{ key: "RECORD", text: "No floor." }]);
  assert.equal(result.cash.highConfidence, false);
  assert.equal("window" in result.cash, false);
  assert.equal(friday.cash.highConfidence, false);
  assert.equal(friday.cash.window == null, false);
  assert.equal(result.rails.cash, null);
  assert.equal(result.rails.coins, "EXIT");
  assert.equal(result.coins.posture, "EXIT");
  assert.equal(result.coins.word, "Exit");
  assert.equal(result.coins.tone, "sell");
  assert.deepEqual(result.coins.sentences, ["Sell all.", "No floor."]);
  assert.deepEqual(result.coins.offChips, []);
  assert.equal(result.coins.declarationDateLabel, "26 Sep 2026");
  assert.equal(result.coins.taxLine, "A sale can create a tax bill. Rate not computed.");
  assert.equal(result.coins.sentences.includes("Sped up: finish by the end of the pause."), false);
  assert.equal(result.coins.sentences.includes("Sell from the ceiling"), false);
  assert.equal(friday.longView.statement, longView);
  assert.equal(friday.cash.word, "All in");
});

test("sped-up sentence when standDownPause is true", () => {
  const paused: FridayDocument = { ...friday, standDownPause: true };
  const result = applyHolder(paused, settings(trimReady), 50000);
  assert.equal(result.coins.word, "Trim");
  assert.deepEqual(result.coins.sentences, [
    "Sell from the ceiling down to the target, highest-cost lots first.",
    "A sale can create a tax bill. Rate not computed.",
    "Sped up: finish by the end of the pause.",
  ]);
  assert.equal(result.cash.word, "All in");

  const held = applyHolder(paused, blankSettings(), 84413);
  assert.equal(held.coins.word, "Hold");
  assert.equal(held.coins.sentences.includes("Sped up: finish by the end of the pause."), false);
});

test("IRA omits the tax bill; blank, taxable, and fund keep it", () => {
  const line = "A sale can create a tax bill. Rate not computed.";
  const sell = "Sell from the ceiling down to the target, highest-cost lots first.";
  const sped = "Sped up: finish by the end of the pause.";
  const paused: FridayDocument = { ...friday, standDownPause: true };

  for (const account of [null, "taxable", "fund"] as const) {
    const label = account ?? "blank";
    const trim = applyHolder(paused, settings({ ...trimReady, account }), 50000);
    assert.equal(trim.coins.posture, "TRIM", label);
    assert.deepEqual(trim.coins.sentences, [sell, line, sped], label);
    assert.equal(trim.coins.taxLine, line, label);

    const exited = applyHolder(
      friday,
      settings({ ...trimReady, account, thesisBroken: true, thesisDate: "2026-09-26" }),
      50000,
    );
    assert.equal(exited.coins.posture, "EXIT", label);
    assert.deepEqual(exited.coins.sentences, ["Sell all.", "No floor."], label);
    assert.equal(exited.coins.taxLine, line, label);
    assert.equal(exited.cash.word, "No new buy", label);
    assert.deepEqual(exited.cash.sentences, ["No new buy."], label);
  }

  const ira = applyHolder(paused, settings({ ...trimReady, account: "ira" }), 50000);
  assert.equal(ira.coins.posture, "TRIM");
  assert.deepEqual(ira.coins.sentences, [sell, sped]);
  assert.equal(ira.coins.taxLine, undefined);
  assert.equal(JSON.stringify(ira.coins).includes("tax bill"), false);
  assert.equal(ira.cash.word, "All in");
  assert.equal(ira.cash.sentences[0]?.endsWith("Use your cash available to invest."), true);

  const iraExit = applyHolder(
    friday,
    settings({ ...trimReady, account: "ira", thesisBroken: true, thesisDate: "2026-09-26" }),
    50000,
  );
  assert.equal(iraExit.coins.posture, "EXIT");
  assert.deepEqual(iraExit.coins.sentences, ["Sell all.", "No floor."]);
  assert.equal(iraExit.coins.taxLine, undefined);
  assert.equal(JSON.stringify(iraExit).includes("tax bill"), false);
  assert.equal(iraExit.cash.word, "No new buy");

  const under = applyHolder(
    friday,
    settings({ ...trimReady, account: "ira", ceilingShare: 50.01 }),
    50000,
  );
  assert.equal(under.coins.posture, "HOLD");
  assert.equal(under.coins.offChips[0], "Trim off · share under the ceiling");

  const dollars = applyHolder(friday, settings({ account: "ira", cashAvailable: 100000 }), 84413);
  assert.equal(
    dollars.cash.sentences[0],
    "Buy now, or by the Friday 2 Oct 2026 close. Up to $100,000.",
  );
});

test("account type round-trips and does not change a sentence", () => {
  const withIra = settings({ account: "ira", cashAvailable: 100000 });
  const without = settings({ cashAvailable: 100000 });
  const saved = applyHolder(friday, withIra, 84413);
  const plain = applyHolder(friday, without, 84413);
  assert.deepEqual(saved.cash.sentences, plain.cash.sentences);
  assert.deepEqual(saved.coins.sentences, plain.coins.sentences);
  assert.equal(saved.coins.word, plain.coins.word);
  assert.equal(saved.cash.word, plain.cash.word);

  const storage = memory();
  const extra = { ...withIra, extra: true };
  saveSettings(storage, extra);
  const raw = storage.raw(SETTINGS_KEY);
  assert.equal(raw == null, false);
  assert.equal(raw?.includes("extra"), false);
  assert.equal(raw?.includes("ira"), true);
  assert.deepEqual(loadSettings(storage), withIra);
  assert.deepEqual(parseSettings(raw), withIra);

  storage.setItem(SETTINGS_KEY, "{");
  assert.deepEqual(loadSettings(storage), blankSettings());
});

test("validateSettings accepts a partial Trim card and rejects bad fields", () => {
  assert.deepEqual(validateSettings(parseSettings(sampleText)), []);
  assert.deepEqual(validateSettings(settings({ coinsHeld: 1, ceilingShare: 40 })), []);
  assert.deepEqual(validateSettings(settings({ targetShare: 0, ceilingShare: 100 })), []);
  assert.deepEqual(validateSettings(settings({ targetShare: 10, ceilingShare: 10.01 })), []);
  assert.deepEqual(validateSettings(settings({ coinsHeld: 0.12345678 })), []);
  assert.deepEqual(validateSettings(settings({ coinsHeld: 0.00000001 })), []);
  assert.deepEqual(
    validateSettings(settings({ thesisBroken: true, thesisDate: "2026-09-26", account: "fund" })),
    [],
  );
  assert.deepEqual(validateSettings(settings({ thesisBroken: true, thesisDate: "2024-02-29" })), []);

  assert.deepEqual(validateSettings(settings({ cashAvailable: -1 })), [
    { field: "cashAvailable", message: "Enter zero or more." },
  ]);
  assert.deepEqual(validateSettings(settings({ netWorth: -5, standingAmount: -1 })), [
    { field: "standingAmount", message: "Enter zero or more." },
    { field: "netWorth", message: "Enter zero or more." },
  ]);
  assert.deepEqual(validateSettings(settings({ coinsHeld: -0.1 })), [
    { field: "coinsHeld", message: "Enter zero or more." },
  ]);
  assert.deepEqual(validateSettings(settings({ coinsHeld: 0.123456789 })), [
    { field: "coinsHeld", message: "Use at most eight decimal places." },
  ]);
  assert.deepEqual(validateSettings(settings({ coinsHeld: 0.000000001 })), [
    { field: "coinsHeld", message: "Use at most eight decimal places." },
  ]);
  assert.deepEqual(validateSettings(settings({ targetShare: 100.01 })), [
    { field: "targetShare", message: "Enter a share from 0 to 100." },
  ]);
  assert.deepEqual(validateSettings(settings({ ceilingShare: 10.123 })), [
    { field: "ceilingShare", message: "Use at most two decimal places." },
  ]);
  assert.deepEqual(validateSettings(settings({ targetShare: 40, ceilingShare: 40 })), [
    { field: "ceilingShare", message: "Must be above the target share." },
  ]);
  assert.deepEqual(validateSettings(settings({ thesisBroken: true })), [
    { field: "thesisDate", message: "Enter the declaration date." },
  ]);
  assert.deepEqual(validateSettings(settings({ thesisBroken: true, thesisDate: "2026/09/26" })), [
    { field: "thesisDate", message: "Use a YYYY-MM-DD date." },
  ]);
  assert.deepEqual(validateSettings(settings({ thesisDate: "yesterday" })), [
    { field: "thesisDate", message: "Use a YYYY-MM-DD date." },
  ]);
  assert.deepEqual(validateSettings(settings({ thesisBroken: true, thesisDate: "2026-13-01" })), [
    { field: "thesisDate", message: "Use a YYYY-MM-DD date." },
  ]);
  assert.deepEqual(validateSettings(settings({ thesisBroken: true, thesisDate: "2026-02-31" })), [
    { field: "thesisDate", message: "Use a YYYY-MM-DD date." },
  ]);
  assert.deepEqual(validateSettings(settings({ thesisBroken: true, thesisDate: "2026-02-29" })), [
    { field: "thesisDate", message: "Use a YYYY-MM-DD date." },
  ]);

  const leap = applyHolder(friday, settings({ thesisBroken: true, thesisDate: "2024-02-29" }), 84413);
  assert.equal(leap.coins.word, "Exit");
  assert.equal(leap.coins.declarationDateLabel, "29 Feb 2024");
});
