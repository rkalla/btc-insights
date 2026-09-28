import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { parseHTML } from "linkedom";
import { applyOverlay, type FridayStateOverlay } from "../src/compose/plain.ts";
import { compose } from "../src/compose/view-model.ts";
import type { CashPosture, DashboardVM, FridayDocument, LiveSlice, Tone } from "../src/contract/types.ts";
import { BANNED_THIS_WEEK } from "../src/copy/thisWeek.ts";
import { paintDashboard } from "../src/painter/dashboard.ts";
import { paintSettings } from "../src/painter/settings.ts";
import { parseSettings } from "../src/settings/store.ts";

const OPENED = "2026-09-26T15:00:00.000Z";

interface PaintEl {
  textContent: string | null;
  getAttribute(name: string): string | null;
  parentElement: PaintEl | null;
}

interface PaintDoc {
  querySelector(selector: string): PaintEl | null;
  querySelectorAll(selector: string): ArrayLike<PaintEl>;
  getElementById(id: string): PaintEl | null;
}

function readText(name: string): string {
  return readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
}

function parse(html: string): PaintDoc {
  const parsed = parseHTML(html) as { document: PaintDoc };
  return parsed.document;
}

function texts(document: PaintDoc, selector: string): string[] {
  const list = document.querySelectorAll(selector);
  const out: string[] = [];
  for (let i = 0; i < list.length; i += 1) {
    out.push(list[i]?.textContent ?? "");
  }
  return out;
}

function exactTextCount(document: PaintDoc, text: string): number {
  const list = document.querySelectorAll("*");
  let count = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i]?.textContent?.trim() === text) {
      count += 1;
    }
  }
  return count;
}

const friday = JSON.parse(readText("friday-2026-09-25.json")) as FridayDocument;
const later = JSON.parse(readText("live-later.json")) as LiveSlice;
const sample = parseSettings(readText("settings-sample.json"));
const blank = parseSettings(readText("settings-blank.json"));

const sampleVm = compose(friday, later, sample, OPENED);
const blankVm = compose(friday, later, blank, OPENED);

const OPEN_BANNED = new RegExp(`\\b(?:${BANNED_THIS_WEEK.join("|")})\\b`, "i");
const LATE_OPENED = "2026-09-27T21:14:00.000Z";
const official = JSON.parse(readText("live-2026-09-25.json")) as LiveSlice;

function openText(html: string): string {
  const withoutDetails = html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");
  const withoutGlossary = withoutDetails.replace(/<section\b[^>]*\bid="glossary"[\s\S]*?<\/section>/i, "");
  return withoutGlossary.replace(/<[^>]+>/g, " ");
}

function assertPlain(html: string, label: string): void {
  const open = openText(html);
  const hit = open.match(OPEN_BANNED);
  assert.equal(hit, null, `${label}: ${hit?.[0] ?? ""}`);
  assert.equal(html.includes("{"), false, label);
  assert.equal(html.includes("undefined"), false, label);
  assert.equal(parse(html).querySelectorAll("h1").length, 1, label);
}

