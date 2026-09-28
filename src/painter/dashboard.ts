import { sentenceDate } from "../contract/format.ts";
import type { ContextReading, DashboardVM } from "../contract/types.ts";
import { BANNED_THIS_WEEK } from "../copy/thisWeek.ts";
import { chartSvg } from "./chart.ts";
import { legendSwatch } from "./icons.ts";
import { siteFooter, siteHeader } from "./site-header.ts";

const CHART_WIDE = 1000;
const CHART_NARROW = 360;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const BANNED = new RegExp(`\\b(?:${BANNED_THIS_WEEK.join("|")})\\b`, "i");

const LEAD =
  "Here's the reasoning behind this week's advice, in plain words. Tap Show the numbers under any section for the exact figures.";

// Track and worked lines already published on This week. They are not recomputed here.
const TRACK: Record<EvidenceKind, string | null> = {
  BUY_STRONGLY:
    "The set-aside money went in at once and beat spreading it over a year, all 4 times. 4 is a small number.",
  ADD_AT_ONCE:
    "Putting the money in at once beat spreading it over a year in all 6 finished stretches. One stretch is still open.",
  ADD_WEEKLY:
    "Bitcoin was up at least 50% a year later in about 79% of 91 weeks like this, across 4 stretches. The weekly pace was not tested.",
  STEADY: "None needed. This is the normal plan.",
  GO_SLOW: "Worked 2 of 3 times, our weakest record.",
  PAUSE:
    "Pausing got more Bitcoin for the same money 7 of 8 times. Those overlap, so count about six stretches. June 2013 was the miss.",
  SELL: "None. This follows your decision, not a market signal.",
  NO_UPDATE: null,
};

const WORKED: Record<EvidenceKind, string | null> = {
  BUY_STRONGLY:
    "Yes, all 4 times, against spreading the same money over a year. That's too few to be sure. A cautious reading is about 6 times in 10 or better. Treat it as a strong hint, not a promise.",
  ADD_AT_ONCE:
    "Yes, in all 6 finished stretches. That's still a small number. A cautious reading is about 7 times in 10 or better. This stretch began in November 2025 and hasn't finished yet.",
  ADD_WEEKLY:
    "Yes, on that 50% test. The 91 weeks come from 4 stretches, and weeks close together move together. The weekly pace was not tested.",
  STEADY:
    "Nothing to test this week. There's no special signal, so there's no record to show. Regular buying is the default plan.",
  GO_SLOW: "2 of 3 times. With only 3 cases, we can't say it beats a coin flip. Treat it as a hint, not a rule.",
  PAUSE:
    "7 of 8 times, about six stretches. In June 2013, pausing missed a large rise. The signal also stayed off before two big drops, in 2019\u201320 and 2025\u201326. A 12-month pause has not been tested on its own.",
  SELL: "There's no record for this. It's your decision, not a signal, so there's nothing to test.",
  NO_UPDATE: null,
};

type EvidenceKind =
  | "BUY_STRONGLY"
  | "ADD_AT_ONCE"
  | "ADD_WEEKLY"
  | "STEADY"
  | "GO_SLOW"
  | "PAUSE"
  | "SELL"
  | "NO_UPDATE";

type GlossaryEntry = (typeof GLOSSARY)[number];

