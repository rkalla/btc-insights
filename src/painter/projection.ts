import { chartMoney } from "../contract/format.ts";
import { yPx } from "./chart.ts";
import { colorModeBoot } from "./color-mode.ts";
import { siteFooter, siteHeader } from "./site-header.ts";
import type { ProjectionBlank, ProjectionPoint, ProjectionReady } from "../projection/portfolio.ts";

export function projectionShell(iconLinks: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${colorModeBoot()}
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Projection · BTC Friday</title>
${iconLinks}
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/projection.css">
</head>
<body>
${siteHeader("projection")}
<main class="page" id="projection">
  <h1>Projection</h1>
  <p class="note">Loading the replay.</p>
</main>
${siteFooter()}
<script type="module" src="/assets/projection.js"></script>
</body>
</html>
`;
}

export function paintProjection(model: ProjectionReady | ProjectionBlank): string {
  const leads = `<p>${esc(model.leads[0])}</p><p>${esc(model.leads[1])}</p>`;
  if (model.status === "blank") {
    return `<h1 id="projection-title">Projection</h1><div class="lede">${leads}<p><a href="/settings.html">${esc(model.message)}</a></p></div>`;
  }
  const stale = model.stale == null ? "" : `<p class="note">${esc(model.stale)}</p>`;
  const chart = model.chart ? chartBlock(model) : "";
  const numbers =
    model.numbers.length === 0
      ? ""
      : `<details class="numbers"><summary>Show the numbers</summary>${model.numbers.map((line) => `<p>${esc(line)}</p>`).join("")}</details>`;
  return `<h1 id="projection-title">Projection</h1><div class="lede">${leads}<p>${esc(model.input)}</p>${stale}</div>${chart}${numbers}`;
}

function chartBlock(model: ProjectionReady): string {
  const readings = model.readings.map((line) => `<li>${esc(line)}</li>`).join("");
  return `<figure class="chart" aria-labelledby="projection-title">
    ${projectionSvg(model.points)}
    <figcaption>${esc(model.caption)}</figcaption>
    <ul class="legend">
      <li><span class="swatch swatch--line" aria-hidden="true"></span>Your Bitcoin</li>
      <li><span class="swatch swatch--high" aria-hidden="true"></span>High</li>
      <li><span class="swatch swatch--low" aria-hidden="true"></span>Low</li>
    </ul>
    <ul class="readings">${readings}</ul>
  </figure>`;
}

export function projectionSvg(points: readonly ProjectionPoint[]): string {
  const plotted = points.filter((point) => point.value > 0);
  if (plotted.length === 0) return "";
  const width = 640;
  const height = 420;
  const margin = { left: 56, right: 16, top: 16, bottom: 32 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const plotRight = margin.left + plotWidth;
  const plotBottom = margin.top + plotHeight;
  const values = plotted.map((point) => point.value);
  const yMin = 10 ** Math.floor(Math.log10(Math.min(...values)));
  const yMax = 10 ** Math.ceil(Math.log10(Math.max(...values) * 1.001));
  const safeMax = yMax > yMin ? yMax : yMin * 10;
  const xMin = utcMs(plotted[0]!.date);
  const xMax = utcMs(plotted[plotted.length - 1]!.date);
  const xSpan = Math.max(1, xMax - xMin);
  const xAt = (date: string): number => margin.left + ((utcMs(date) - xMin) / xSpan) * plotWidth;
  const yAt = (value: number): number => yPx(value, yMin, safeMax, margin.top, plotHeight);

  const ticks: number[] = [];
  for (let value = yMin; value <= safeMax * 1.001; value *= 10) ticks.push(value);
  const grid = ticks
    .map((value) => {
      const y = fmt(yAt(value));
      return `<line stroke="var(--line)" stroke-width="1" x1="${fmt(margin.left)}" y1="${y}" x2="${fmt(plotRight)}" y2="${y}"/>`;
    })
    .join("");
  const yLabels = ticks
    .map((value) => `<text class="tick" text-anchor="end" x="${fmt(margin.left - 8)}" y="${fmt(yAt(value) + 4)}">${esc(chartMoney(value))}</text>`)
    .join("");
  const startYear = Number(plotted[0]!.date.slice(0, 4));
  const endYear = Number(plotted[plotted.length - 1]!.date.slice(0, 4));
  const xLabels: string[] = [];
  const firstDate = plotted[0]!.date;
  const lastDate = plotted[plotted.length - 1]!.date;
  for (let year = startYear + (startYear % 4 === 0 ? 0 : 4 - (startYear % 4)); year <= endYear; year += 4) {
    const tick = `${year}-01-01`;
    if (tick < firstDate || tick > lastDate) continue;
    xLabels.push(
      `<text class="tick" text-anchor="middle" x="${fmt(xAt(tick))}" y="${fmt(plotBottom + 20)}">${year}</text>`,
    );
  }

  let path = "";
  for (const point of plotted) {
    const command = path === "" ? "M" : "L";
    path += `${command}${fmt(xAt(point.date))} ${fmt(yAt(point.value))}`;
  }
  const marks = plotted
    .filter((point) => point.mark != null)
    .map((point) => {
      const cx = fmt(xAt(point.date));
      const cy = fmt(yAt(point.value));
      if (point.mark === "low") {
        return `<circle fill="none" stroke="var(--ink-2)" stroke-width="1.6" cx="${cx}" cy="${cy}" r="4"/>`;
      }
      return `<circle fill="var(--ink-2)" cx="${cx}" cy="${cy}" r="3.5"/>`;
    })
    .join("");

  return `<svg class="projection-svg" aria-hidden="true" viewBox="0 0 ${width} ${height}" width="100%" height="auto">
    ${grid}
    <path fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round" d="${path}"/>
    ${marks}
    <line stroke="var(--line-strong)" stroke-width="1" x1="${fmt(margin.left)}" y1="${fmt(plotBottom)}" x2="${fmt(plotRight)}" y2="${fmt(plotBottom)}"/>
    ${yLabels}${xLabels.join("")}
  </svg>`;
}

function esc(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function fmt(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

function utcMs(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}
