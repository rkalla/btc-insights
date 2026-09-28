import type { DashboardVM, FridayDocument } from "../contract/types.ts";
import { chartMoney, money, sentenceDate } from "../contract/format.ts";

type Dated = { date: string; value: number };
type Fire = FridayDocument["chart"]["fires"][number];
type Rect = { left: number; right: number; top: number; bottom: number };

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const LOWER_LABEL = "\u221220%";
const UPPER_LABEL = "+55%";

export function yPx(price: number, yMin: number, yMax: number, top: number, height: number): number {
  if (!(price > 0) || !(yMin > 0) || !(yMax > yMin)) {
    return top + height;
  }
  const logMin = Math.log10(yMin);
  const logMax = Math.log10(yMax);
  return top + height * (1 - (Math.log10(price) - logMin) / (logMax - logMin));
}

export function chartSvg(
  chart: FridayDocument["chart"],
  spot: DashboardVM["chart"]["spot"],
  width: number,
  markers?: boolean,
): string {
  const phone = width < 768;
  const showMarkers = markers ?? !phone;
  const fontSize = phone ? 11 : 12.5;
  const height = chartHeight(width);
  const margin = phone
    ? { left: 40, right: 58, top: 10, bottom: 24 }
    : { left: 56, right: 92, top: 16, bottom: 32 };
  const plotWidth = Math.max(0, width - margin.left - margin.right);
  const plotHeight = Math.max(0, height - margin.top - margin.bottom);
  const plotRight = margin.left + plotWidth;
  const plotBottom = margin.top + plotHeight;
  const yMinMax = yDomain(chart);
  const yMin = yMinMax.yMin;
  const yMax = yMinMax.yMax;
  const xMin = Date.UTC(2013, 0, 1);
  const spotYear = Number(spot.date.slice(0, 4));
  let xMax = Date.UTC(Number.isFinite(spotYear) ? spotYear : 2013, 11, 31);
  if (xMax <= xMin) {
    xMax = Date.UTC(2013, 11, 31);
  }
  const xSpan = xMax - xMin;

  const xAt = (date: string): number => {
    const t = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
    if (xSpan === 0) {
      return margin.left;
    }
    return margin.left + ((t - xMin) / xSpan) * plotWidth;
  };
  const yAt = (price: number): number => yPx(price, yMin, yMax, margin.top, plotHeight);

  const price = priceSeries(chart, spot);
  const bands = bandRows(chart);
  const buyR = phone ? 4 : 5;
  const sellD = phone ? 4 : 5;
  const ringR = phone ? 8 : 10;
  const fires = sortByDate(chart.fires);
  const sells = fires.filter((fire) => fire.type === "sell" && fire.price > 0);
  const buys = fires.filter((fire) => fire.type === "buy" && fire.price > 0);
  const opens = fires.filter((fire) => fire.status === "open" && fire.price > 0);

  const decades = decadeValues(yMin, yMax);
  const ticks = phone ? decades.filter((_, index) => index % 2 === 0) : decades;
  const grid = ticks
    .map((value) => {
      const y = fmt(yAt(value));
      return `<line class="c-grid" stroke="var(--line)" stroke-width="1" x1="${fmt(margin.left)}" y1="${y}" x2="${fmt(plotRight)}" y2="${y}"/>`;
    })
    .join("");

  const yTicks = ticks
    .map((value) => {
      const y = yAt(value) + fontSize * 0.32;
      return `<text class="c-tick" text-anchor="end" x="${fmt(margin.left - 8)}" y="${fmt(y)}">${esc(chartMoney(value))}</text>`;
    })
    .join("");
  const yearStep = phone ? 4 : 2;
  const endYear = Number(spot.date.slice(0, 4));
  const xTicks: string[] = [];
  for (let year = 2014; year <= endYear; year += yearStep) {
    const y = plotBottom + fontSize + 8;
    xTicks.push(
      `<text class="c-tick" text-anchor="middle" x="${fmt(xAt(`${year}-01-01`))}" y="${fmt(y)}">${year}</text>`,
    );
  }

  const endLabels = endLabelRows(chart, spot, yAt, phone);
  separateLabels(endLabels, fontSize * 1.2);
  const labelX = plotRight + 8;
  const spotLabel = endLabels.find((label) => label.kind === "spot");
  const leader =
    spotLabel !== undefined && Math.abs(spotLabel.y - spotLabel.natural) > 4
      ? `<line class="c-leader" pointer-events="none" x1="${fmt(xAt(spot.date))}" y1="${fmt(spotLabel.natural)}" x2="${fmt(labelX)}" y2="${fmt(spotLabel.y)}" stroke="var(--ink)" stroke-width="1"/>`
      : "";
  const endLabelText = endLabels
    .map((label) => {
      const style = label.kind === "lower" ? ` style="font-weight:400"` : "";
      return `<text class="${label.className}" x="${fmt(labelX)}" y="${fmt(label.y)}"${style}>${esc(label.text)}</text>`;
    })
    .join("");

  const obstacles = [toXY(price, xAt, yAt), toXY(chart.sma200w, xAt, yAt)];
  const openLabels = openLabelText(opens, yAt, ringR, fontSize, {
    left: margin.left,
    right: plotRight,
    top: margin.top,
    bottom: plotBottom,
  }, obstacles);

  const sellMarks = sells
    .map((fire) => sellShape(xAt(fire.date), yAt(fire.price), sellD, fire.date))
    .join("");
  const buyMarks = buys
    .map((fire) => buyShape(xAt(fire.date), yAt(fire.price), buyR, fire.date))
    .join("");
  const rings = opens
    .map((fire) => {
      return `<circle class="m-ring" data-date="${fire.date}" pointer-events="none" fill="none" stroke="var(--buy)" stroke-width="1.4" cx="${fmt(xAt(fire.date))}" cy="${fmt(yAt(fire.price))}" r="${ringR}"/>`;
    })
    .join("");
  const hits = showMarkers
    ? fires
        .filter((fire) => fire.price > 0)
        .map((fire) => {
          const cx = fmt(xAt(fire.date));
          const cy = fmt(yAt(fire.price));
          return `<g class="marker" data-date="${fire.date}" tabindex="0" role="button" aria-label="${esc(markerText(fire))}"><circle class="m-hit" fill="transparent" cx="${cx}" cy="${cy}" r="11"/></g>`;
        })
        .join("")
    : "";

  const buyCount = fires.filter((fire) => fire.type === "buy").length;
  const sellCount = fires.filter((fire) => fire.type === "sell").length;
  const buyPhrase = signalPhrase(buyCount, "buy signal");
  const buyTitle = buyPhrase.charAt(0).toUpperCase() + buyPhrase.slice(1);
  const title =
    `Bitcoin's price on a log scale against its long-run trend, 2013 to ${sentenceDate(spot.date)}. ` +
    `${buyTitle} and ${signalPhrase(sellCount, "caution signal")} are marked. ` +
    `A table of the signals follows the chart.`;

  const svg = [
    `<svg class="chart-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(width)} ${fmt(height)}" width="${fmt(width)}" height="${fmt(height)}" role="img" aria-labelledby="chart-alt" overflow="hidden" style="font-size:${fontSize}px;font-variant-numeric:tabular-nums">`,
    `<title id="chart-alt">${esc(title)}</title>`,
    `<g data-layer="grid" class="grid">${grid}</g>`,
    `<path data-layer="band" class="c-band" fill="var(--neutral-tint)" d="${bandPath(bands, xAt, yAt)}"/>`,
    `<path data-layer="lower" class="c-lo" fill="none" stroke="var(--buy)" stroke-width="1" stroke-dasharray="4 3" d="${linePath(chart.lower, xAt, yAt)}"/>`,
    `<path data-layer="upper" class="c-hi" fill="none" stroke="var(--caution)" stroke-width="1" stroke-dasharray="4 3" d="${linePath(chart.upper, xAt, yAt)}"/>`,
    `<path data-layer="trend" class="c-trend" fill="none" stroke="var(--ink-2)" stroke-width="1.5" d="${linePath(chart.trend, xAt, yAt)}"/>`,
    `<path data-layer="sma200" class="c-w200" fill="none" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="1 4" stroke-linecap="round" d="${linePath(chart.sma200w, xAt, yAt)}"/>`,
    `<path data-layer="price" class="c-price" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round" d="${linePath(price, xAt, yAt)}"/>`,
    `<line data-layer="baseline" class="c-axis" stroke="var(--line-strong)" stroke-width="1" x1="${fmt(margin.left)}" y1="${fmt(plotBottom)}" x2="${fmt(plotRight)}" y2="${fmt(plotBottom)}"/>`,
    `<g data-layer="sell" class="markers-sell">${sellMarks}</g>`,
    `<g data-layer="buy" class="markers-buy">${buyMarks}</g>`,
    `<g data-layer="open" class="open-ring">${rings}</g>`,
    `<g data-layer="selected" class="selected"></g>`,
    `<g class="markers">${hits}</g>`,
    `<g data-layer="labels" class="labels">${yTicks}${xTicks.join("")}${openLabels}${leader}${endLabelText}</g>`,
    `</svg>`,
  ].join("\n");

  return `${svg}\n${fireTable(fires)}`;
}