const GLOSSARY: readonly { id: string; term: string; meaning: string; pattern: RegExp }[] = [
  {
    id: "long-run-trend",
    term: "Long-run trend (power law)",
    meaning: "The smooth curve Bitcoin's price has followed since 2010, fitted on a log scale. We compare today's price with it.",
    pattern: /long-run trend|power law/i,
  },
  {
    id: "gap",
    term: "Gap",
    meaning: "How far the price is above or below the trend, in percent. \u221241% means 41% below.",
    pattern: /\bgap\b/i,
  },
  {
    id: "bands",
    term: "20% below and 55% above lines",
    meaning: "The edges of the normal range. Between them, nothing unusual is happening.",
    pattern: /20% below(?: and 55% above lines)?|55% above/i,
  },
  {
    id: "buy-cross",
    term: "Buy cross (our strongest buy signal)",
    meaning: "Sets up when Bitcoin is cheap against gold and at least 20% below its trend. Turns on when Bitcoin's price in gold climbs back to its one-year average.",
    pattern: /buy cross/i,
  },
  {
    id: "armed",
    term: "Armed",
    meaning: "The buy cross has set up but hasn't turned on yet.",
    pattern: /\barmed\b/i,
  },
  {
    id: "z-score",
    term: "Z-score",
    meaning: "How unusual Bitcoin's price in gold is compared with the past 52 weeks. Zero is average; negative means cheap against gold.",
    pattern: /z-score/i,
  },
  {
    id: "gold-flag",
    term: "Gold flag",
    meaning: "A warning that a signal came partly from gold rising, not only Bitcoin falling.",
    pattern: /gold flag/i,
  },
  {
    id: "sell-roll",
    term: "Sell roll (caution signal)",
    meaning: "Turns on when Bitcoin has run more than 55% above its trend and then falls 10% from its peak. It pauses new money; it doesn't sell coins.",
    pattern: /sell roll|caution signal/i,
  },
  {
    id: "realized-price",
    term: "Realized price",
    meaning: "Roughly what the average holder paid, based on the price when each coin last moved. Below it, the average holder is at a loss.",
    pattern: /realized price/i,
  },
  {
    id: "thermometer",
    term: "Thermometer",
    meaning: "A combined hot-or-cold reading from several inputs. It's shown for context and doesn't change the advice.",
    pattern: /thermometer/i,
  },
  {
    id: "average-200w",
    term: "200-week average",
    meaning: "The average of the last 200 Friday prices, about four years. A slow-moving reference line.",
    pattern: /200-week average/i,
  },
  {
    id: "floor",
    term: "Floor",
    meaning: "A cautious estimate of how often a signal works, allowing for how few times it has happened.",
    pattern: /\bfloor\b/i,
  },
  {
    id: "episode",
    term: "Episode, regime, spell, stretch",
    meaning: "One continuous period when a signal or condition was on.",
    pattern: /\b(?:episodes?|regimes?|spells?|stretches?)\b/i,
  },
  {
    id: "friday-close",
    term: "Friday close",
    meaning: "The price at 00:00 UTC on Saturday, which is 5:00 pm Friday in Arizona. The advice changes only then.",
    pattern: /friday closes?/i,
  },
  {
    id: "grace",
    term: "Grace window",
    meaning: "After the buy cross turns on, two more Friday closes to act before the advice moves on.",
    pattern: /grace window|\bgrace\b/i,
  },
  {
    id: "cycle-capture",
    term: "Cycle capture",
    meaning: "How much of a cycle's rise, from its low to its high, a buyer caught by buying when a signal turned on and holding to the high. It shows timing, not odds.",
    pattern: /cycle capture/i,
  },
  {
    id: "rule-names",
    term: "Rule names",
    meaning: "All in = Buy strongly. Lump in = Add, at once. Build = Add, each week. Stay the course = Steady. Slow in = Go slow. Stand down = Pause. Exit = Sell, your decision.",
    pattern: /\b(?:stay the course|slow in|stand down|lump in|all in)\b/i,
  },
];

const CHECK_ORDER = ["sellRoll", "realizedPrice", "thermometer"] as const;

export function paintDashboard(vm: DashboardVM): string {
  const kind = kindOf(vm);
  const body = [
    lede(stepName(kind)),
    shortSection(vm, kind),
    whereSection(vm, kind),
    signalSection(vm, kind),
    historySection(vm, kind),
    checksSection(vm),
    holderSection(vm),
    longSection(vm),
    cyclesSection(vm),
  ].join("\n");
  const terms = GLOSSARY.filter((entry) => entry.pattern.test(body));
  return `<div class="page">
${siteHeader("evidence")}
${linkTerms(body, terms)}
${glossary(terms)}
${siteFooter()}
</div>`;
}

const HEADING: Record<string, string> = {
  "Buy strongly": "Why this week says Buy strongly",
  Add: "Why this week says Add",
  Steady: "Why this week says Steady",
  "Go slow": "Why this week says Go slow",
  Pause: "Why this week says Pause",
  "No update": "Why this week says No update",
};

function lede(step: string): string {
  const title = HEADING[step] ?? `Why this week says ${step}`;
  return `<section class="lede">
  <h1>${esc(title)}</h1>
  <p>${esc(LEAD)}</p>
  <p>The action is on <a href="/">This week</a>.</p>
</section>`;
}

