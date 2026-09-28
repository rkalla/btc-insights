import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseHTML } from "linkedom";
import { compose } from "../src/compose/view-model.ts";
import type { CashPosture, DashboardVM, FridayDocument, LiveSlice, Tone } from "../src/contract/types.ts";
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

test("sample settings paint All in, the record, and the footer", () => {
  const html = paintDashboard(sampleVm);
  const document = parse(html);

  assert.equal(document.querySelectorAll("h1").length, 1);
  assert.equal(document.querySelector("h1")?.textContent, "The evidence behind this week's advice");
  assert.equal(
    document.querySelector(".lede p")?.textContent,
    "This page shows the rules and history behind This week. It uses some technical terms, and each one is explained at the bottom.",
  );
  assert.equal(document.querySelector("a.brand")?.textContent, "BTC Friday");
  assert.equal(document.querySelector("header.site a[aria-current='page']")?.textContent, "Evidence");
  assert.equal(document.querySelector("header.site a[aria-current='page']")?.getAttribute("href"), "/evidence/");
  assert.equal(document.querySelector("h2.posture")?.textContent, "Buy strongly");
  assert.equal(document.querySelector(".cash .rule")?.textContent, "Rule: All in, from the buy cross");
  assert.equal(document.querySelector("h2.posture-sm")?.textContent, "Keep");
  assert.equal(document.querySelector(".coins .rule")?.textContent, "Rule: Hold");
  assert.equal(document.querySelector(".cash .label")?.textContent, "New money");
  assert.equal(document.querySelector(".coins .label")?.textContent, "Bitcoin you own");
  assert.equal(document.querySelector("#caveats-label")?.textContent, "Things to know");
  assert.equal(document.querySelector("#chart-title")?.textContent, "Price");
  assert.equal(document.querySelector("#context-label")?.textContent, "The readings behind the call");
  assert.equal(document.querySelector("#lv-label")?.textContent, "The long view");
  assert.equal(document.querySelector(".cycles .label")?.textContent, "How early each signal was");
  assert.equal(html.includes("01 ·"), false);
  assert.equal(document.querySelector(".spectrum"), null);
  assert.equal(
    document.querySelector(".action")?.textContent,
    "Buy now, or by the Friday 2 Oct 2026 close. Up to $100,000.",
  );
  assert.equal(html.split("Up to $100,000.").length, 2);
  assert.equal(
    document.querySelector(".record dd.lead")?.textContent,
    "4 of 4. Floor about 60% (Wilson 90%). 4 episodes.",
  );
  assert.equal(html.includes("Position on the spectrum only. Not a confidence scale."), false);
  assert.equal(
    document.querySelector("footer.foot")?.textContent?.includes("BTC Friday is research, not personal financial advice."),
    true,
  );
  assert.equal(document.querySelector("footer.foot")?.textContent?.includes("fee-only financial adviser."), true);
  assert.equal(document.querySelector("footer.foot a[href='/settings.html']")?.textContent, "Settings");
  assert.equal(document.querySelector("footer.foot a.repo")?.getAttribute("href"), "https://github.com/rkalla/btc-insights");
  assert.equal(document.querySelector("footer.foot a.repo span")?.textContent, "GitHub");
  assert.equal(document.querySelector("footer.foot a.repo svg")?.getAttribute("aria-hidden"), "true");
  assert.equal(document.querySelector("#glossary-title")?.textContent, "What the terms mean");
  assert.equal(document.querySelectorAll("#glossary dt").length, 17);
  assert.equal(document.querySelector("#glossary a.term"), null);
  assert.equal(document.querySelectorAll("a.term[href='#buy-cross']").length, 1);
  assert.equal(document.querySelector("a.term[href='#long-run-trend']")?.textContent, "Long-run trend");
  assert.equal(document.querySelector("a.term[href='#average-200w']")?.textContent, "200-week average");
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
  assert.equal(html.includes("Sell roll is also in its pause"), false);
  assert.equal(exactTextCount(document, "High confidence"), 0);
  assert.equal(html.includes("Not high confidence"), true);
  assert.equal(document.querySelector(".rail"), null);
  assert.equal(html.includes("Fri 18 Sep"), true);
  assert.equal(html.includes("last grace"), true);
  assert.equal(html.includes("6 days left"), true);
  assert.equal(
    document.querySelector(".clock-line")?.textContent,
    "Official call: Fri 25 Sep 2026 close · Next close Fri 2 Oct · Friday close is 00:00 UTC Saturday · Opened 26 Sep 2026",
  );
  assert.equal(html.includes("Next close Fri 2 Oct"), true);
  assert.equal(html.includes("Next close Fri 2 Oct 2026"), false);
  assert.equal(
    document.querySelector("#cyc-title")?.textContent,
    "Share of that cycle's percentage gain, buying the signal and holding to the cycle high",
  );
  assert.equal(document.querySelector("svg.chart-svg") != null, true);
  assert.equal(html.includes('data-layer="price"'), true);
  assert.equal(document.querySelector(".now .stat .k")?.textContent, "Now, against Friday's trend");
  assert.equal(html.includes("Gap against the Friday trend"), false);
  assert.equal(
    texts(document, ".caveat .b").some((body) =>
      body.startsWith("At Friday's close (25 Sep 2026), gap about \u221241%"),
    ),
    true,
  );
  assert.equal(document.querySelectorAll("#chart-alt").length, 1);
  assert.equal(document.querySelector("a[aria-label='Settings']")?.getAttribute("href"), "/settings.html");

  const icons = document.querySelectorAll("svg");
  for (let i = 0; i < icons.length; i += 1) {
    const svg = icons[i];
    if (svg?.getAttribute("role") === "img") {
      continue;
    }
    assert.equal(svg?.getAttribute("aria-hidden"), "true");
  }
});

