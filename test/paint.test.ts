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

  assert.equal(document.querySelector("h1.brand-name")?.textContent, "Bitcoin dashboard");
  assert.equal(document.querySelector(".brand-sub")?.textContent, "Read-only · one holder");
  assert.equal(document.querySelector("h1.brand-name")?.parentElement?.getAttribute("class"), "brand");
  assert.equal(document.querySelector("h2.posture")?.textContent, "All in");
  assert.equal(document.querySelector("h2.posture-sm")?.textContent, "Hold");
  assert.equal(
    document.querySelector(".action")?.textContent,
    "Buy now, or by the Friday 2 Oct 2026 close. Up to $100,000.",
  );
  assert.equal(html.split("Up to $100,000.").length, 2);
  assert.equal(
    document.querySelector(".record dd.lead")?.textContent,
    "4 of 4. Floor about 60% (Wilson 90%). 4 episodes.",
  );
  assert.equal(html.includes("Position on the spectrum only. Not a confidence scale."), true);
  assert.equal(
    document.querySelector("footer.footer")?.textContent?.includes("This page does not trade and does not compute tax."),
    true,
  );
  assert.equal(document.querySelector(".disagreement"), null);
  assert.equal(html.includes("Sell roll is also in its pause"), false);
  assert.equal(exactTextCount(document, "High confidence"), 0);
  assert.equal(html.includes("Not high confidence"), true);
  assert.deepEqual(texts(document, ".rail--coins > li"), ["Exit", "Trim", "Hold"]);
  assert.deepEqual(texts(document, ".rail--cash > li"), [
    "Stand down",
    "Stay the course",
    "Slow in",
    "Build",
    "Lump in",
    "All in",
  ]);
  assert.equal(document.querySelectorAll(".rail--coins [aria-current='step']").length, 1);
  assert.equal(document.querySelectorAll(".rail--cash [aria-current='step']").length, 1);
  assert.equal(document.querySelector(".rail--coins [aria-current='step']")?.textContent, "Hold");
  assert.equal(
    document.querySelector(".rail--coins [aria-current='step']")?.getAttribute("class"),
    "is-active tone-neutral",
  );
  assert.equal(document.querySelector(".rail--cash [aria-current='step']")?.textContent, "All in");
  assert.equal(
    document.querySelector(".rail--cash [aria-current='step']")?.getAttribute("class"),
    "is-active tone-buy",
  );
  assert.equal(html.includes("Fri 18 Sep"), true);
  assert.equal(html.includes("last grace"), true);
  assert.equal(html.includes("6 days left"), true);
  assert.equal(document.querySelector("svg.chart-svg") != null, true);
  assert.equal(html.includes('data-layer="price"'), true);
  assert.equal(document.querySelectorAll("#chart-alt").length, 1);
  assert.equal(document.querySelector("a[aria-label='Settings']")?.getAttribute("href"), "settings.html");

  const icons = document.querySelectorAll("svg");
  for (let i = 0; i < icons.length; i += 1) {
    const svg = icons[i];
    if (svg?.getAttribute("role") === "img") {
      continue;
    }
    assert.equal(svg?.getAttribute("aria-hidden"), "true");
  }
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
  assert.equal(document.querySelector("h2.posture")?.textContent, "All in");
});

test("each cash posture paints its word and record sentence", () => {
  const cases: {
    word: string;
    posture: CashPosture;
    tone: Tone;
    record: string;
    sentences: string[];
  }[] = [
    {
      word: "All in",
      posture: "ALL_IN",
      tone: "buy",
      record: "4 of 4. Floor about 60% (Wilson 90%). 4 episodes.",
      sentences: [],
    },
    {
      word: "Build",
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
      posture: "SLOW_IN",
      tone: "buy",
      record: "2 of 3 regimes. Floor 25%.",
      sentences: ["A new lump sum spreads over 12 months.", "Standing contribution continues."],
    },
    {
      word: "Stay the course",
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
    assert.equal(document.querySelector("h2.posture")?.textContent, item.word, item.word);
    assert.equal(document.querySelector(".record dd")?.textContent, item.record, item.word);
    assert.equal(document.querySelectorAll(".rail--cash [aria-current='step']").length, 1, item.word);
    assert.equal(document.querySelector(".rail--cash [aria-current='step']")?.textContent, item.word);
    assert.equal(
      document.querySelector("h2.posture")?.getAttribute("class"),
      `posture posture--${item.tone}`,
      item.word,
    );
    assert.equal(html.includes(item.record), true, item.word);
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
  assert.equal(exitDoc.querySelectorAll(".rail--cash [aria-current='step']").length, 0);
  assert.equal(exitDoc.querySelector(".rail--coins [aria-current='step']")?.textContent, "Exit");
  assert.equal(exitDoc.querySelector("h2.posture")?.textContent, "No new buy");
  assert.equal(exitDoc.querySelector("h2.posture-sm")?.textContent, "Exit");

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
  assert.equal(noCallDoc.querySelectorAll(".rail--cash [aria-current='step']").length, 0);
  assert.equal(noCallDoc.querySelector(".rail--coins [aria-current='step']")?.textContent, "Hold");
  assert.equal(noCallDoc.querySelector("h2.posture")?.textContent, "No call");
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

test("settings is a blank 760px sheet with the reference fields", () => {
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
  assert.equal(html.includes("max-width:760px"), true);
  assert.equal(html.includes("Shape, if you have not chosen: about $5,000."), true);
  assert.equal(
    html.includes("Shape, if you have not chosen: about $100,000, sliced on cheap Fridays."),
    true,
  );
  assert.equal(
    html.includes("Used by All in, Lump in, and Slow in. This amount is not refilled in order to wait for the next cross."),
    true,
  );
  assert.equal(html.includes("Shape, if you have not chosen: up to $100,000 on an All-in fire."), true);
  assert.equal(html.includes("Any blank means Trim stays off."), true);
  assert.equal(html.includes("Must be above the target share."), true);
  assert.equal(
    html.includes("Not declared means Exit stays off. This is a holder record, not a signal override."),
    true,
  );
  assert.equal(
    html.includes("Blank means the page does not compute tax. After-tax dollars are not a score until this is set."),
    true,
  );
  assert.equal(html.includes("Save settings"), true);
  assert.equal(html.includes("Cancel"), true);
  assert.equal(html.includes("The dashboard reads these amounts. It does not place an order."), true);
  assert.equal(/tax rate/i.test(html), false);
  assert.equal(document.getElementById("tax-rate"), null);
  assert.equal(document.querySelector("[role='switch']")?.getAttribute("aria-checked"), "false");
  assert.equal(document.getElementById("thesis-date")?.getAttribute("disabled"), "");
  assert.equal(document.querySelector("svg")?.getAttribute("aria-hidden"), "true");
  assert.equal(document.querySelector("a.back")?.getAttribute("href"), "index.html");
});