test("sample settings paint the plain evidence page", () => {
  const html = paintDashboard(sampleVm);
  const document = parse(html);
  assertPlain(html, "sample");

  assert.equal(document.querySelector("h1")?.textContent, "Why this week says Buy strongly");
  assert.equal(document.querySelector(".lede p")?.textContent, "Here's the reasoning behind this week's advice, in plain words. Tap Show the numbers under any section for the exact figures.");
  assert.equal(document.querySelector(".lede a")?.getAttribute("href"), "/");
  assert.equal(document.querySelector("a.brand")?.textContent, "BTC Friday");
  assert.equal(document.querySelector("header.site a[aria-current='page']")?.textContent, "Evidence");
  assert.equal(document.querySelector("header.site a[aria-current='page']")?.getAttribute("href"), "/evidence/");
  assert.equal(document.querySelector(".clock-line"), null);
  assert.equal(document.querySelector(".window"), null);
  assert.equal(document.querySelector(".chips"), null);
  assert.equal(document.querySelector("h2.posture"), null);
  assert.equal(html.includes("Selected marker"), false);
  assert.equal(html.includes("Use your cash available to invest"), false);
  assert.equal(html.includes("Standing contribution continues."), false);
  assert.equal(html.includes("Rule: All in"), false);
  assert.equal(openText(html).includes("Wilson"), false);
  assert.equal(html.includes("Wilson"), true);
  assert.equal(openText(html).includes("all 4 times"), true);
  assert.equal(openText(html).includes("4 of 4"), false);
  assert.equal(html.includes("99% or more"), true);
  assert.equal(html.includes("Missed 2019\u201320 and 2025\u201326"), true);
  assert.equal(html.includes("stayed off before those drops"), false);
  assert.equal(document.querySelector(".show-fires")?.textContent, "Show past signals");
  assert.equal(document.querySelector("#glossary-title")?.textContent, "What the terms mean");
  assert.equal(document.querySelector("#glossary a.term"), null);
  assert.equal(html.indexOf('id="glossary"') < html.indexOf("<footer"), true);
  assert.equal(document.querySelector("details.cycles")?.getAttribute("open"), null);
  assert.equal(document.querySelector("#cyc-title")?.textContent, "How early each signal was");
  assert.equal(document.querySelector(".cycles .name")?.textContent, "Buy strongly signal");
  assert.equal(html.includes("Add each week"), true);
  assert.equal(html.includes("Add at once"), true);
  assert.equal(html.includes(">Build<"), false);
  assert.equal(html.includes(">Lump in<"), false);
  const summaries = texts(document, "details.numbers summary").map((item) => item.replace(/\s+/g, " ").trim());
  assert.equal(summaries.length > 0, true);
  for (const summary of summaries) {
    assert.equal(summary.startsWith("Show the numbers for "), true, summary);
  }
  assert.deepEqual(texts(document, "table.history th"), ["Year", "Price", "A year later"]);
  assert.equal(html.includes("Drawdown"), false);
  assert.equal(html.includes(">Spread<"), false);
  assert.equal(texts(document, "table.history td").includes("$289"), true);
  assert.equal(texts(document, "table.history td").includes("$80,944"), true);
  assert.equal(texts(document, "table.history td").includes("+127%"), true);
  assert.equal(texts(document, "table.history td").includes("In progress"), true);
  assert.equal(document.querySelector(".cautious")?.textContent?.includes("6 times in 10 or better"), true);
  assert.equal(document.querySelector(".record dd.lead")?.textContent, "4 of 4. Floor about 60% (Wilson 90%). 4 episodes.");
  assert.equal(document.querySelector(".record dd.status")?.textContent, "This fire is open. Not high confidence.");
  assert.equal(document.querySelector(".holder a")?.getAttribute("href"), "/settings.html");
  assert.equal(document.querySelector(".holder")?.textContent?.includes("Keep any Bitcoin you already own"), true);
  assert.equal(openText(html).includes("Trim off"), false);
  assert.equal(openText(html).includes("Exit off"), false);
  assert.deepEqual(texts(document, "ul.legend li"), [
    "Bitcoin price (Friday closes)",
    "Long-run trend",
    "20% below trend",
    "55% above trend",
    "200-week average",
    "Buy signal",
    "Caution signal",
  ]);
  assert.equal(document.querySelector(".disagreement"), null);
  assert.equal(exactTextCount(document, "High confidence"), 0);
  assert.equal(document.querySelector("a.term[href='#buy-cross']") != null, true);
  assert.equal(/long-run trend/i.test(document.querySelector("a.term[href='#long-run-trend']")?.textContent ?? ""), true);
  assert.equal(document.querySelector("#cycle-capture"), null);
  assert.equal(document.querySelector("#rule-names"), null);
  assert.equal(document.querySelectorAll("#chart-alt").length, 1);
  assert.equal(document.querySelector("a[aria-label='Settings']")?.getAttribute("href"), "/settings.html");
  assert.equal(
    document.querySelector("footer.foot")?.textContent?.includes("BTC Friday is research, not personal financial advice."),
    true,
  );
  assert.equal(document.querySelector("footer.foot a.repo")?.getAttribute("href"), "https://github.com/rkalla/btc-insights");
  assert.equal(texts(document, ".watched li").join(" "), "Hash-rate collapse signature break with no migration prohibition across major markets");
  assert.equal(openText(html).includes("trigger"), false);

  const icons = document.querySelectorAll("svg");
  for (let i = 0; i < icons.length; i += 1) {
    const svg = icons[i];
    if (svg?.getAttribute("role") === "img") continue;
    assert.equal(svg?.getAttribute("aria-hidden"), "true");
  }
});