function chartHeight(width: number): number {
  if (width >= 1280) {
    return width * 0.5;
  }
  if (width >= 1024) {
    return width * 0.45;
  }
  if (width >= 768) {
    return width * 0.55;
  }
  return width * 0.667;
}

function yDomain(chart: FridayDocument["chart"]): { yMin: number; yMax: number } {
  const closes = chart.weekly.map((point) => point.close).filter((value) => value > 0);
  const uppers = chart.upper.map((point) => point.value).filter((value) => value > 0);
  const minClose = closes.length > 0 ? Math.min(...closes) : 1;
  const maxUpper = uppers.length > 0 ? Math.max(...uppers) : minClose * 1.55;
  const yMin = 0.6 * minClose;
  const yMax = 1.8 * maxUpper;
  if (yMax > yMin) {
    return { yMin, yMax };
  }
  return { yMin, yMax: yMin * 10 };
}

function decadeValues(yMin: number, yMax: number): number[] {
  if (!(yMax > yMin) || !(yMin > 0)) {
    return [];
  }
  const first = Math.ceil(Math.log10(yMin) - 1e-9);
  const last = Math.floor(Math.log10(yMax) + 1e-9);
  const values: number[] = [];
  for (let exp = first; exp <= last; exp += 1) {
    const value = 10 ** exp;
    if (value >= yMin && value <= yMax) {
      values.push(value);
    }
  }
  return values;
}