test("the clock line keeps the next-close year when it is the following year", () => {
  const html = paintDashboard({
    ...sampleVm,
    official: {
      ...sampleVm.official,
      closeDate: "2026-12-25",
      closeLabel: "Fri 25 Dec 2026",
      nextCloseDate: "2027-01-01",
      nextCloseLabel: "Fri 1 Jan 2027",
    },
  });
  const line = parse(html).querySelector(".clock-line")?.textContent ?? "";
  assert.equal(line.includes("Next close Fri 1 Jan 2027"), true);
  assert.equal(line.includes("Next close Fri 1 Jan ·"), false);
});

test("blank settings name the cash pile and do not invent $100,000", () => {
  const html = paintDashboard(blankVm);
  const document = parse(html);
  assert.equal(
    document.querySelector(".action")?.textContent,
    "Buy now, or by the Friday 2 Oct 2026 close. Use your cash available to invest.",
  );
  assert.equal(html.includes("Use your cash available to invest."), true);
  assert.equal(html.includes("$100,000"), false);
  assert.equal(document.querySelector("h2.posture")?.textContent, "Buy strongly");
});

test("each cash posture paints its word and record sentence", () => {
  const cases: {
    word: string;
    shown: string;
    rule: string;
    posture: CashPosture;
    tone: Tone;
    record: string;
    sentences: string[];
  }[] = [
    {
      word: "All in",
      shown: "Buy strongly",
      rule: "Rule: All in, from the buy cross",
      posture: "ALL_IN",
      tone: "buy",
      record: "4 of 4. Floor about 60% (Wilson 90%). 4 episodes.",
      sentences: [],
    },
    {
      word: "Build",
      shown: "Add",
      rule: "Rule: Build",
      posture: "BUILD",
      tone: "buy",
      record: "79% of 91 weeks. 4 spells.",
      sentences: [
        "One tranche, sliced this Friday, while under cost.",
        "A stand-down pause ends. Standing contribution resumes.",
      ],
    },
    {
      word: "Stand down",
      shown: "Pause",
      rule: "Rule: Stand down",
      posture: "STAND_DOWN",
      tone: "sell",
      record: "7 of 8. Floor about 59%. About six episodes.",
      sentences: [
        "Pause new money for up to 12 months, or until All in or Build.",
        "At 12 months the cash follows the gap switch.",
      ],
    },
    {
      word: "Lump in",
      shown: "Add",
      rule: "Rule: Lump in",
      posture: "LUMP_IN",
      tone: "buy",
      record: "6 of 6 finished regimes. Floor 69%.",
      sentences: [
        "Cash available goes in on the Friday it is available.",
        "Standing contribution continues.",
      ],
    },
    {
      word: "Slow in",
      shown: "Go slow",
      rule: "Rule: Slow in",
      posture: "SLOW_IN",
      tone: "buy",
      record: "2 of 3 regimes. Floor 25%.",
      sentences: ["A new lump sum spreads over 12 months.", "Standing contribution continues."],
    },
    {
      word: "Stay the course",
      shown: "Steady",
      rule: "Rule: Stay the course",
      posture: "STAY",
      tone: "neutral",
      record: "No event record.",
      sentences: ["Standing contribution only."],
    },
  ];

  for (const item of cases) {
    const vm: DashboardVM =
      item.posture === "ALL_IN"
        ? sampleVm
        : {
            ...sampleVm,
            rails: { cash: item.posture, coins: sampleVm.rails.coins },
            countdown: null,
            cash: {
              posture: item.posture,
              word: item.word,
              tone: item.tone,
              sentences: item.sentences,
              recordRows: [{ key: "RECORD", text: item.record }],
              highConfidence: false,
            },
          };
    const html = paintDashboard(vm);
    const document = parse(html);
    assert.equal(document.querySelector("h2.posture")?.textContent, item.shown, item.word);
    assert.equal(document.querySelector(".cash .rule")?.textContent, item.rule, item.word);
    assert.equal(document.querySelector(".record dd")?.textContent, item.record, item.word);
    assert.equal(document.querySelector(".spectrum"), null, item.word);
    assert.equal(
      document.querySelector("h2.posture")?.getAttribute("class"),
      `posture posture--${item.tone}`,
      item.word,
    );
  }
});