test("blank settings do not invent a dollar amount or the cash instruction", () => {
  const html = paintDashboard(blankVm);
  const document = parse(html);
  assertPlain(html, "blank");
  assert.equal(document.querySelector("h1")?.textContent, "Why this week says Buy strongly");
  assert.equal(html.includes("Use your cash available to invest."), false);
  assert.equal(html.includes("$100,000"), false);
  assert.equal(document.querySelector(".holder")?.textContent?.includes("Settings"), true);
});

test("each cash posture paints its own step and not the all-in record", () => {
  const cases: { posture: CashPosture; step: string; tone: Tone; record: string; banned: string }[] = [
    {
      posture: "ALL_IN",
      step: "Buy strongly",
      tone: "buy",
      record: "all 4 times",
      banned: "7 of 8",
    },
    {
      posture: "BUILD",
      step: "Add",
      tone: "buy",
      record: "79% of 91 weeks",
      banned: "all 4 times",
    },
    {
      posture: "STAND_DOWN",
      step: "Pause",
      tone: "sell",
      record: "7 of 8",
      banned: "all 4 times",
    },
    {
      posture: "LUMP_IN",
      step: "Add",
      tone: "buy",
      record: "all 6 finished stretches",
      banned: "all 4 times",
    },
    {
      posture: "SLOW_IN",
      step: "Go slow",
      tone: "buy",
      record: "2 of 3 times",
      banned: "all 4 times",
    },
    {
      posture: "STAY",
      step: "Steady",
      tone: "neutral",
      record: "None needed",
      banned: "all 4 times",
    },
  ];

  for (const item of cases) {
    const vm: DashboardVM = item.posture === "ALL_IN"
      ? sampleVm
      : {
          ...sampleVm,
          rails: { cash: item.posture, coins: sampleVm.rails.coins },
          countdown: null,
          cash: {
            posture: item.posture,
            word: item.posture,
            tone: item.tone,
            sentences: ["Use your cash available to invest.", "Standing contribution continues."],
            recordRows: [{ key: "RECORD", text: "4 of 4. Floor about 60% (Wilson 90%). 4 episodes." }],
            highConfidence: false,
          },
        };
    const html = paintDashboard(vm);
    const open = openText(html);
    assertPlain(html, item.posture);
    assert.equal(parse(html).querySelector("h1")?.textContent, `Why this week says ${item.step}`, item.posture);
    assert.equal(open.includes(item.record), true, item.posture);
    assert.equal(open.includes(item.banned), false, item.posture);
    assert.equal(open.includes("Use your cash available to invest"), false, item.posture);
    assert.equal(open.includes("Wilson"), false, item.posture);
    if (item.posture !== "ALL_IN") {
      assert.equal(open.includes("On Sep 18"), false, item.posture);
      assert.equal(open.includes("our strongest buy signal"), false, item.posture);
      assert.equal(html.includes("4 of 4"), false, item.posture);
      assert.equal(html.includes("Wilson"), false, item.posture);
    }
    if (item.posture === "SLOW_IN") {
      assert.equal(open.includes("more than 55% above"), false, item.posture);
    }
    if (item.posture === "BUILD") {
      assert.equal(open.includes("average holder paid"), false, item.posture);
    }
    if (item.posture === "STAND_DOWN") {
      assert.equal(open.includes("caution signal turned on"), false, item.posture);
    }
    if (item.posture === "STAY") {
      assert.equal(open.includes("within its normal range"), false, item.posture);
    }
  }
});