function priceSeries(chart: FridayDocument["chart"], spot: DashboardVM["chart"]["spot"]): Dated[] {
  const points = chart.weekly.map((point) => ({ date: point.date, value: point.close }));
  const index = points.findIndex((point) => point.date === spot.date);
  if (index >= 0) {
    if (spot.value > 0) {
      points[index] = { date: spot.date, value: spot.value };
    }
  } else if (spot.value > 0) {
    points.push({ date: spot.date, value: spot.value });
  }
  return sortByDate(points).filter((point) => point.value > 0);
}

function bandRows(chart: FridayDocument["chart"]): { date: string; lo: number; hi: number }[] {
  const lower = new Map<string, number>();
  for (const point of chart.lower) {
    if (point.value > 0) {
      lower.set(point.date, point.value);
    }
  }
  const rows: { date: string; lo: number; hi: number }[] = [];
  for (const point of sortByDate(chart.upper)) {
    const lo = lower.get(point.date);
    if (lo === undefined || !(point.value > 0)) {
      continue;
    }
    rows.push({ date: point.date, lo, hi: point.value });
  }
  return rows;
}

function bandPath(
  rows: readonly { date: string; lo: number; hi: number }[],
  xAt: (date: string) => number,
  yAt: (price: number) => number,
): string {
  if (rows.length === 0) {
    return "";
  }
  const forward = rows.map((row, index) => {
    const cmd = index === 0 ? "M" : "L";
    return `${cmd}${fmt(xAt(row.date))} ${fmt(yAt(row.hi))}`;
  });
  const back = [...rows].reverse().map((row) => `L${fmt(xAt(row.date))} ${fmt(yAt(row.lo))}`);
  return `${forward.join("")}${back.join("")}Z`;
}

