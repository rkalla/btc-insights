import type { PlainView } from "../compose/plain.ts";
import type { WeekCopy } from "../copy/thisWeek.ts";
import { colorModeBoot } from "./color-mode.ts";
import { siteFooter, siteHeader } from "./site-header.ts";

export const WEEK_LOADING = "Loading this week's advice.";
export const WEEK_NEEDS_JS = "This week needs JavaScript to show the advice.";
export const WEEK_LOAD_ERROR = "The advice could not load. Nothing here is a call.";
export const WEEK_TRY_AGAIN = "Try again";
export const WEEK_SCALE_LABEL = "Advice scale, from most cautious to most eager";

const EVIDENCE_HREF = "/evidence/";
const SETTINGS_HREF = "/settings.html";

const STEPS = [
  ["Pause", "caution"],
  ["Go slow", "caution"],
  ["Steady", "neutral"],
  ["Add", "buy"],
  ["Buy strongly", "buy"],
] as const;

export function thisWeekShell(iconLinks: string): string {
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
${colorModeBoot()}
<script>document.documentElement.classList.remove("no-js")</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>This week · BTC Friday</title>
${iconLinks}
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/this-week.css">
</head>
<body>
${siteHeader("week")}
<p class="notice">${WEEK_NEEDS_JS}</p>
<div id="sheet">
<main id="week" class="page" aria-busy="true">
<p class="boot">${WEEK_LOADING}</p>
</main>
</div>
<script type="module" src="/assets/this-week.js"></script>
</body>
</html>
`;
}

export function paintThisWeek(view: PlainView): string {
  return `<main id="week" class="page">
${metaLine(view.copy)}
${verdict(view)}
${todo(view)}
${why(view)}
${recordSection(view)}
${risk(view)}
${priceBlock(view.copy)}
${evidenceLink(view.copy)}
</main>
${siteFooter()}`;
}

function metaLine(copy: WeekCopy): string {
  const update = copy.updateLine == null ? "" : `${esc(copy.updateLine)}<br>`;
  return `<p class="meta">${update}${esc(copy.disclaimer)} <a href="#about">Read more</a></p>`;
}

function verdict(view: PlainView): string {
  const banner = view.copy.banner == null
    ? ""
    : `<p class="stale" role="status">${warnIcon()}<span>${esc(view.copy.banner)}</span></p>`;
  const note = view.copy.replacesPause == null
    ? ""
    : `<p class="sub sub--note">${infoIcon()}<span>${esc(view.copy.replacesPause)}</span></p>`;
  return `<section class="card verdict tone-${view.tone}" aria-labelledby="headline">
${banner}
<h1 class="headline" id="headline">${esc(view.copy.headline)}</h1>
<p class="sub">${esc(view.copy.underHeadline)}</p>
${note}
${scale(view)}
${trackLine(view.copy)}
</section>`;
}

function scale(view: PlainView): string {
  const items = STEPS.map(([name, tone]) => {
    const current = view.step === name;
    const here = current ? `<span class="sr-only"> (this week)</span>` : "";
    const currentAttr = current ? ` aria-current="step"` : "";
    return `<li class="tone-${tone}"${currentAttr}><span class="dot" aria-hidden="true"></span><span class="lab">${esc(name)}${here}</span></li>`;
  }).join("");
  return `<div class="scale-wrap"><ol class="scale" role="list" aria-label="${WEEK_SCALE_LABEL}">${items}</ol><p class="scale-note">${esc(view.copy.scaleNote)}</p></div>`;
}

function trackLine(copy: WeekCopy): string {
  if (copy.track == null || copy.trackLabel == null) return "";
  return `<p class="track"><b>${esc(copy.trackLabel)}</b> ${esc(copy.track)}</p>`;
}

function todo(view: PlainView): string {
  const items = view.copy.actions.map((action) => `<li><span>${emphasize(action)}</span></li>`).join("");
  const after = view.copy.after == null ? "" : `<p class="after">${esc(view.copy.after)}</p>`;
  const callout = view.copy.callout == null
    ? ""
    : `<p class="callout">${clockIcon()}<span>${esc(view.copy.callout)}</span></p>`;
  const personal = view.copy.personalise == null ? "" : `<p class="personal">${linkSettings(view.copy.personalise)}</p>`;
  return `<section class="card todo tone-${view.tone}" aria-labelledby="todo-h"><div class="card-head"><h2 id="todo-h">What to do</h2>${chipHtml(view)}</div><ol class="steps" role="list">${items}</ol>${after}${callout}${personal}</section>`;
}

function chipHtml(view: PlainView): string {
  const chip = view.copy.chip;
  if (chip == null) return "";
  if (view.state === "BUY_STRONGLY") {
    return `<span class="chip chip--deadline tone-${view.tone}">${clockIcon()}${esc(chip)}</span>`;
  }
  return `<span class="chip chip--until">${esc(chip)}</span>`;
}

function why(view: PlainView): string {
  const flagged = goldIndex(view);
  const items = view.copy.why
    .map((line, index) => `<li${index === flagged ? ` class="flag"` : ""}>${esc(line)}</li>`)
    .join("");
  return `<section class="card why" aria-labelledby="why-h"><div class="card-head"><h2 id="why-h">Why</h2></div><ul class="bullets">${items}</ul></section>`;
}

function goldIndex(view: PlainView): number {
  if (!view.gold) return -1;
  const index = view.copy.why.length - (view.takeProfit ? 2 : 1);
  return index >= 0 && index < view.copy.why.length ? index : -1;
}

function recordSection(view: PlainView): string {
  const worked = view.copy.worked;
  if (worked == null) return "";
  const split = splitFirstSentence(worked);
  const caption = view.copy.tileCaption;
  const described = caption == null ? "" : ` aria-describedby="tile-cap"`;
  const captionHtml = caption == null ? "" : `<p class="tile-cap" id="tile-cap">${esc(caption)}</p>`;
  const tiles = view.copy.tiles.length === 0
    ? ""
    : `<ul class="tiles" role="list"${described}>${view.copy.tiles.map(tileItem).join("")}</ul>${captionHtml}`;
  const body = split.body === "" ? "" : `<p class="record-body">${esc(split.body)}</p>`;
  return `<section class="card record" aria-labelledby="rec-h"><div class="card-head"><h2 id="rec-h">Has this worked before?</h2></div><p class="answer"><b>${esc(split.answer)}</b></p>${tiles}${body}</section>`;
}

function tileItem(line: string): string {
  const space = line.indexOf(" ");
  const year = space < 0 ? line : line.slice(0, space);
  const value = space < 0 ? "" : line.slice(space + 1);
  if (value === "In progress") {
    return `<li class="tile tile--open"><span class="yr">${esc(year)}</span><span class="val">${esc(value)}</span></li>`;
  }
  return `<li class="tile"><span class="yr">${esc(year)}</span><span class="val num">${esc(value)}</span></li>`;
}

function risk(view: PlainView): string {
  const lines = view.copy.risks.map((line) => `<p>${esc(line)}</p>`).join("");
  const close = view.copy.riskClose == null ? "" : `<p><strong>${esc(view.copy.riskClose)}</strong></p>`;
  return `<section class="card risk" aria-labelledby="risk-h"><div class="card-head">${warnIcon()}<h2 id="risk-h">What could go wrong</h2></div>${lines}${close}</section>`;
}

function priceBlock(copy: WeekCopy): string {
  const parts = priceParts(copy.price);
  const row = parts == null
    ? `<p class="price-line">${esc(copy.price)}</p>`
    : `<div class="price-row"><span class="price-label">${esc(parts.label)}</span><span class="price-val num">${esc(parts.amount)}</span><span class="price-time">${esc(parts.when)}</span></div>`;
  return `<section class="price" aria-label="Bitcoin today">${row}<p class="price-note">${esc(copy.underPrice)}</p></section>`;
}

function priceParts(price: string): { label: string; amount: string; when: string } | null {
  const prefix = "Bitcoin today ";
  if (!price.startsWith(prefix) || !price.endsWith(".")) return null;
  const rest = price.slice(prefix.length, -1);
  const at = rest.indexOf(", ");
  if (at <= 0) return null;
  return { label: "Bitcoin today", amount: rest.slice(0, at), when: rest.slice(at + 2) };
}

function evidenceLink(copy: WeekCopy): string {
  return `<a class="evidence" href="${EVIDENCE_HREF}"><span class="copy"><span class="t">${esc(copy.evidence)}</span><span class="s">${esc(copy.evidenceSub)}</span></span>${arrowIcon()}</a>`;
}

function linkSettings(text: string): string {
  const parts = text.split("Settings");
  if (parts.length === 1) return esc(text);
  return parts.map((part) => esc(part)).join(`<a href="${SETTINGS_HREF}">Settings</a>`);
}

function splitFirstSentence(text: string): { answer: string; body: string } {
  const match = /^[\s\S]*?[.!?](?=\s|$)/.exec(text);
  if (match == null) return { answer: text, body: "" };
  return { answer: match[0].trim(), body: text.slice(match[0].length).trim() };
}

function emphasize(text: string): string {
  let html = esc(text);
  html = html.replace(
    /Put (.+?) into Bitcoin by (.+?) your time/,
    'Put <strong>$1</strong> into Bitcoin by <strong class="nw">$2</strong> your time',
  );
  html = html.replace(
    /Put (.+?) into Bitcoin when you have it/,
    "Put <strong>$1</strong> into Bitcoin when you have it",
  );
  html = html.replace(/Add (.+?) to Bitcoin this week/, "Add <strong>$1</strong> to Bitcoin this week");
  html = html.replace(/Finish by ([^.]+)\./, "Finish by <strong>$1</strong>.");
  html = html.replace(/happened by (.+?), that/, "happened by <strong>$1</strong>, that");
  return html.replace(/\$\d[\d,]*(?:\.\d+)?/g, (amount, index: number, source: string) => {
    const open = source.lastIndexOf("<strong", index);
    const alreadyStrong = open >= 0 && source.lastIndexOf("</strong>", index) < open;
    if (source[index - 1] === "(" || alreadyStrong) return amount;
    return `<strong>${amount}</strong>`;
  });
}

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function warnIcon(): string {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>`;
}

function clockIcon(): string {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
}

function infoIcon(): string {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`;
}

function arrowIcon(): string {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
}