function shortSection(vm: DashboardVM, kind: EvidenceKind): string {
  const items = shortBullets(vm, kind).map((line) => `<li>${esc(line)}</li>`).join("");
  return `<section class="panel short-version" aria-labelledby="short-h">
  <h2 id="short-h">The short version</h2>
  <ul class="short">${items}</ul>
</section>`;
}

function whereSection(vm: DashboardVM, kind: EvidenceKind): string {
  const drawn = charts(vm);
  const through = sentenceDate(vm.chart.spot.date);
  return `<section class="panel where" aria-labelledby="where-h">
  <h2 id="where-h">Where Bitcoin is now</h2>
  <p>${esc(nowSentence(vm, kind))}</p>
  <figure class="chart">
    ${legend()}
    ${drawn.wide}
    ${drawn.narrow}
    <button type="button" class="show-fires">Show past signals</button>
    ${drawn.table}
    <figcaption class="chart-foot"><span>Weekly closes, on a log scale, through ${esc(through)}.</span></figcaption>
  </figure>
  ${numbers("where Bitcoin is now", chartNumberLines(vm))}
</section>`;
}

function signalSection(vm: DashboardVM, kind: EvidenceKind): string {
  const on = explainsSignal(vm, kind);
  const heading = on ? "The signal that turned on" : "No signal turned on";
  const lines = on ? timeline(vm, kind) : [];
  const list = lines.length === 0
    ? ""
    : `<ol class="timeline">${lines.map((line) => `<li>${esc(line)}</li>`).join("")}</ol>`;
  const note = lines.length > 0 ? "" : `<p>${esc(on ? signalFallback(kind) : quietSignal(kind))}</p>`;
  return `<section class="panel signal" aria-labelledby="signal-h">
  <h2 id="signal-h">${esc(heading)}</h2>
  ${list}
  ${note}
  ${signalNumbers(vm, kind)}
</section>`;
}

function historySection(vm: DashboardVM, kind: EvidenceKind): string {
  const showTable = kind === "BUY_STRONGLY" && !vm.outOfDate;
  const table = showTable ? historyTable(vm) : "";
  const worked = vm.outOfDate && kind === "BUY_STRONGLY" ? null : WORKED[kind];
  const cautious = worked == null ? "" : `<p class="cautious">${esc(worked)}</p>`;
  const late = vm.outOfDate && kind === "BUY_STRONGLY"
    ? `<p>Nothing new to add while this page is late.</p>`
    : "";
  return `<section class="panel history" aria-labelledby="history-h">
  <h2 id="history-h">What happened the last times</h2>
  ${table}
  ${cautious}
  ${late}
  ${recordNumbers(vm, kind)}
</section>`;
}

function checksSection(vm: DashboardVM): string {
  const rows = CHECK_ORDER.map((key) => vm.context.find((reading) => reading.key === key))
    .filter((reading): reading is ContextReading => reading != null)
    .map((reading) => {
      return `<article class="check"><h3>${esc(checkName(reading.key))}</h3><p class="status">${esc(plainStatus(reading.flag))}</p><p>${esc(checkSentence(reading))}</p></article>`;
    })
    .join("");
  return `<section class="panel checks" aria-labelledby="checks-h">
  <h2 id="checks-h">What else we check</h2>
  <div class="readings">${rows}</div>
  ${numbers("these checks", checkNumberLines(vm))}
</section>`;
}

function holderSection(vm: DashboardVM): string {
  return `<section class="panel holder" aria-labelledby="holder-h">
  <h2 id="holder-h">Your Bitcoin</h2>
  <p>${holderSentence(vm)}</p>
</section>`;
}

function longSection(vm: DashboardVM): string {
  const items = watchedItems(vm).map((item) => `<li>${esc(item)}</li>`).join("");
  const list = items === "" ? "" : `<h3>Watched</h3><ul class="watched">${items}</ul>`;
  const tiles = vm.longView.tiles.map((tile) => `${tile.label}. ${tile.text}`);
  return `<section class="panel longview" aria-labelledby="lv-label">
  <h2 id="lv-label">The long view</h2>
  <p class="lv-statement">${esc(vm.longView.statement)}</p>
  <p class="note">${esc(vm.longView.caveat)}</p>
  ${list}
  ${numbers("the long view", tiles)}
</section>`;
}

