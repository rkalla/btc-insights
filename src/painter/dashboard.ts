import { money, sentenceDate, signedPercent } from "../contract/format.ts";
import type { CashPosture, DashboardVM } from "../contract/types.ts";
import { chartSvg } from "./chart.ts";
import { caveatIcon, legendSwatch } from "./icons.ts";
import { siteFooter, siteHeader } from "./site-header.ts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const CHART_WIDE = 1000;
const CHART_NARROW = 360;

const EVIDENCE_TITLE = "The evidence behind this week's advice";
const EVIDENCE_INTRO =
  "This page shows the rules and history behind This week. It uses some technical terms, and each one is explained at the bottom.";

// NO_NEW_BUY uses the Pause step. The plan names no rule line for it.
const CASH_FACE: Record<CashPosture, { word: string; rule: string | null }> = {
  ALL_IN: { word: "Buy strongly", rule: "Rule: All in, from the buy cross" },
  LUMP_IN: { word: "Add", rule: "Rule: Lump in" },
  BUILD: { word: "Add", rule: "Rule: Build" },
  STAY: { word: "Steady", rule: "Rule: Stay the course" },
  SLOW_IN: { word: "Go slow", rule: "Rule: Slow in" },
  STAND_DOWN: { word: "Pause", rule: "Rule: Stand down" },
  NO_NEW_BUY: { word: "Pause", rule: null },
  NO_CALL: { word: "No update", rule: "Rule: No call" },
};

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
    meaning: "A cautious estimate of how often a signal works, allowing for how few times it has happened. Technically, the lower end of a 90% Wilson interval.",
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

export function paintDashboard(vm: DashboardVM): string {
  const body = `${siteHeader("evidence")}
${lede()}
${clockLine(vm)}
${row1(vm)}
${disagreement(vm)}
${caveats(vm)}
${row2(vm)}
${longView(vm)}
${cycles(vm)}
${siteFooter()}`;
  return `<div class="page">
${linkTerms(body)}
${glossary()}
</div>`;
}

function lede(): string {
  return `<section class="lede">
  <h1>${esc(EVIDENCE_TITLE)}</h1>
  <p>${esc(EVIDENCE_INTRO)}</p>
  <p><a href="#glossary">What the terms mean</a></p>
</section>`;
}

function clockLine(vm: DashboardVM): string {
  const closeYear = vm.official.closeDate.slice(0, 4);
  const nextYear = vm.official.nextCloseDate.slice(0, 4);
  let nextClose = vm.official.nextCloseLabel;
  if (closeYear === nextYear && nextClose.endsWith(` ${closeYear}`)) {
    nextClose = nextClose.slice(0, -(closeYear.length + 1));
  }
  const text =
    `Official call: ${officialCloseValue(vm.official.closeLabel)} · Next close ${nextClose} · ` +
    `Friday close is 00:00 UTC Saturday · Opened ${openedLabel(vm.openedAt)}`;
  return `<p class="clock-line">${esc(text)}</p>`;
}

function row1(vm: DashboardVM): string {
  return `<section class="row row-1">
  ${cashPanel(vm)}
  <div class="side">
    ${coinsPanel(vm)}
    ${nowPanel(vm)}
  </div>
</section>`;
}

function cashPanel(vm: DashboardVM): string {
  const face = CASH_FACE[vm.cash.posture];
  const [first, ...rest] = vm.cash.sentences;
  const sub = rest.join(" ");
  const rule = face.rule == null ? "" : `<p class="rule">${esc(face.rule)}</p>`;
  return `<article class="panel cash" aria-labelledby="cash-posture">
    <div class="panel-head" style="align-items:center"><span class="label">New money</span><span class="tag">Official call</span></div>
    <h2 class="posture posture--${vm.cash.tone}" id="cash-posture">${esc(face.word)}</h2>
    ${rule}
    ${first == null || first === "" ? "" : `<p class="action">${esc(first)}</p>`}
    ${sub === "" ? "" : `<p class="action-sub">${esc(sub)}</p>`}
    ${windowBlock(vm)}
    ${recordBlock(vm)}
  </article>`;
}

function windowBlock(vm: DashboardVM): string {
  const grace = vm.cash.window;
  if (grace == null) {
    return "";
  }
  const countdown = vm.countdown == null ? "" : `<span class="window-left">${esc(vm.countdown)}</span>`;
  const steps = grace.steps
    .map((step) => {
      const current = step.state === "current" ? ` aria-current="step"` : "";
      return `<li data-state="${step.state}"${current}><span class="bar"></span><span><span class="d">${esc(step.dateLabel)}</span><span class="s"> · ${esc(step.caption)}</span></span></li>`;
    })
    .join("");
  return `<div class="window">
      <div class="window-head"><span class="label">All-in window</span>${countdown}</div>
      <ol class="window-steps" aria-label="All-in window">${steps}</ol>
    </div>`;
}

