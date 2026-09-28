import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { parseHTML } from "linkedom";
import { applyOverlay, composePlain, type FridayStateOverlay } from "../src/compose/plain.ts";
import type { FridayDocument, HolderSettings, LiveSlice } from "../src/contract/types.ts";
import {
  paintThisWeek,
  thisWeekShell,
  WEEK_LOADING,
  WEEK_LOAD_ERROR,
  WEEK_NEEDS_JS,
  WEEK_SCALE_LABEL,
  WEEK_TRY_AGAIN,
} from "../src/painter/this-week.ts";
import { blankSettings } from "../src/settings/store.ts";

const OPENED = "2026-09-27T21:14:00.000Z";
const ZONE = "America/Phoenix";
const ICONS = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`;

interface PaintEl {
  textContent: string | null;
  innerHTML: string;
  getAttribute(name: string): string | null;
}

interface PaintDoc {
  querySelector(selector: string): PaintEl | null;
  querySelectorAll(selector: string): ArrayLike<PaintEl>;
}

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), "utf8")) as unknown;
}

function parse(html: string): PaintDoc {
  const parsed = parseHTML(`<!doctype html><html><body>${html}</body></html>`) as { document: PaintDoc };
  return parsed.document;
}

const friday = readJson("fixtures/friday-2026-09-25.json") as FridayDocument;
const live = readJson("fixtures/live-2026-09-25.json") as LiveSlice;

function holder(patch: Partial<HolderSettings> = {}): HolderSettings {
  return { ...blankSettings(), ...patch };
}

function paint(
  patch: FridayStateOverlay = {},
  settings: HolderSettings = holder(),
  slice: Partial<LiveSlice> = {},
  openedAt = OPENED,
): PaintDoc {
  const view = composePlain(
    applyOverlay(friday, patch),
    { ...live, ...slice },
    settings,
    openedAt,
    ZONE,
  );
  return parse(paintThisWeek(view));
}

function text(document: PaintDoc): string {
  return document.querySelector("body")?.textContent ?? "";
}

test("the shell is the header, a loading sentence, and a no-javascript sentence", () => {
  const shell = thisWeekShell(ICONS);
  const document = parseHTML(shell).document as PaintDoc;
  assert.equal(shell.includes("fonts.googleapis.com"), false);
  assert.equal(shell.includes("fonts.gstatic.com"), false);
  assert.equal(shell.includes("devbar"), false);
  assert.equal(shell.includes(WEEK_LOADING), true);
  assert.equal(shell.includes(WEEK_NEEDS_JS), true);
  assert.equal(shell.includes('rel="icon" href="/favicon.ico" sizes="48x48"'), true);
  assert.equal(shell.includes('rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32"'), true);
  assert.equal(shell.includes('rel="apple-touch-icon" href="/apple-touch-icon.png"'), true);
  assert.equal(shell.includes("Buy strongly"), false);
  assert.equal(shell.includes("$"), false);
  assert.equal(document.querySelector("h1"), null);
  assert.equal(document.querySelector('[aria-current="page"]')?.textContent, "This week");
  assert.equal(document.querySelector('[aria-current="page"]')?.getAttribute("href"), "/");
  assert.equal(document.querySelector(".brand")?.getAttribute("href"), "/");
  assert.equal(document.querySelector(".tabs a:not([aria-current])")?.getAttribute("href"), "/evidence/");
  assert.equal(document.querySelector(".gear")?.getAttribute("aria-label"), "Settings");
  assert.equal(document.querySelector(".gear")?.getAttribute("href"), "/settings.html");
  assert.equal(document.querySelector(".boot")?.textContent, WEEK_LOADING);
  assert.equal(document.querySelector(".notice")?.textContent, WEEK_NEEDS_JS);
});

test("this week css uses the light tokens and not a mono face", () => {
  const css = readFileSync(new URL("../src/painter/this-week.css", import.meta.url), "utf8");
  assert.equal(css.includes("--paper:#F7F6F2"), true);
  assert.equal(css.includes("--buy:#1F5ED6"), true);
  assert.equal(css.includes("--caution:#A5520E"), true);
  assert.equal(css.includes("fonts.googleapis.com"), false);
  assert.equal(css.includes("fonts.gstatic.com"), false);
  assert.equal(css.includes("650"), false);
  assert.equal(css.includes("Geist Mono"), false);
  assert.equal(css.includes("monospace"), false);
  assert.equal(css.includes("devbar"), false);
  assert.equal(/@keyframes\s+shimmer/i.test(css), false);
  assert.equal(/\bred\b|\bgreen\b/i.test(css), false);
});

test("the current all-in week paints one headline and the scale step", () => {
  const document = paint();
  const headings = document.querySelectorAll("h1");
  assert.equal(headings.length, 1);
  assert.equal(headings[0]?.textContent, "A strong week to buy Bitcoin.");
  const current = document.querySelectorAll('[aria-current="step"]');
  assert.equal(current.length, 1);
  assert.equal(current[0]?.textContent?.includes("Buy strongly"), true);
  assert.equal(current[0]?.textContent?.includes("(this week)"), true);
  assert.equal(document.querySelector(".scale")?.getAttribute("aria-label"), WEEK_SCALE_LABEL);
  assert.equal(document.querySelectorAll(".scale li").length, 5);
  const body = text(document);
  const markers = [
    "This week's advice, set Friday, Sep 25.",
    "A strong week to buy Bitcoin.",
    "What to do",
    "Why",
    "Has this worked before?",
    "What could go wrong",
    "Bitcoin today",
    "See the evidence behind this.",
  ];
  let at = 0;
  for (const marker of markers) {
    const next = body.indexOf(marker, at);
    assert.equal(next >= at, true, marker);
    at = next + marker.length;
  }
  assert.equal(body.includes("19 times in 20"), false);
  assert.equal(body.includes("{"), false);
  assert.equal(document.querySelector(".price")?.textContent?.includes("$84,413"), true);
  assert.equal(document.querySelector(".price-time")?.textContent, "Friday, Sep 25, 5:00 pm");
  assert.equal(document.querySelector(".price")?.textContent?.includes("Thursday, Sep 24"), false);
  assert.equal(document.querySelector(".why")?.textContent?.includes("A cautious reading is about 6 times in 10 or better."), false);
  assert.equal(
    document.querySelector(".record")?.textContent?.includes(
      "A cautious reading is about 6 times in 10 or better. Treat it as a strong hint, not a promise.",
    ),
    true,
  );
  assert.equal(document.querySelector(".price")?.textContent?.includes("%"), false);
  assert.equal(document.querySelector(".price")?.textContent?.toLowerCase().includes("gap"), false);
  assert.equal(document.querySelector(".chip")?.textContent, "5 days left");
  assert.equal(document.querySelector(".steps")?.innerHTML.includes("<strong>the money you've set aside</strong>"), true);
  assert.equal(
    document.querySelector(".steps")?.innerHTML.includes('<strong class="nw">Friday, Oct 2, 5:00 pm</strong>'),
    true,
  );
  assert.equal(document.querySelector(".personal a")?.getAttribute("href"), "/settings.html");
  assert.equal(document.querySelector("a.evidence")?.getAttribute("href"), "/evidence/");
  assert.equal(document.querySelector("footer a[href='/evidence/']")?.textContent, "Evidence");
  assert.equal(document.querySelector("footer a.repo")?.getAttribute("href"), "https://github.com/rkalla/btc-insights");
  assert.equal(document.querySelector("footer a.repo span")?.textContent, "GitHub");
  assert.equal(document.querySelector("footer a.repo svg")?.getAttribute("aria-hidden"), "true");
  assert.equal(document.querySelector(".flag")?.textContent?.includes("Part of this move was gold rising"), true);
  assert.equal(document.querySelector(".tile--open")?.textContent?.includes("In progress"), true);
  assert.equal(document.querySelector(".tile .val")?.textContent, "+127%");
  assert.equal(document.querySelector("figure, canvas"), null);
  assert.equal(document.querySelector("button"), null);
  assert.equal(body.includes(WEEK_LOAD_ERROR), false);
  assert.equal(body.includes(WEEK_TRY_AGAIN), false);
});

test("every fixture state paints one column without a leftover placeholder", () => {
  const names = readdirSync(new URL("../fixtures/states/", import.meta.url)).filter((name) => name.endsWith(".json"));
  const cases: { name: string; patch: FridayStateOverlay; settings?: HolderSettings }[] = [
    { name: "all-in", patch: {} },
    ...names.map((name) => ({ name, patch: readJson(`fixtures/states/${name}`) as FridayStateOverlay })),
    {
      name: "sell",
      patch: {},
      settings: holder({ thesisBroken: true, thesisDate: "2026-09-01" }),
    },
  ];
  for (const item of cases) {
    const document = paint(item.patch, item.settings ?? holder());
    const body = text(document);
    assert.equal(document.querySelectorAll("h1").length, 1, item.name);
    assert.equal(document.querySelector(".scale")?.getAttribute("aria-label"), WEEK_SCALE_LABEL, item.name);
    assert.equal(body.includes("{"), false, item.name);
    assert.equal(body.includes("undefined"), false, item.name);
    assert.equal(document.querySelector(".price")?.textContent?.includes("%"), false, item.name);
    assert.equal(document.querySelector("figure, canvas"), null, item.name);
    const step = document.querySelector('[aria-current="step"]');
    if (item.name === "no-call.json") {
      assert.equal(step, null, item.name);
      assert.equal(document.querySelector("#rec-h"), null, item.name);
      assert.equal(body.includes("No step is marked this week."), true, item.name);
    } else {
      assert.equal(step == null, false, item.name);
      assert.equal(document.querySelector("#rec-h")?.textContent, "Has this worked before?", item.name);
    }
  }
});

test("emphasis bolds the amount frames and leaves the regular-buy parenthetical plain", () => {
  const lump = paint(readJson("fixtures/states/lump-in.json") as FridayStateOverlay, holder({
    cashAvailable: 10000,
    standingAmount: 200,
    standingEvery: "week",
  }));
  const lumpSteps = lump.querySelector(".steps")?.innerHTML ?? "";
  assert.equal(lumpSteps.includes("<strong>$10,000</strong> into Bitcoin when you have it"), true);
  assert.equal(lumpSteps.includes("<strong><strong>"), false);
  assert.equal(lumpSteps.includes("($200 a week)"), true);
  assert.equal(lumpSteps.includes("<strong>$200</strong>"), false);

  const blankLump = paint(readJson("fixtures/states/lump-in.json") as FridayStateOverlay);
  assert.equal(
    blankLump.querySelector(".steps")?.innerHTML.includes("<strong>the money you've set aside</strong> into Bitcoin when you have it"),
    true,
  );

  const weekly = paint(readJson("fixtures/states/build.json") as FridayStateOverlay, holder({ buildAmount: 2600 }));
  assert.equal(weekly.querySelector(".steps")?.innerHTML.includes("<strong>$100</strong> to Bitcoin this week"), true);
  const blankWeekly = paint(readJson("fixtures/states/build.json") as FridayStateOverlay);
  assert.equal(
    blankWeekly.querySelector(".steps")?.innerHTML.includes("<strong>a small, fixed amount</strong>"),
    true,
  );

  const funded = paint({}, holder({
    cashAvailable: 10000,
    standingAmount: 200,
    standingEvery: "week",
    coinsHeld: 1,
    netWorth: 470000,
    targetShare: 10,
    ceilingShare: 15,
  }));
  const fundedSteps = funded.querySelector(".steps")?.innerHTML ?? "";
  assert.equal(fundedSteps.includes('<strong class="nw">Friday, Oct 2, 5:00 pm</strong>'), true);
  assert.equal(fundedSteps.includes("Sell about <strong>$37,400</strong>"), true);
  assert.equal(fundedSteps.includes("($200 a week)"), true);
  assert.equal(fundedSteps.includes("<strong>$200</strong>"), false);

  const pause = paint(readJson("fixtures/states/stand-down.json") as FridayStateOverlay, holder({
    coinsHeld: 1,
    netWorth: 470000,
    targetShare: 10,
    ceilingShare: 15,
  }));
  const pauseSteps = pause.querySelector(".steps")?.innerHTML ?? "";
  assert.equal(pauseSteps.includes("happened by <strong>Mar 6, 2027</strong>, that"), true);
  assert.equal(pauseSteps.includes("Finish by <strong>Mar 6, 2027</strong>."), true);
  assert.equal(pauseSteps.includes("Sell about <strong>$37,400</strong>"), true);
});

test("an out-of-date week keeps the call and hides the update line", () => {
  const document = paint({}, holder(), {}, "2026-10-03T12:00:00.000Z");
  assert.equal(document.querySelector(".stale")?.textContent?.includes("Don't act on it until it does."), true);
  assert.equal(document.querySelector(".meta")?.textContent?.includes("Next update"), false);
  assert.equal(document.querySelector(".chip"), null);
  assert.equal(document.querySelector("h1")?.textContent, "A strong week to buy Bitcoin.");
  assert.equal(document.querySelector('[aria-current="step"]')?.textContent?.includes("Buy strongly"), true);
});