function cyclesSection(vm: DashboardVM): string {
  const cards = vm.cycles.cards.map(cycleCard).join("");
  return `<details class="panel cycles">
  <summary id="cyc-title">How early each signal was</summary>
  <p class="note">${esc(vm.cycles.intro)}</p>
  <ul class="key" aria-hidden="true"><li><span class="sw sw--cross"></span>Buy strongly signal</li><li><span class="sw sw--build"></span>Add each week</li><li><span class="sw sw--lump"></span>Add at once</li></ul>
  <div class="cycle-grid">${cards}</div>
  <p class="note cycle-foot">${esc(vm.cycles.footnote)}</p>
</details>`;
}

function cycleCard(card: DashboardVM["cycles"]["cards"][number]): string {
  const now = card.isProgress ? " cycle--now" : "";
  const lead = card.lead == null ? "" : `<p class="lead">${esc(card.lead)}</p>`;
  const note = card.note == null ? "" : `<p class="note">${esc(card.note)}</p>`;
  const rows = card.rows
    .map((row) => {
      const width =
        !Number.isFinite(row.sharePct) || row.sharePct <= 0 ? "0%" : `max(2px, ${Math.min(row.sharePct, 100)}%)`;
      return `<div class="cap"><div class="top"><span class="name">${esc(plainRowName(row.name))}</span><span class="share">${esc(`${row.sharePct}%`)}</span></div><div class="track" aria-hidden="true"><div class="bar-fill bar-fill--${row.signal}" style="width:${width}"></div></div><span class="detail">${esc(row.detail)}</span></div>`;
    })
    .join("");
  return `<article class="cycle${now}"><div><h3>${esc(card.title)}</h3><span class="range">${esc(card.range)}</span></div>${lead}${rows}${note}</article>`;
}

function glossary(entries: readonly GlossaryEntry[]): string {
  const rows = entries
    .map((entry) => `<dt id="${entry.id}">${esc(entry.term)}</dt><dd>${esc(entry.meaning)}</dd>`)
    .join("");
  return `<section class="panel glossary" id="glossary" aria-labelledby="glossary-title"><h2 id="glossary-title">What the terms mean</h2><dl>${rows}</dl></section>`;
}

function kindOf(vm: DashboardVM): EvidenceKind {
  if (vm.coins.posture === "EXIT") return "SELL";
  if (vm.missingClose || vm.cash.posture === "NO_CALL") return "NO_UPDATE";
  switch (vm.cash.posture) {
    case "ALL_IN":
      return "BUY_STRONGLY";
    case "LUMP_IN":
      return "ADD_AT_ONCE";
    case "BUILD":
      return "ADD_WEEKLY";
    case "STAY":
      return "STEADY";
    case "SLOW_IN":
      return "GO_SLOW";
    case "STAND_DOWN":
    case "NO_NEW_BUY":
      return "PAUSE";
  }
}

function stepName(kind: EvidenceKind): string {
  switch (kind) {
    case "BUY_STRONGLY":
      return "Buy strongly";
    case "ADD_AT_ONCE":
    case "ADD_WEEKLY":
      return "Add";
    case "STEADY":
      return "Steady";
    case "GO_SLOW":
      return "Go slow";
    case "PAUSE":
    case "SELL":
      return "Pause";
    case "NO_UPDATE":
      return "No update";
  }
}

function shortBullets(vm: DashboardVM, kind: EvidenceKind): string[] {
  if (vm.outOfDate && kind === "BUY_STRONGLY") {
    return [`This page hasn't updated since ${vm.official.closeLabel}. Don't act on it until it does.`];
  }
  if (kind === "NO_UPDATE") {
    return ["This week's price data didn't arrive, or it failed our checks. We won't guess."];
  }
  const bullets: string[] = [];
  const turned = turnedOn(vm, kind);
  if (turned != null) bullets.push(turned);
  if (kind === "GO_SLOW") {
    bullets.push(
      "At times like this, spreading new money out did better than investing it at once in 2 of 3 cases.",
    );
  } else {
    const place = pricePlace(vm, kind);
    if (place != null) bullets.push(place);
  }
  const record = TRACK[kind];
  if (record != null) bullets.push(record);
  return bullets.slice(0, 3);
}

