import { colorModeBoot } from "../painter/color-mode.ts";
import { siteFooter, siteHeader } from "../painter/site-header.ts";
import type { VisitorsReport } from "./log.ts";

export const VISITORS_POLL_MS = 60_000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type VisitorsPollState = {
  visible: boolean;
  timerArmed: boolean;
};

export type VisitorsPollEvent =
  | { type: "visibility"; visible: boolean }
  | { type: "timer" };

export type VisitorsPollCommand =
  | { type: "fetch" }
  | { type: "schedule"; ms: number }
  | { type: "clear" };

export function visitorsShell(iconLinks: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${colorModeBoot()}
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Visitors · BTC Friday</title>
${iconLinks}
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/visitors.css">
</head>
<body>
${siteHeader(null)}
<main class="page"></main>
${siteFooter()}
<script type="module" src="/assets/visitors.js"></script>
</body>
</html>
`;
}

export function reduceVisitorsPoll(
  state: VisitorsPollState,
  event: VisitorsPollEvent,
): { state: VisitorsPollState; commands: VisitorsPollCommand[] } {
  if (event.type === "visibility" && !event.visible) {
    return {
      state: { visible: false, timerArmed: false },
      commands: state.timerArmed ? [{ type: "clear" }] : [],
    };
  }
  if (event.type === "timer" && !state.visible) {
    return { state, commands: [] };
  }
  return {
    state: { visible: true, timerArmed: true },
    commands: [
      { type: "fetch" },
      { type: "schedule", ms: VISITORS_POLL_MS },
    ],
  };
}

function dayParts(date: string): { day: number; month: string; year: string } {
  const [year, month, day] = date.split("-");
  return {
    day: Number(day),
    month: MONTHS[Number(month) - 1] ?? "",
    year: year ?? "",
  };
}

function dayLabel(date: string): string {
  const parts = dayParts(date);
  return `${parts.day} ${parts.month}`;
}

function updatedLabel(asOf: string): string {
  const date = asOf.slice(0, 10);
  const time = asOf.slice(11, 16);
  const parts = dayParts(date);
  return `Updated ${parts.day} ${parts.month} ${parts.year}, ${time} UTC`;
}

function barHeight(value: number, max: number): number {
  if (value <= 0) return 0;
  return Math.round((value / max) * 150);
}

function chart(report: VisitorsReport): string {
  const days = report.days;
  const max = Math.max(1, ...days.flatMap((day) => [day.people, day.bots, day.scanners]));
  const width = 640;
  const pad = 28;
  const slot = (width - pad * 2) / Math.max(days.length, 1);
  const barW = Math.min(16, Math.max(4, (slot - 10) / 3));
  const rects: string[] = [];
  const labels: string[] = [];
  days.forEach((day, index) => {
    const center = pad + (slot * index) + (slot / 2);
    const origin = center - ((barW * 3) + 4) / 2;
    const series = [
      ["bar-people", day.people],
      ["bar-bots", day.bots],
      ["bar-scanners", day.scanners],
    ] as const;
    series.forEach(([name, value], seriesIndex) => {
      const height = barHeight(value, max);
      const x = Math.round(origin + (seriesIndex * (barW + 2)));
      const y = 8 + 150 - height;
      rects.push(
        `<rect x="${x}" y="${y}" class="bar ${name}" data-date="${day.date}" height="${height}" width="${Math.round(barW)}"></rect>`,
      );
    });
    labels.push(
      `<text x="${Math.round(center)}" y="186" text-anchor="middle">${dayLabel(day.date)}</text>`,
    );
  });
  return `<svg class="chart-svg" viewBox="0 0 640 200" role="img" aria-hidden="true">${rects.join("")}${labels.join("")}</svg>`;
}

function uniqueCell(uniques: number | null): string {
  return uniques == null ? "Not recorded" : String(uniques);
}

export function visitorsMarkup(report: VisitorsReport): string {
  const latest = report.days[report.days.length - 1];
  const summary = latest == null
    ? ""
    : `<dl class="stats">
  <div><dt>People</dt><dd>${latest.people}</dd></div>
  <div><dt>Unique addresses</dt><dd${latest.uniques == null ? ' class="stat-words"' : ""}>${uniqueCell(latest.uniques)}</dd></div>
  <div><dt>Bots</dt><dd>${latest.bots}</dd></div>
  <div><dt>Scanners</dt><dd>${latest.scanners}</dd></div>
</dl>`;
  const rows = report.days.map((day) => `<tr><th scope="row">${dayLabel(day.date)}</th><td>${day.people}</td><td>${uniqueCell(day.uniques)}</td><td>${day.bots}</td><td>${day.scanners}</td></tr>`).join("");
  const chartBlock = report.days.length === 0
    ? `<p class="intro">No log lines yet.</p>`
    : `<figure class="panel chart">
  <ul class="legend">
    <li><i class="swatch-people"></i>People</li>
    <li><i class="swatch-bots"></i>Bots</li>
    <li><i class="swatch-scanners"></i>Scanners</li>
  </ul>
  ${chart(report)}
</figure>
<div class="counts-scroll">
<table class="counts">
  <caption class="sr-only">Visitor counts by day</caption>
  <thead><tr><th>Day</th><th>People</th><th>Unique addresses</th><th>Bots</th><th>Scanners</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</div>`;
  return `<h1>Visitors</h1>
<p class="intro">Counts from the server log. People and bots are page views. Scanners are probes.</p>
<p class="asof">${updatedLabel(report.asOf)}</p>
${summary}
${chartBlock}
<p class="note">Days are UTC. This page reloads the counts about once a minute while it is open.</p>
<p class="note">Unique addresses count people the log can tell apart. Lines from before the log stored that address stay out of the unique count.</p>`;
}

export function nextVisitorsView(
  previousHtml: string,
  result: { ok: true; report: VisitorsReport } | { ok: false },
): string {
  if (result.ok) return visitorsMarkup(result.report);
  if (previousHtml.trim() !== "") return previousHtml;
  return `<p class="intro" role="alert">The visitor counts are not available.</p>`;
}