function linePath(
  points: readonly Dated[],
  xAt: (date: string) => number,
  yAt: (price: number) => number,
): string {
  return sortByDate(points)
    .filter((point) => point.value > 0)
    .map((point, index) => {
      const cmd = index === 0 ? "M" : "L";
      return `${cmd}${fmt(xAt(point.date))} ${fmt(yAt(point.value))}`;
    })
    .join("");
}

function toXY(
  points: readonly Dated[],
  xAt: (date: string) => number,
  yAt: (price: number) => number,
): { x: number; y: number }[] {
  return sortByDate(points)
    .filter((point) => point.value > 0)
    .map((point) => ({ x: xAt(point.date), y: yAt(point.value) }));
}

type EndLabel = {
  kind: "upper" | "trend" | "lower" | "spot";
  className: string;
  text: string;
  y: number;
  natural: number;
};

function endLabelRows(
  chart: FridayDocument["chart"],
  spot: DashboardVM["chart"]["spot"],
  yAt: (price: number) => number,
  phone: boolean,
): EndLabel[] {
  const labels: EndLabel[] = [];
  const upper = lastPositive(chart.upper);
  if (upper !== null) {
    const y = yAt(upper.value);
    labels.push({ kind: "upper", className: "c-lbl-sell", text: UPPER_LABEL, y, natural: y });
  }
  const trend = lastPositive(chart.trend);
  if (!phone && trend !== null) {
    const y = yAt(trend.value);
    labels.push({ kind: "trend", className: "c-lbl-muted", text: chart.trendLabel, y, natural: y });
  }
  const lower = lastPositive(chart.lower);
  if (lower !== null) {
    const y = yAt(lower.value);
    labels.push({ kind: "lower", className: "c-lbl-buy", text: LOWER_LABEL, y, natural: y });
  }
  if (spot.value > 0) {
    const y = yAt(spot.value);
    labels.push({ kind: "spot", className: "c-lbl-spot", text: money(spot.value), y, natural: y });
  }
  labels.sort((a, b) => a.y - b.y);
  return labels;
}

// End labels stay at least 1.2em apart. Callers draw a spot leader only after a push past 4px.
function separateLabels(labels: EndLabel[], gap: number): void {
  for (let i = 1; i < labels.length; i += 1) {
    const prev = labels[i - 1];
    const item = labels[i];
    if (prev === undefined || item === undefined) {
      continue;
    }
    if (item.y < prev.y + gap) {
      item.y = prev.y + gap;
    }
  }
}

function lastPositive(points: readonly Dated[]): Dated | null {
  const sorted = sortByDate(points).filter((point) => point.value > 0);
  return sorted[sorted.length - 1] ?? null;
}

function sellShape(cx: number, cy: number, half: number, date: string): string {
  const d = `M${fmt(cx)} ${fmt(cy - half)}L${fmt(cx + half)} ${fmt(cy)}L${fmt(cx)} ${fmt(cy + half)}L${fmt(cx - half)} ${fmt(cy)}Z`;
  return `<path class="m-sell" data-date="${date}" pointer-events="none" fill="var(--caution)" stroke="var(--card)" stroke-width="1.2" d="${d}"/>`;
}

function buyShape(cx: number, cy: number, radius: number, date: string): string {
  return `<circle class="m-buy" data-date="${date}" pointer-events="none" fill="var(--buy)" stroke="var(--card)" stroke-width="1.2" cx="${fmt(cx)}" cy="${fmt(cy)}" r="${radius}"/>`;
}

function markerText(fire: Fire): string {
  const month = Number(fire.date.slice(5, 7));
  const day = Number(fire.date.slice(8, 10));
  const year = fire.date.slice(0, 4);
  const monthName = FULL_MONTHS[month - 1] ?? year;
  const name = plainSignal(fire.titleLabel);
  if (fire.type === "sell") {
    return `${name}, ${monthName} ${year}.`;
  }
  const when = `${day} ${monthName} ${year}`;
  if (fire.status === "open") {
    return `${name}, ${when}. Open, not in the completed count.`;
  }
  const pct = fire.resultLabel.replace(/^Finished year:?\s*/i, "").replace(/\.$/, "");
  return `${name}, ${when}. Finished year ${pct}.`;
}

export function plainSignal(label: string): string {
  if (/sell roll/i.test(label)) return "Caution signal";
  if (/buy cross/i.test(label)) return "Buy strongly signal";
  return label;
}