function turnedOn(vm: DashboardVM, kind: EvidenceKind): string | null {
  switch (kind) {
    case "BUY_STRONGLY": {
      const day = signalDay(vm);
      return day == null
        ? "Our strongest buy signal turned on."
        : `On ${day}, our strongest buy signal turned on.`;
    }
    case "ADD_AT_ONCE":
      return "This step puts new money in at once.";
    case "ADD_WEEKLY":
      return "Bitcoin is trading below what the average holder paid for it.";
    case "STEADY":
      return null;
    case "GO_SLOW":
      return "Bitcoin is more than 55% above its long-run trend.";
    case "PAUSE": {
      const day = vm.standDownFireDate == null ? null : monthDay(vm.standDownFireDate);
      const lead = day == null ? "Our caution signal turned on" : `On ${day}, our caution signal turned on`;
      return `${lead}: after a big run-up above its long-run trend, Bitcoin fell 10% from its peak.`;
    }
    case "SELL": {
      const date = vm.coins.declarationDateLabel;
      if (date == null || date === "") {
        return "You said in Settings that you no longer believe in Bitcoin's long-term case.";
      }
      return `On ${date}, you said in Settings that you no longer believe in Bitcoin's long-term case.`;
    }
    case "NO_UPDATE":
      return null;
  }
}

function pricePlace(vm: DashboardVM, kind: EvidenceKind): string | null {
  // Build, pause, sell, and a late page must not inherit this Friday's measured gap.
  if (kind !== "BUY_STRONGLY" && kind !== "ADD_AT_ONCE" && kind !== "STEADY") return null;
  const words = fridayGapWords(vm);
  if (words == null) {
    return kind === "STEADY" ? "None of our buy or caution signals is on." : null;
  }
  if (kind === "BUY_STRONGLY") return `Friday's price sits ${words} the long-run trend.`;
  if (kind === "ADD_AT_ONCE") {
    return words.includes("below") ? `Bitcoin is ${words} its long-run trend.` : null;
  }
  return `Bitcoin is ${words} its long-run trend, which is within its normal range. None of our buy or caution signals is on.`;
}

function nowSentence(vm: DashboardVM, kind: EvidenceKind): string {
  if (vm.outOfDate || vm.missingClose) {
    return "This chart is from an update that is late. Don't use it as this week's advice.";
  }
  if (vm.now.stale) return "These levels may be out of date.";
  if (kind === "ADD_WEEKLY" || kind === "PAUSE" || kind === "SELL" || kind === "NO_UPDATE") {
    return "The chart shows Bitcoin's weekly price against its long-run trend.";
  }
  const words = gapWords(vm.now.gapPct);
  if (words == null) return "The chart shows Bitcoin's weekly price against its long-run trend.";
  if (vm.now.isOfficialClose) return `Bitcoin is ${words} its long-run trend.`;
  return `The latest price is ${words} the long-run trend. Friday's advice stays put.`;
}

function explainsSignal(vm: DashboardVM, kind: EvidenceKind): boolean {
  if (vm.outOfDate) return false;
  return kind === "BUY_STRONGLY" || kind === "PAUSE";
}

function signalFallback(kind: EvidenceKind): string {
  return kind === "PAUSE" ? "Our caution signal turned on." : "Our strongest buy signal turned on.";
}

function quietSignal(kind: EvidenceKind): string {
  switch (kind) {
    case "NO_UPDATE":
      return "There is no signal to explain until the price data arrives.";
    case "SELL":
      return "This follows your decision, not a market signal.";
    case "STEADY":
      return "None of our buy or caution signals is on.";
    case "ADD_AT_ONCE":
      return "No single signal turned on. This step adds new money at once.";
    case "ADD_WEEKLY":
      return "No single signal turned on. This step adds a little while the price is under what the average holder paid.";
    case "GO_SLOW":
      return "No single signal turned on. This step spreads new money out.";
    case "PAUSE":
      return "Our caution signal turned on.";
    case "BUY_STRONGLY":
      return "This page is late, so it does not explain a signal from this update.";
  }
}