test("exit and a missing close do not reuse the all-in story", () => {
  const exitVm: DashboardVM = {
    ...sampleVm,
    rails: { cash: null, coins: "EXIT" },
    countdown: null,
    cash: {
      posture: "NO_NEW_BUY",
      word: "No new buy",
      tone: "neutral",
      sentences: ["No new buy."],
      recordRows: [{ key: "RECORD", text: "No floor." }],
      highConfidence: false,
    },
    coins: {
      ...sampleVm.coins,
      posture: "EXIT",
      word: "Exit",
      tone: "sell",
      sentences: ["Sell all.", "No floor."],
      offChips: [],
      taxLine: "A sale can create a tax bill. Rate not computed.",
      declarationDateLabel: "26 Sep 2026",
    },
  };
  const exitHtml = paintDashboard(exitVm);
  const exitDoc = parse(exitHtml);
  assertPlain(exitHtml, "exit");
  assert.equal(exitDoc.querySelector("h1")?.textContent, "Why this week says Pause");
  assert.equal(exitDoc.querySelector(".chips"), null);
  assert.equal(exitDoc.querySelector("h2.posture-sm"), null);
  assert.equal(openText(exitHtml).includes("No floor"), false);
  assert.equal(exitDoc.querySelector(".holder")?.textContent?.includes("26 Sep 2026"), true);
  assert.equal(exitDoc.querySelector(".holder")?.textContent?.includes("tax bill"), true);
  assert.equal(openText(exitHtml).includes("all 4 times"), false);
  assert.equal(openText(exitHtml).includes("7 of 8"), false);

  const noCall: DashboardVM = {
    ...sampleVm,
    rails: { cash: null, coins: "HOLD" },
    missingClose: true,
    outOfDate: true,
    countdown: null,
    cash: {
      posture: "NO_CALL",
      word: "No call",
      tone: "neutral",
      sentences: ["The Friday 2 Oct 2026 close is missing. There is no official call until it arrives."],
      recordRows: [],
      highConfidence: false,
    },
    context: [],
  };
  const noCallHtml = paintDashboard(noCall);
  const noCallDoc = parse(noCallHtml);
  assertPlain(noCallHtml, "no-call");
  assert.equal(noCallDoc.querySelector("h1")?.textContent, "Why this week says No update");
  assert.equal(noCallDoc.querySelector("#signal-h")?.textContent, "No signal turned on");
  assert.equal(openText(noCallHtml).includes("didn't arrive"), true);
  assert.equal(openText(noCallHtml).includes("all 4 times"), false);
  assert.equal(openText(noCallHtml).includes("On Sep 18"), false);
});

test("disagreement and caveats stay in the numbers and are omitted when absent", () => {
  const text = "Sell roll is also in its pause. All in still wins. The week is not cut in half.";
  const shown = paintDashboard({ ...sampleVm, disagreement: text });
  assert.equal(parse(shown).querySelector(".disagreement")?.textContent?.includes(text), true);
  assert.equal(openText(shown).includes("Sell roll"), false);
  assertPlain(shown, "disagreement");

  const hidden = paintDashboard({ ...sampleVm, disagreement: null, caveats: [] });
  assert.equal(parse(hidden).querySelector(".disagreement"), null);
  assert.equal(hidden.includes("At Friday's close (25 Sep 2026)"), false);
  assert.equal(paintDashboard(sampleVm).includes("At Friday's close (25 Sep 2026)"), true);
  assert.equal(paintDashboard(sampleVm).includes("The 200-week average is a map line. It does not time a buy."), true);
});

test("a true high-confidence flag does not add a separate High confidence element", () => {
  const vm: DashboardVM = {
    ...sampleVm,
    cash: {
      ...sampleVm.cash,
      highConfidence: true,
      recordRows: sampleVm.cash.recordRows.map((row) => ({ key: row.key, text: row.text })),
    },
  };
  const html = paintDashboard(vm);
  const document = parse(html);
  assert.equal(exactTextCount(document, "High confidence"), 0);
  assert.equal(document.querySelector(".record dd.status")?.textContent, "This fire is open. Not high confidence.");
  assert.equal(openText(html).includes("This fire is open"), false);
});

