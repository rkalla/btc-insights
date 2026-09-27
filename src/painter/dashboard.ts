import { money, sentenceDate, signedPercent } from "../contract/format.ts";
import type { DashboardVM, Tone } from "../contract/types.ts";
import { chartSvg } from "./chart.ts";
import { brandIcon, caveatIcon, legendSwatch, lockIcon, settingsIcon } from "./icons.ts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const COIN_RAIL = [
  ["EXIT", "Exit"],
  ["TRIM", "Trim"],
  ["HOLD", "Hold"],
] as const;

const CASH_RAIL = [
  ["STAND_DOWN", "Stand down"],
  ["STAY", "Stay the course"],
  ["SLOW_IN", "Slow in"],
  ["BUILD", "Build"],
  ["LUMP_IN", "Lump in"],
  ["ALL_IN", "All in"],
] as const;

const CHART_WIDE = 1000;
const CHART_NARROW = 360;

export function paintDashboard(vm: DashboardVM): string {
  return `<div class="page">
${header(vm)}
${clockLine(vm)}
${spectrum(vm)}
${row1(vm)}
${disagreement(vm)}
${caveats(vm)}
${row2(vm)}
${longView(vm)}
${cycles(vm)}
${footer(vm)}
</div>`;
}

function header(vm: DashboardVM): string {
  const opened = openedLabel(vm.openedAt);
  return `<header class="topbar">
  <div class="brand">
    ${brandIcon()}
    <h1 class="brand-name">Bitcoin dashboard</h1>
    <span class="brand-sep"></span>
    <span class="brand-sub">Read-only · one holder</span>
  </div>
  <div class="clocks">
    <span class="clock">${lockIcon()}<span class="k">Official call</span><span class="v">${esc(officialCloseValue(vm.official.closeLabel))}</span></span>
    <span class="clock"><span class="k">Next close</span><span class="v">${esc(vm.official.nextCloseLabel)}</span></span>
    <span class="clock clock--utc">00:00 UTC Sat</span>
    <span class="opened">Opened ${esc(opened)}</span>
    <a class="icon-btn" href="settings.html" aria-label="Settings">${settingsIcon()}</a>
  </div>
</header>`;
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
  return `<p class="clock-line" style="order:1;margin:-8px 0 0">${esc(text)}</p>`;
}

function spectrum(vm: DashboardVM): string {
  return `<section class="panel spectrum" aria-label="Where this week's call sits on the spectrum">
  <div class="rails">
    <div class="rail-group rail-group--coins">
      <span class="label" id="rail-coins-label">02 · Coins held</span>
      <ol class="rail rail--coins" aria-labelledby="rail-coins-label">${railItems(COIN_RAIL, vm.rails.coins, vm.coins.tone)}</ol>
    </div>
    <div class="rail-divider"></div>
    <div class="rail-group rail-group--cash">
      <span class="label" id="rail-cash-label">01 · Cash</span>
      <ol class="rail rail--cash" aria-labelledby="rail-cash-label">${railItems(CASH_RAIL, vm.rails.cash, vm.cash.tone)}</ol>
    </div>
  </div>
  <div class="spectrum-axis"><span>← Out of Bitcoin</span><span class="mid">Position on the spectrum only. Not a confidence scale.</span><span>Into Bitcoin →</span></div>
</section>`;
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
  const [first, ...rest] = vm.cash.sentences;
  const sub = rest.join(" ");
  return `<article class="panel cash" aria-labelledby="cash-posture">
    <div class="panel-head" style="align-items:center"><span class="label">01 · Cash</span><span class="tag">Official call</span></div>
    <h2 class="posture posture--${vm.cash.tone}" id="cash-posture">${esc(vm.cash.word)}</h2>
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
  const paragraphs = lines.map((line) => `<p>${esc(line)}</p>`).join("");
  const chips =
    vm.coins.offChips.length === 0
      ? ""
      : `<div class="chips">${vm.coins.offChips.map((chip) => `<span class="chip">${esc(chip)}</span>`).join("")}</div>`;
  return `<article class="panel coins" aria-labelledby="coins-posture">
      <span class="label">02 · Coins</span>
      <h2 class="posture-sm posture--${vm.coins.tone}" id="coins-posture">${esc(vm.coins.word)}</h2>
      ${paragraphs}
      ${chips}
    </article>`;
}

function nowPanel(vm: DashboardVM): string {
  const stale = vm.now.stale;
  const chipStyle = stale ? "height:24px;font-size:12px;color:var(--sell)" : "height:24px;font-size:12px";
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
      <div class="panel-head" style="align-items:center"><span class="label">Now · ${esc(vm.now.printLabel)}</span><span class="chip" style="${chipStyle}">${esc(chip)}</span></div>
      <div class="spot">${esc(money(vm.now.spotUsd))}</div>
      <div class="stats">
        <div class="stat well"><span class="k">Gap against the Friday trend</span><span class="v">${esc(signedPercent(vm.now.gapPct))}</span></div>
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
  return `<section class="panel caveats" aria-labelledby="caveats-label"><span class="label" id="caveats-label">04 · Caveats</span><ul class="caveat-list">${items}</ul></section>`;
}

function row2(vm: DashboardVM): string {
  const drawn = charts(vm);
  const caption = [`Spot ${money(vm.now.spotUsd)}.`, ...vm.chart.captions].join(" ");
  const through = sentenceDate(vm.chart.spot.date);
  return `<section class="row row-2">
  <figure class="panel chart" aria-labelledby="chart-title">
    <div class="panel-head"><span class="label" id="chart-title">05 · Price</span><span class="note">Log price · weekly closes · 2013 to ${esc(through)}</span></div>
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
    [legendSwatch("price"), "Price"],
    [legendSwatch("trend"), "Trend"],
    [legendSwatch("upper"), "+55%"],
    [legendSwatch("lower"), "\u221220%"],
    [legendSwatch("average"), "200-week average"],
    [legendSwatch("buy"), "Buy cross"],
    [legendSwatch("sell"), "Sell roll"],
  ] as const;
  return `<ul class="legend" aria-hidden="true">${items.map(([swatch, label]) => `<li>${swatch}${label}</li>`).join("")}</ul>`;
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
    <div class="panel-head"><span class="label" id="context-label">06 · Context</span><span class="note">Official Friday readings</span></div>
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
    <span class="label" id="lv-label">07 · Five and ten years</span>
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
    <div><span class="label">08 · Cycle capture</span><h2 class="cycles-title" id="cyc-title">${esc(title)}</h2></div>
    ${note}
  </div>
  <ul class="key" aria-hidden="true"><li><span class="sw sw--cross"></span>Buy cross</li><li><span class="sw sw--build"></span>Build</li><li><span class="sw sw--lump"></span>Lump in</li></ul>
  <div class="cycle-grid">${cards}</div>
  <p class="note" style="color:var(--text-3);font-size:12px">${esc(vm.cycles.footnote)}</p>
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

function footer(vm: DashboardVM): string {
  return `<footer class="footer"><span>${esc(vm.footer[0])}</span><span>${esc(vm.footer[1])}</span></footer>`;
}

function railItems(
  items: readonly (readonly [string, string])[],
  active: string | null,
  tone: Tone,
): string {
  return items
    .map(([key, label]) => {
      if (active !== key) {
        return `<li>${esc(label)}</li>`;
      }
      return `<li class="is-active tone-${tone}" aria-current="step">${esc(label)}</li>`;
    })
    .join("");
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