function timeline(vm: DashboardVM, kind: EvidenceKind): string[] {
  if (kind === "BUY_STRONGLY") {
    const lines: string[] = [];
    const arm = armDate(vm);
    if (arm != null) lines.push(`Set up ${arm}.`);
    const window = vm.cash.window;
    if (window != null) {
      for (const step of window.steps) {
        if (/last grace/i.test(step.caption)) lines.push(`Last day to act ${step.dateLabel}.`);
        else if (/fired/i.test(step.caption)) lines.push(`Turned on ${step.dateLabel}.`);
        else if (/grace/i.test(step.caption)) lines.push(`This advice ${step.dateLabel}.`);
      }
      return lines;
    }
    const open = vm.chart.fires.find((fire) => fire.type === "buy" && fire.status === "open");
    if (open != null) lines.push(`Turned on ${sentenceDate(open.date)}.`);
    return lines;
  }
  if (kind === "PAUSE" && vm.standDownFireDate != null) {
    return [`Turned on ${monthDay(vm.standDownFireDate)}.`];
  }
  return [];
}

function armDate(vm: DashboardVM): string | null {
  const gold = vm.caveats.find((caveat) => caveat.kind === "gold");
  const match = gold == null ? null : /^Arm\s+([^.]+)/.exec(gold.body);
  const date = match?.[1]?.trim();
  return date == null || date === "" ? null : date;
}

function historyTable(vm: DashboardVM): string {
  const rows = vm.presentation.history
    .map((row) => {
      const price = priceFromCycles(vm, row.fireDate);
      const priceCell = price == null ? "\u2014" : price;
      return `<tr><td>${esc(String(row.year))}</td><td>${esc(priceCell)}</td><td>${esc(oneYear(row.oneYearPct))}</td></tr>`;
    })
    .join("");
  if (rows === "") return "";
  return `<table class="history"><caption class="sr-only">Year, the price that day, and the change a year later</caption><thead><tr><th scope="col">Year</th><th scope="col">Price</th><th scope="col">A year later</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function priceFromCycles(vm: DashboardVM, iso: string): string | null {
  const needle = `${sentenceDate(iso)} at `;
  for (const card of vm.cycles.cards) {
    for (const row of card.rows) {
      const at = row.detail.indexOf(needle);
      if (at < 0) continue;
      const match = /^\$[\d,]+/.exec(row.detail.slice(at + needle.length));
      if (match != null) return match[0];
    }
  }
  return null;
}

function oneYear(pct: number | null): string {
  if (pct == null) return "In progress";
  const rounded = Math.round(pct);
  if (rounded < 0) return `\u2212${Math.abs(rounded)}%`;
  return `+${rounded}%`;
}

function checkName(key: ContextReading["key"]): string {
  if (key === "sellRoll") return "Caution signal";
  if (key === "realizedPrice") return "Average cost";
  return "The blend";
}

function plainStatus(flag: string): string {
  if (/quiet/i.test(flag)) return "Quiet";
  if (/^fired$/i.test(flag)) return "On";
  if (/gold flag/i.test(flag)) return "On";
  if (!BANNED.test(flag)) return flag;
  return "On";
}

function checkSentence(reading: ContextReading): string {
  if (reading.key === "sellRoll") {
    if (/quiet/i.test(reading.flag) || /quiet/i.test(reading.value)) return "The caution signal is quiet.";
    if (!BANNED.test(reading.value)) return reading.value;
    return "The caution signal is on.";
  }
  if (!BANNED.test(reading.value)) return reading.value;
  if (!BANNED.test(reading.flag)) return reading.flag;
  return "The figure is under Show the numbers.";
}

function holderSentence(vm: DashboardVM): string {
  const settings = `<a href="/settings.html">Settings</a>`;
  if (vm.coins.posture === "EXIT") {
    const date = vm.coins.declarationDateLabel;
    const decision = date == null || date === ""
      ? `You said in ${settings} that you no longer believe in Bitcoin's long-term case`
      : `On ${esc(date)}, you said in ${settings} that you no longer believe in Bitcoin's long-term case`;
    const tax = vm.coins.taxLine == null ? "." : ", and a sale can create a tax bill.";
    return `${decision}${tax}`;
  }
  if (vm.coins.posture === "TRIM") {
    const tax = vm.coins.taxLine == null ? "" : ", knowing a sale can create a tax bill and the rate is not computed";
    return `Sell from the ceiling down to the target, highest-cost lots first${tax}, as set in ${settings}.`;
  }
  if (holdIsBlank(vm)) {
    return `Keep any Bitcoin you already own, or add your amounts in ${settings}.`;
  }
  return `Keep the Bitcoin you own, because it is under the limit you set in ${settings}.`;
}