test("every fixture state paints one plain heading", () => {
  const names = readdirSync(new URL("../fixtures/states/", import.meta.url))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const steps: Record<string, string> = {
    "build.json": "Add",
    "lump-in.json": "Add",
    "no-call.json": "No update",
    "slow-in.json": "Go slow",
    "stale.json": "Buy strongly",
    "stand-down.json": "Pause",
    "stay.json": "Steady",
  };
  for (const name of names) {
    const patch = JSON.parse(readText(`states/${name}`)) as FridayStateOverlay;
    const vm = compose(applyOverlay(friday, patch), official, blank, LATE_OPENED);
    const html = paintDashboard(vm);
    const open = openText(html);
    assertPlain(html, name);
    assert.equal(parse(html).querySelector("h1")?.textContent, `Why this week says ${steps[name]}`, name);
    assert.equal(open.includes("On Sep 18"), false, name);
    assert.equal(open.includes("our strongest buy signal"), false, name);
    assert.equal(open.includes("all 4 times"), false, name);
    if (name === "stand-down.json") {
      assert.equal(open.includes("On Mar 6"), false, name);
      assert.equal(open.includes("caution signal turned on"), false, name);
      assert.equal(open.includes("7 of 8"), true, name);
      assert.equal(open.includes("Quiet") || html.includes("Quiet"), true, name);
    }
    if (name === "stale.json") {
      assert.equal(open.includes("hasn't updated since"), true, name);
      assert.equal(open.includes("41%"), false, name);
      assert.equal(html.includes("4 of 4"), false, name);
      assert.equal(html.includes("Wilson"), false, name);
    }
    if (name === "build.json") {
      assert.equal(open.includes("average holder paid"), false, name);
      assert.equal(open.includes("41%"), false, name);
    }
    if (name === "slow-in.json") {
      assert.equal(open.includes("more than 55% above"), false, name);
    }
    if (name === "stay.json") {
      assert.equal(open.includes("within its normal range"), false, name);
    }
    if (name === "no-call.json") {
      assert.equal(open.includes("didn't arrive"), true, name);
      assert.equal(open.includes("41%"), false, name);
    }
  }
});

test("other postures keep their own record rows out of the open page", () => {
  const lump: DashboardVM = {
    ...sampleVm,
    cash: {
      ...sampleVm.cash,
      posture: "LUMP_IN",
      recordRows: [
        { key: "RECORD", text: "6 of 6 finished regimes. Floor 69%." },
        { key: "STATUS", text: "One regime open since November 2025." },
      ],
    },
  };
  const lumpHtml = paintDashboard(lump);
  assert.equal(parse(lumpHtml).querySelector(".record")?.textContent?.includes("Floor 69%"), true);
  assert.equal(openText(lumpHtml).includes("Floor 69%"), false);
  assert.equal(lumpHtml.includes("4 of 4"), false);

  const slow: DashboardVM = {
    ...sampleVm,
    cash: {
      ...sampleVm.cash,
      posture: "SLOW_IN",
      recordRows: [
        { key: "RECORD", text: "2 of 3 regimes. Floor 25%." },
        { key: "STATUS", text: "Weakest record on the page." },
      ],
    },
  };
  const slowHtml = paintDashboard(slow);
  assert.equal(parse(slowHtml).querySelector(".record")?.textContent?.includes("Floor 25%"), true);
  assert.equal(openText(slowHtml).includes("Floor 25%"), false);
  assert.equal(openText(slowHtml).includes("more than 55% above"), false);

  const late = paintDashboard({ ...sampleVm, outOfDate: true });
  assert.equal(late.includes("4 of 4"), false);
  assert.equal(late.includes("Wilson"), false);
  assert.equal(openText(late).includes("all 4 times"), false);
});

test("caution signals is not split into a glossary link", () => {
  const steady: DashboardVM = {
    ...sampleVm,
    now: { ...sampleVm.now, gapPct: -0.08, isOfficialClose: true },
    caveats: sampleVm.caveats.filter((caveat) => caveat.kind !== "fit"),
    context: sampleVm.context.map((reading) =>
      reading.key === "buyCross" ? { ...reading, flag: "QUIET", value: "Not on." } : reading,
    ),
    cash: {
      ...sampleVm.cash,
      posture: "STAY",
      recordRows: [{ key: "RECORD", text: "No event record." }],
    },
  };
  const html = paintDashboard(steady);
  assert.equal(html.includes("within its normal range"), true);
  assert.equal(html.includes("caution signals"), true);
  assert.equal(html.includes("signal</a>s"), false);
});