function recordBlock(vm: DashboardVM): string {
  if (vm.cash.recordRows.length === 0) {
    return "";
  }
  const rows = vm.cash.recordRows
    .map((row) => {
      const className = row.key === "RECORD" ? "lead" : row.key === "STATUS" ? "status" : "";
      const classAttr = className === "" ? "" : ` class="${className}"`;
      return `<dt>${row.key}</dt><dd${classAttr}>${esc(row.text)}</dd>`;
    })
    .join("");
  return `<dl class="record well">${rows}</dl>`;
}

function coinsPanel(vm: DashboardVM): string {
  const lines = [...vm.coins.sentences];
  const declared = vm.coins.declarationDateLabel;
  if (declared != null && declared !== "" && !lines.some((line) => line.includes(declared))) {
    lines.splice(Math.min(1, lines.length), 0, `Declared ${declared}.`);
  }
  const tax = vm.coins.taxLine;
  if (tax != null && tax !== "" && !lines.includes(tax)) {
    lines.push(tax);
  }
  const face = vm.coins.posture === "HOLD"
    ? { word: "Keep", rule: "Rule: Hold" }
    : { word: vm.coins.word, rule: null };
  const rule = face.rule == null ? "" : `<p class="rule">${esc(face.rule)}</p>`;
  const paragraphs = lines.map((line) => `<p>${esc(line)}</p>`).join("");
  const chips =
    vm.coins.offChips.length === 0
      ? ""
      : `<div class="chips">${vm.coins.offChips.map((chip) => `<span class="chip">${esc(chip)}</span>`).join("")}</div>`;
  return `<article class="panel coins" aria-labelledby="coins-posture">
      <span class="label">Bitcoin you own</span>
      <h2 class="posture-sm posture--${vm.coins.tone}" id="coins-posture">${esc(face.word)}</h2>
      ${rule}
      ${paragraphs}
      ${chips}
    </article>`;
}

function nowPanel(vm: DashboardVM): string {
  const stale = vm.now.stale;
  const chipClass = stale ? "chip chip--late" : "chip";
  const chip = stale
    ? "Stale print"
    : vm.now.isOfficialClose
      ? "Same print as the official call"
      : "Later print · not the official close";
  const developing = vm.now.developing == null ? "Developing: none." : vm.now.developing;
  const note =
    stale && vm.now.staleNote != null
      ? vm.now.staleNote
      : `A later print can move these levels. It does not change the call. ${developing}`;
  return `<article class="panel now" aria-label="Now, latest print">
      <div class="panel-head" style="align-items:center"><span class="label">Now · ${esc(vm.now.printLabel)}</span><span class="${chipClass}">${esc(chip)}</span></div>
      <div class="spot">${esc(money(vm.now.spotUsd))}</div>
      <div class="stats">
        <div class="stat well"><span class="k">Now, against Friday's trend</span><span class="v">${esc(signedPercent(vm.now.gapPct))}</span></div>
        <div class="stat well"><span class="k">Trend</span><span class="v">≈ ${esc(money(vm.now.trendUsd))}</span></div>
      </div>
      <p class="note">${esc(note)}</p>
    </article>`;
}

function disagreement(vm: DashboardVM): string {
  if (vm.disagreement == null) {
    return "";
  }
  return `<section class="disagreement" role="note">${caveatIcon("gold")}<span>${esc(vm.disagreement)}</span></section>`;
}

function caveats(vm: DashboardVM): string {
  if (vm.caveats.length === 0) {
    return "";
  }
  const items = vm.caveats
    .map((caveat) => {
      return `<li class="caveat">${caveatIcon(caveat.kind)}<div><span class="t">${esc(caveat.title)}</span><span class="b">${esc(caveat.body)}</span></div></li>`;
    })
    .join("");
  return `<section class="panel caveats" aria-labelledby="caveats-label"><span class="label" id="caveats-label">Things to know</span><ul class="caveat-list">${items}</ul></section>`;
}

function row2(vm: DashboardVM): string {
  const drawn = charts(vm);
  const caption = [`Spot ${money(vm.now.spotUsd)}.`, ...vm.chart.captions].join(" ");
  const through = sentenceDate(vm.chart.spot.date);
  return `<section class="row row-2">
  <figure class="panel chart" aria-labelledby="chart-title">
    <div class="panel-head"><span class="label" id="chart-title">Price</span><span class="note">Log price · weekly closes · 2013 to ${esc(through)}</span></div>
    ${legend()}
    ${drawn.wide}
    ${drawn.narrow}
    <button type="button" class="show-fires">Show fires</button>
    ${drawn.table}
    <figcaption class="chart-foot"><span>${esc(caption)}</span><span>Selected marker: detail only. The call does not change.</span></figcaption>
  </figure>
  ${context(vm)}
</section>`;
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
  if (at < 0) {
    return { svg: markup, table: "" };
  }
  return { svg: markup.slice(0, at), table: markup.slice(at + 1) };
}