function holdIsBlank(vm: DashboardVM): boolean {
  return vm.coins.offChips.some((chip) =>
    /ceiling not set|coins not set|net worth not set|target not set|net worth is zero|net worth not positive/i.test(chip),
  );
}

function watchedItems(vm: DashboardVM): string[] {
  const tile = vm.longView.tiles.find((item) => /hash-rate collapse/i.test(item.text));
  if (tile == null) return [];
  const withoutFloor = tile.text.split(/floor band/i)[0] ?? tile.text;
  return withoutFloor
    .split(";")
    .map((part) => part.replace(/\.\s*$/, "").trim())
    .filter((part) => part !== "");
}

function chartNumberLines(vm: DashboardVM): string[] {
  const lines: string[] = [];
  const fit = vm.caveats.find((caveat) => caveat.kind === "fit");
  if (fit != null) lines.push(fit.body);
  for (const caption of vm.chart.captions) lines.push(caption);
  if (vm.now.staleNote != null && vm.now.staleNote !== "") lines.push(vm.now.staleNote);
  return lines;
}

function signalNumbers(vm: DashboardVM, kind: EvidenceKind): string {
  const lines: string[] = [];
  for (const reading of vm.context) {
    if (reading.key !== "buyCross" && reading.key !== "zScore") continue;
    lines.push(`${reading.label}. ${reading.flag}. ${reading.value} ${reading.note}`.replace(/\s+/g, " ").trim());
  }
  for (const caveat of vm.caveats) {
    if (caveat.kind === "fit") continue;
    lines.push(`${caveat.title}. ${caveat.body}`);
  }
  if (kind === "BUY_STRONGLY" && !vm.outOfDate && vm.cash.window != null) {
    for (const step of vm.cash.window.steps) lines.push(`${step.dateLabel}: ${step.caption}`);
  }
  if (vm.now.developing != null && vm.now.developing !== "") lines.push(vm.now.developing);
  const disagree = vm.disagreement == null ? "" : `<p class="disagreement">${esc(vm.disagreement)}</p>`;
  const body = lines.map((line) => `<p>${esc(line)}</p>`).join("");
  if (body === "" && disagree === "") return "";
  return `<details class="numbers"><summary>Show the numbers<span class="for"> for the signal</span></summary>${disagree}${body}</details>`;
}

function checkNumberLines(vm: DashboardVM): string[] {
  const lines: string[] = [];
  for (const key of CHECK_ORDER) {
    const reading = vm.context.find((item) => item.key === key);
    if (reading == null) continue;
    lines.push(`${reading.label}. ${reading.flag}. ${reading.value}`.replace(/\s+/g, " ").trim());
    lines.push(reading.note);
  }
  return lines;
}

function recordNumbers(vm: DashboardVM, kind: EvidenceKind): string {
  if (kind !== "BUY_STRONGLY" || vm.outOfDate || vm.cash.recordRows.length === 0) return "";
  const rows = vm.cash.recordRows
    .map((row) => {
      const className = row.key === "RECORD" ? "lead" : row.key === "STATUS" ? "status" : "";
      const classAttr = className === "" ? "" : ` class="${className}"`;
      return `<dt>${esc(row.key)}</dt><dd${classAttr}>${esc(row.text)}</dd>`;
    })
    .join("");
  return `<details class="numbers"><summary>Show the numbers<span class="for"> for the past results</span></summary><dl class="record">${rows}</dl><p>Technically, the lower end of a 90% Wilson interval.</p></details>`;
}

function numbers(what: string, lines: readonly string[]): string {
  const body = lines.filter((line) => line.trim() !== "").map((line) => `<p>${esc(line)}</p>`).join("");
  if (body === "") return "";
  return `<details class="numbers"><summary>Show the numbers<span class="for"> for ${esc(what)}</span></summary>${body}</details>`;
}

function plainRowName(name: string): string {
  return name
    .replaceAll("Buy cross", "Buy strongly signal")
    .replaceAll("Lump in", "Add at once")
    .replaceAll("Build", "Add each week");
}

function legend(): string {
  const items = [
    [legendSwatch("price"), "Bitcoin price (Friday closes)"],
    [legendSwatch("trend"), "Long-run trend"],
    [legendSwatch("lower"), "20% below trend"],
    [legendSwatch("upper"), "55% above trend"],
    [legendSwatch("average"), "200-week average"],
    [legendSwatch("buy"), "Buy signal"],
    [legendSwatch("sell"), "Caution signal"],
  ] as const;
  return `<ul class="legend" aria-label="Chart legend">${items.map(([swatch, label]) => `<li>${swatch}${esc(label)}</li>`).join("")}</ul>`;
}