test("settings is a blank sheet with the reference fields", () => {
  const html = paintSettings();
  const document = parse(html);
  const ids = [
    "standing-amount",
    "every-week",
    "every-month",
    "build-amount",
    "cash-amount",
    "coins-held",
    "net-worth",
    "target-share",
    "ceiling-share",
    "thesis-date",
    "acct-taxable",
    "acct-ira",
    "acct-fund",
  ];
  for (const id of ids) {
    assert.equal(document.getElementById(id) != null, true, id);
  }
  for (const id of ["standing-amount", "build-amount", "cash-amount", "coins-held", "net-worth", "target-share", "ceiling-share"]) {
    const field = document.getElementById(id);
    assert.equal(field?.getAttribute("placeholder"), "Not set", id);
    assert.equal(field?.getAttribute("value"), null, id);
  }
  assert.equal(html.includes("max-width:760px"), false);
  assert.equal(html.includes("Not set"), true);
  assert.equal(html.includes("about $5,000"), false);
  assert.equal(html.includes("about $100,000"), false);
  assert.equal(html.includes("Shape, if you have not chosen"), false);
  assert.deepEqual(texts(document, "h2"), [
    "Regular buy",
    "Extra for cheap stretches",
    "Money set aside for Bitcoin",
    "Take profits",
    "I've decided Bitcoin's long-term case is broken",
    "Where you hold it",
  ]);
  assert.equal(document.getElementById("every-label")?.textContent, "How often");
  assert.equal(document.querySelector("label[for='coins-held']")?.textContent, "Bitcoin you own");
  assert.equal(document.querySelector("label[for='net-worth']")?.textContent, "All your investments, including Bitcoin");
  assert.equal(document.querySelector("label[for='target-share']")?.textContent, "Target share of your investments");
  assert.equal(document.querySelector("label[for='ceiling-share']")?.textContent, "Upper limit");
  assert.equal(document.getElementById("thesis-state")?.textContent, "Off");
  assert.equal(document.querySelector("label[for='thesis-date']")?.textContent, "The date you decided");
  assert.equal(html.includes("Not declared"), false);
  assert.equal(html.includes("Coins held"), false);
  assert.equal(html.includes("Investable net worth"), false);
  assert.equal(html.includes("Ceiling share"), false);
  assert.equal(html.includes(">Every<"), false);
  assert.equal(html.includes(">Date<"), false);
  assert.equal(html.includes(">Account<"), false);
  assert.deepEqual(texts(document, ".help"), [
    "The amount you put into Bitcoin on a schedule, whatever the market does.",
    "Money you'd add a little at a time, each week, while Bitcoin trades below what the average holder paid.",
    "Money you'd put in when This week says Buy strongly or Add, or spread out when it says Go slow.",
    "Tell us what you hold, and This week will say when Bitcoin has grown too big a part of your investments. Leave any field blank to turn this off.",
    "Turn this on only if you've decided to get out of Bitcoin for good. This week will then tell you to sell and stop buying. You can turn it off at any time.",
    "BTC Friday doesn't calculate taxes. This only decides whether tax reminders appear.",
  ]);
  assert.equal(document.querySelector("label[for='acct-taxable']")?.textContent, "A regular (taxable) account");
  assert.equal(document.querySelector("label[for='acct-ira']")?.textContent, "A retirement account (IRA)");
  assert.equal(document.querySelector("label[for='acct-fund']")?.textContent, "A fund");
  assert.equal(document.getElementById("ceiling-rule")?.textContent, "Must be above your target.");
  assert.equal(
    document.querySelector(".intro")?.textContent,
    "These amounts personalise This week. They stay on this device and are never sent anywhere. BTC Friday never places orders.",
  );
  assert.equal(html.includes("Save settings"), true);
  assert.equal(html.includes("Cancel"), true);
  assert.equal(/tax rate/i.test(html), false);
  assert.equal(document.getElementById("tax-rate"), null);
  assert.equal(document.querySelector("[role='switch']")?.getAttribute("aria-checked"), "false");
  assert.equal(document.querySelector("[role='switch']")?.getAttribute("aria-labelledby"), "h-thesis");
  assert.equal(document.getElementById("thesis-date")?.getAttribute("disabled"), "");
  assert.equal(document.querySelector("svg")?.getAttribute("aria-hidden"), "true");
  assert.equal(document.querySelector("a.back"), null);
  assert.equal(html.includes("Back to This week"), false);
  assert.equal(html.includes("Back to dashboard"), false);
  assert.equal(document.querySelector("a.gear")?.getAttribute("aria-current"), "page");
  assert.equal(document.querySelector("a.gear")?.getAttribute("href"), "/settings.html");
  assert.equal(document.querySelector("footer.foot a.repo")?.getAttribute("href"), "https://github.com/rkalla/btc-insights");
  assert.equal(document.querySelector("footer.foot a.repo span")?.textContent, "GitHub");
  assert.equal(document.querySelector("a.btn")?.getAttribute("href"), "index.html");
  assert.equal(document.querySelector("a.btn")?.textContent, "Cancel");
});