test("exit and a missing close leave the cash rail with no active segment", () => {
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
  const exitDoc = parse(paintDashboard(exitVm));
  assert.equal(exitDoc.querySelector(".spectrum"), null);
  assert.equal(exitDoc.querySelector("h2.posture")?.textContent, "Pause");
  assert.equal(exitDoc.querySelector(".cash .rule"), null);
  assert.equal(exitDoc.querySelector("h2.posture-sm")?.textContent, "Exit");
  assert.equal(exitDoc.querySelector(".coins .rule"), null);
  assert.equal(exitDoc.querySelector(".coins")?.textContent?.includes("Sell all."), true);

  const noCall: DashboardVM = {
    ...sampleVm,
    rails: { cash: null, coins: "HOLD" },
    countdown: null,
    cash: {
      posture: "NO_CALL",
      word: "No call",
      tone: "neutral",
      sentences: ["The Friday 2 Oct 2026 close is missing. There is no official call until it arrives."],
      recordRows: [],
      highConfidence: false,
    },
  };
  const noCallDoc = parse(paintDashboard(noCall));
  assert.equal(noCallDoc.querySelector(".spectrum"), null);
  assert.equal(noCallDoc.querySelector("h2.posture")?.textContent, "No update");
  assert.equal(noCallDoc.querySelector(".cash .rule")?.textContent, "Rule: No call");
  assert.equal(noCallDoc.querySelector("h2.posture-sm")?.textContent, "Keep");
  assert.equal(noCallDoc.querySelector(".record"), null);
});

test("disagreement and caveats are omitted unless the view model has them", () => {
  const text = "Sell roll is also in its pause. All in still wins. The week is not cut in half.";
  const shown = parse(paintDashboard({ ...sampleVm, disagreement: text }));
  assert.equal(shown.querySelector(".disagreement")?.textContent?.includes(text), true);

  const hidden = parse(paintDashboard({ ...sampleVm, disagreement: null, caveats: [] }));
  assert.equal(hidden.querySelector(".disagreement"), null);
  assert.equal(hidden.querySelector(".caveats"), null);
  assert.equal(parse(paintDashboard(sampleVm)).querySelector(".caveats") != null, true);
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
    "Account",
  ]);
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