function charts(vm: DashboardVM): { wide: string; narrow: string; table: string } {
  const wide = splitChart(chartSvg(vm.chart, vm.chart.spot, CHART_WIDE));
  const narrow = splitChart(chartSvg(vm.chart, vm.chart.spot, CHART_NARROW));
  return {
    wide: wide.svg.replace('class="chart-svg"', 'class="chart-svg chart-svg--wide"'),
    narrow: narrow.svg
      .replace('class="chart-svg"', 'class="chart-svg chart-svg--narrow"')
      .replaceAll('id="chart-alt"', 'id="chart-alt-narrow"')
      .replaceAll('aria-labelledby="chart-alt"', 'aria-labelledby="chart-alt-narrow"'),
    table: wide.table,
  };
}

function splitChart(markup: string): { svg: string; table: string } {
  const at = markup.indexOf('\n<div class="sr-only"');
  if (at < 0) return { svg: markup, table: "" };
  return { svg: markup.slice(0, at), table: markup.slice(at + 1) };
}

function signalDay(vm: DashboardVM): string | null {
  const history = vm.presentation.history;
  const open = [...history].reverse().find((row) => row.oneYearPct == null);
  const iso = open?.fireDate ?? history[history.length - 1]?.fireDate;
  return iso == null ? null : monthDay(iso);
}

function fridayGapWords(vm: DashboardVM): string | null {
  const fit = vm.caveats.find((caveat) => caveat.kind === "fit");
  if (fit != null) {
    const match = /gap about\s+([+\u2212-]?\d+)%/i.exec(fit.body);
    const raw = match?.[1];
    if (raw != null) {
      const points = Number(raw.replace("\u2212", "-").replace("+", ""));
      if (Number.isFinite(points)) return pointsWords(points);
    }
  }
  if (vm.now.isOfficialClose) return gapWords(vm.now.gapPct);
  return null;
}

function gapWords(fraction: number): string | null {
  if (!Number.isFinite(fraction)) return null;
  const points = Math.round(fraction * 100);
  if (points === 0 && fraction > 0) return "about 0% above";
  return pointsWords(points);
}

function pointsWords(points: number): string {
  const magnitude = Math.abs(points);
  if (points < 0) return `about ${magnitude}% below`;
  if (points > 0) return `about ${magnitude}% above`;
  return "about 0% below";
}

function monthDay(iso: string): string {
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  if (!Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12) return iso;
  return `${MONTHS[month - 1]} ${day}`;
}

function linkTerms(html: string, terms: readonly GlossaryEntry[]): string {
  const parts = html.split(/(<[^>]+>)/);
  const used = new Set<string>();
  const skip: string[] = [];
  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        const name = /^<\s*\/?\s*([a-zA-Z0-9]+)/.exec(part)?.[1]?.toLowerCase() ?? "";
        if (name !== "" && !part.endsWith("/>")) {
          if (/^<\s*\//.test(part)) {
            if (skip[skip.length - 1] === name) skip.pop();
          } else if (name === "a" || name === "svg" || /\bsr-only\b/.test(part)) {
            skip.push(name);
          }
        }
        return part;
      }
      return skip.length > 0 || part === "" ? part : linkText(part, used, terms);
    })
    .join("");
}

function linkText(text: string, used: Set<string>, terms: readonly GlossaryEntry[]): string {
  let rest = text;
  let out = "";
  while (rest.length > 0) {
    let best: { id: string; index: number; raw: string } | null = null;
    for (const term of terms) {
      if (used.has(term.id)) continue;
      const match = term.pattern.exec(rest);
      if (match == null || match[0].length === 0) continue;
      if (
        best == null ||
        match.index < best.index ||
        (match.index === best.index && match[0].length > best.raw.length)
      ) {
        best = { id: term.id, index: match.index, raw: match[0] };
      }
    }
    if (best == null) {
      out += rest;
      break;
    }
    out += `${rest.slice(0, best.index)}<a class="term" href="#${best.id}">${best.raw}</a>`;
    used.add(best.id);
    rest = rest.slice(best.index + best.raw.length);
  }
  return out;
}

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