// The open-fire label steps 4px until its box clears the price and 200-week lines.
function openLabelText(
  opens: readonly Fire[],
  yAt: (price: number) => number,
  ringR: number,
  fontSize: number,
  plot: Rect,
  obstacles: readonly { x: number; y: number }[][],
): string {
  const ascent = fontSize * 0.8;
  const descent = fontSize * 0.2;
  const gap = fontSize * 1.2;
  let previous = Number.NEGATIVE_INFINITY;
  const labels: string[] = [];
  for (const fire of opens) {
    const text = `${sentenceDate(fire.date)} \u00b7 open`;
    const width = text.length * fontSize * 0.62;
    const right = plot.right - 2;
    const left = right - width;
    const markerY = yAt(fire.price);
    const blocked = (baseline: number): boolean => {
      const box = {
        left: left - 2,
        right: right + 2,
        top: baseline - ascent - 2,
        bottom: baseline + descent + 2,
      };
      const inside = (x: number, y: number) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
      return obstacles.some((line) => {
        for (const point of line) {
          if (inside(point.x, point.y)) {
            return true;
          }
        }
        for (let i = 1; i < line.length; i += 1) {
          const a = line[i - 1];
          const b = line[i];
          if (a === undefined || b === undefined) {
            continue;
          }
          if (
            inside(a.x, a.y) ||
            inside(b.x, b.y) ||
            segmentsCross(a.x, a.y, b.x, b.y, box.left, box.top, box.right, box.top) ||
            segmentsCross(a.x, a.y, b.x, b.y, box.right, box.top, box.right, box.bottom) ||
            segmentsCross(a.x, a.y, b.x, b.y, box.right, box.bottom, box.left, box.bottom) ||
            segmentsCross(a.x, a.y, b.x, b.y, box.left, box.bottom, box.left, box.top)
          ) {
            return true;
          }
        }
        return false;
      });
    };
    const below = firstClear(markerY + ringR + 4 + ascent, 4, plot.bottom - descent, blocked);
    const above = below === null ? firstClear(markerY - ringR - 4 - descent, -4, plot.top + ascent, blocked) : null;
    let baseline = below ?? above ?? markerY + ringR + 4 + ascent;
    if (baseline < previous + gap) {
      baseline = previous + gap;
    }
    previous = baseline;
    labels.push(
      `<text class="c-lbl-buy" data-date="${fire.date}" text-anchor="end" x="${fmt(right)}" y="${fmt(baseline)}">${esc(text)}</text>`,
    );
  }
  return labels.join("");
}

function firstClear(
  start: number,
  step: number,
  limit: number,
  blocked: (baseline: number) => boolean,
): number | null {
  let y = start;
  const down = step > 0;
  for (let steps = 0; steps < 200; steps += 1) {
    if (down ? y > limit : y < limit) {
      return null;
    }
    if (!blocked(y)) {
      return y;
    }
    y += step;
  }
  return null;
}

function segmentsCross(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const d1 = orient(cx, cy, dx, dy, ax, ay);
  const d2 = orient(cx, cy, dx, dy, bx, by);
  const d3 = orient(ax, ay, bx, by, cx, cy);
  const d4 = orient(ax, ay, bx, by, dx, dy);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function fireTable(fires: readonly Fire[]): string {
  const rows = fires
    .map((fire) => {
      return `<tr><td>${esc(plainSignal(fire.titleLabel))}</td><td><time datetime="${fire.date}">${esc(sentenceDate(fire.date))}</time></td><td>${esc(fire.resultLabel)}</td></tr>`;
    })
    .join("");
  return (
    `<div class="sr-only">` +
    `<table><caption>Signals shown on the chart</caption>` +
    `<thead><tr><th>Signal</th><th>Date</th><th>Finished year</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`
  );
}

function signalPhrase(count: number, noun: string): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const name = count === 1 ? noun : `${noun}s`;
  return `${words[count] ?? String(count)} ${name}`;
}

function sortByDate<T extends { date: string }>(points: readonly T[]): T[] {
  return [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) {
    return "0";
  }
  const rounded = Math.round(n * 100) / 100;
  if (rounded === 0) {
    return "0";
  }
  return String(rounded);
}

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