function context(vm: DashboardVM): string {
  const readings = vm.context
    .map((reading) => {
      const flag =
        reading.flagTone === "buy"
          ? "flag flag--buy"
          : reading.flagTone === "sell"
            ? "flag flag--sell"
            : reading.flagTone === "muted"
              ? "flag flag--muted"
              : "flag";
      return `<div class="reading"><div class="top"><span class="label">${esc(reading.label)}</span><span class="${flag}">${esc(reading.flag)}</span></div><p class="v">${esc(reading.value)}</p><p class="n">${esc(reading.note)}</p></div>`;
    })
    .join("");
  return `<aside class="panel context" aria-labelledby="context-label">
    <div class="panel-head"><span class="label" id="context-label">The readings behind the call</span><span class="note">Official Friday readings</span></div>
    <p class="note" style="margin:10px 0 14px">These blocks are the Friday close. None of them change the call on a later day. A developing z-score does not arm or fire.</p>
    <div class="readings">${readings}</div>
  </aside>`;
}

function longView(vm: DashboardVM): string {
  const tiles = vm.longView.tiles
    .map((tile) => {
      const wide = tile.wide === true ? " tile--wide" : "";
      return `<div class="tile${wide} well"><span class="label">${esc(tile.label)}</span><span class="v">${esc(tile.text)}</span></div>`;
    })
    .join("");
  return `<section class="panel longview" aria-labelledby="lv-label">
  <div class="lv-left">
    <span class="label" id="lv-label">The long view</span>
    <p class="lv-statement">${esc(vm.longView.statement)}</p>
    <p class="note" style="font-size:13.5px">${esc(vm.longView.caveat)}</p>
  </div>
  <div class="tiles">${tiles}</div>
</section>`;
}

function cycles(vm: DashboardVM): string {
  const at = vm.cycles.intro.indexOf(". ");
  const title = at < 0 ? vm.cycles.intro : vm.cycles.intro.slice(0, at);
  const noteText = at < 0 ? "" : vm.cycles.intro.slice(at + 2);
  const note = noteText === "" ? "" : `<p class="note">${esc(noteText)}</p>`;
  const cards = vm.cycles.cards.map(cycleCard).join("");
  return `<section class="panel cycles" aria-labelledby="cyc-title">
  <div class="cycles-head">
    <div><span class="label">How early each signal was</span><h2 class="cycles-title" id="cyc-title">${esc(title)}</h2></div>
    ${note}
  </div>
  <ul class="key" aria-hidden="true"><li><span class="sw sw--cross"></span>Buy cross</li><li><span class="sw sw--build"></span>Build</li><li><span class="sw sw--lump"></span>Lump in</li></ul>
  <div class="cycle-grid">${cards}</div>
  <p class="note cycle-foot">${esc(vm.cycles.footnote)}</p>
</section>`;
}

function cycleCard(card: DashboardVM["cycles"]["cards"][number]): string {
  const now = card.isProgress ? " cycle--now" : "";
  const lead = card.lead == null ? "" : `<p class="lead">${esc(card.lead)}</p>`;
  const note = card.note == null ? "" : `<p class="note" style="font-size:12px">${esc(card.note)}</p>`;
  const rows = card.rows
    .map((row) => {
      const width =
        !Number.isFinite(row.sharePct) || row.sharePct <= 0 ? "0%" : `max(2px, ${Math.min(row.sharePct, 100)}%)`;
      return `<div class="cap"><div class="top"><span class="name">${esc(row.name)}</span><span class="share">${esc(`${row.sharePct}%`)}</span></div><div class="track" aria-hidden="true"><div class="bar-fill bar-fill--${row.signal}" style="width:${width}"></div></div><span class="detail">${esc(row.detail)}</span></div>`;
    })
    .join("");
  return `<article class="cycle${now}"><div><h3>${esc(card.title)}</h3><span class="range">${esc(card.range)}</span></div>${lead}${rows}${note}</article>`;
}

function glossary(): string {
  const rows = GLOSSARY
    .map((entry) => `<dt id="${entry.id}">${esc(entry.term)}</dt><dd>${esc(entry.meaning)}</dd>`)
    .join("");
  return `<section class="panel glossary" id="glossary" aria-labelledby="glossary-title"><h2 id="glossary-title">What the terms mean</h2><dl>${rows}</dl></section>`;
}

function linkTerms(html: string): string {
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
      return skip.length > 0 || part === "" ? part : linkText(part, used);
    })
    .join("");
}

function linkText(text: string, used: Set<string>): string {
  let rest = text;
  let out = "";
  while (rest.length > 0) {
    let best: { id: string; index: number; raw: string } | null = null;
    for (const term of GLOSSARY) {
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

function officialCloseValue(label: string): string {
  return label.endsWith(" close") ? label : `${label} close`;
}

function openedLabel(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    return sentenceDate(iso.slice(0, 10));
  }
  const date = new Date(ms);
  const month = MONTHS[date.getMonth()] ?? "";
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
