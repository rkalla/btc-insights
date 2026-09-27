import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { DashboardVM, FridayDocument } from "../src/contract/types.ts";
import { chartSvg, yPx } from "../src/painter/chart.ts";

type Chart = FridayDocument["chart"];
type Spot = DashboardVM["chart"]["spot"];

const LAYERS = [
  "grid",
  "band",
  "lower",
  "upper",
  "trend",
  "sma200",
  "price",
  "baseline",
  "sell",
  "buy",
  "open",
  "selected",
  "labels",
];

function fridayChart(): Chart {
  const text = readFileSync(new URL("../fixtures/friday-2026-09-25.json", import.meta.url), "utf8");
  const friday = JSON.parse(text) as FridayDocument;
  return friday.chart;
}

function spotOf(date: string, value: number): Spot {
  return { date, value };
}

function near(actual: number, expected: number, tolerance = 0.01): void {
  assert.equal(Math.abs(actual - expected) <= tolerance, true, `${actual} vs ${expected}`);
}

function layersOf(svg: string): string[] {
  return [...svg.matchAll(/data-layer="([^"]+)"/g)].map((match) => match[1] ?? "");
}

function groupWith(svg: string, token: string): string {
  const at = svg.indexOf(token);
  assert.equal(at >= 0, true, token);
  const open = svg.lastIndexOf("<g", at);
  const close = svg.indexOf("</g>", at);
  return svg.slice(open, close);
}

function labelBaselines(svg: string): number[] {
  const ys: number[] = [];
  for (const match of svg.matchAll(/<text\b([^>]*)>/g)) {
    const attrs = match[1] ?? "";
    if (!attrs.includes('class="c-lbl-')) {
      continue;
    }
    const y = attrs.match(/\by="([\d.]+)"/);
    if (y?.[1] !== undefined) {
      ys.push(Number(y[1]));
    }
  }
  return ys.sort((a, b) => a - b);
}

function flatChart(): Chart {
  const dates = ["2016-01-01", "2020-01-01", "2024-01-01"];
  const base = 10000;
  return {
    weekly: dates.map((date) => ({ date, close: base })),
    trend: dates.map((date) => ({ date, value: base })),
    lower: dates.map((date) => ({ date, value: base * 0.99 })),
    upper: dates.map((date) => ({ date, value: base * 1.01 })),
    sma200w: dates.map((date) => ({ date, value: base })),
    fires: [],
    trendLabel: "Trend $10k",
    captions: [],
  };
}

test("yPx uses a fixed log box", () => {
  const box = { yMin: 10, yMax: 1000, top: 0, height: 100 };
  const y10 = yPx(10, box.yMin, box.yMax, box.top, box.height);
  const y100 = yPx(100, box.yMin, box.yMax, box.top, box.height);
  const y1000 = yPx(1000, box.yMin, box.yMax, box.top, box.height);
  near(y10, 100);
  near(y100, 50);
  near(y1000, 0);
  assert.equal(y1000 < y100, true);
  assert.equal(y100 < y10, true);
  assert.equal(Math.abs((y10 - y100) - (y100 - y1000)) <= 0.01, true);
});

test("July 2020 buy marker stays when the close is above the lower band", () => {
  const close = 11338;
  const trend = 12000;
  const lower = trend * 0.8;
  assert.equal(close > lower, true);
  assert.equal(Math.abs(close - trend) < Math.abs(close - lower), true);
  const chart: Chart = {
    weekly: [
      { date: "2020-07-24", close: 10000 },
      { date: "2020-07-31", close },
    ],
    trend: [
      { date: "2020-07-24", value: 11000 },
      { date: "2020-07-31", value: trend },
    ],
    lower: [
      { date: "2020-07-24", value: 11000 * 0.8 },
      { date: "2020-07-31", value: lower },
    ],
    upper: [
      { date: "2020-07-24", value: 11000 * 1.55 },
      { date: "2020-07-31", value: trend * 1.55 },
    ],
    sma200w: [{ date: "2020-07-31", value: 9000 }],
    fires: [
      {
        type: "buy",
        date: "2020-07-31",
        price: close,
        status: "completed",
        titleLabel: "Buy cross",
        resultLabel: "Finished year: +269%",
      },
    ],
    trendLabel: "Trend $12k",
    captions: [],
  };
  const width = 1280;
  const svg = chartSvg(chart, spotOf("2020-07-31", close), width);
  const buy = svg.match(/<circle class="m-buy"[^>]*data-date="2020-07-31"[^>]*>/)?.[0] ?? "";
  assert.equal(buy.includes('pointer-events="none"'), true);
  const hit = groupWith(svg, 'class="marker" data-date="2020-07-31"');
  assert.equal(hit.includes('tabindex="0"'), true);
  assert.equal(hit.includes('role="button"'), true);
  assert.equal(hit.includes('r="11"'), true);
  assert.equal(hit.includes('class="m-buy"'), false);
  const yMin = 0.6 * 10000;
  const yMax = 1.8 * trend * 1.55;
  const plotHeight = width * 0.5 - 16 - 32;
  const yClose = yPx(close, yMin, yMax, 16, plotHeight);
  const yLower = yPx(lower, yMin, yMax, 16, plotHeight);
  assert.equal(yClose < yLower, true);
  const cy = Number(buy.match(/cy="([\d.]+)"/)?.[1]);
  near(cy, yClose, 0.02);
});

test("fixture chart marks fires, the open ring, and no floor band", () => {
  const chart = fridayChart();
  const spot = spotOf("2026-09-25", 84413);
  const svg = chartSvg(chart, spot, 1280);
  assert.equal(svg.startsWith("<svg"), true);
  assert.equal(svg.includes('role="img"'), true);
  assert.equal(svg.includes("<title"), true);
  assert.equal(
    svg.includes("Five buy-cross fires and eight sell-roll fires are marked."),
    true,
  );
  assert.deepEqual(layersOf(svg), LAYERS);
  assert.equal(/data-layer="selected"[^>]*>\s*<\/g>/.test(svg), true);
  assert.equal(svg.toLowerCase().includes("floor"), false);
  assert.equal(svg.includes("M56.0 390.7"), false);

  const march = groupWith(svg, 'class="marker" data-date="2023-03-17"');
  assert.equal(march.includes('tabindex="0"'), true);
  assert.equal(march.includes('role="button"'), true);
  assert.equal(march.includes('r="11"'), true);
  assert.equal(march.includes("Buy cross, 17 March 2023. Finished year +138%."), true);
  assert.equal(/tabindex="[1-9]/.test(svg), false);
  const buttonDates = [...svg.matchAll(/<g class="marker" data-date="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(buttonDates, chart.fires.map((fire) => fire.date).sort());
  assert.equal(svg.indexOf('class="open-ring"') < svg.indexOf('class="markers"'), true);
  assert.equal(svg.indexOf('class="markers-sell"') < svg.indexOf('class="markers"'), true);

  const rings = [...svg.matchAll(/<circle\b[^>]*class="m-ring"[^>]*>/g)].map((match) => match[0]);
  assert.equal(rings.length, 1);
  const ring = rings[0] ?? "";
  assert.equal(ring.includes('data-date="2026-09-18"'), true);
  assert.equal(ring.includes('pointer-events="none"'), true);
  assert.equal(ring.includes('r="10"'), true);
  assert.equal(svg.includes("18 Sep 2026 \u00b7 open"), true);

  const rows = svg.match(/<tr><td>/g);
  assert.equal(rows?.length, chart.fires.length);
  for (const fire of chart.fires) {
    assert.equal(svg.includes(`datetime="${fire.date}"`), true, fire.date);
    assert.equal(svg.includes(fire.resultLabel), true, fire.date);
  }
  assert.equal(svg.includes('class="sr-only"'), true);
});

test("Trend label is omitted under 768 and kept at 768", () => {
  const chart = fridayChart();
  const spot = spotOf("2026-09-25", 84413);
  const phone = chartSvg(chart, spot, 767);
  const desk = chartSvg(chart, spot, 768);
  assert.equal(phone.includes(chart.trendLabel), false);
  assert.equal(phone.includes('role="button"'), false);
  assert.equal(phone.includes('r="11"'), false);
  assert.equal(phone.includes('r="8"'), true);
  assert.equal(phone.includes('r="4"'), true);
  assert.equal(phone.includes("+55%"), true);
  assert.equal(phone.includes("\u221220%"), true);
  assert.equal(phone.includes("$84,413"), true);
  assert.equal(desk.includes(chart.trendLabel), true);
  assert.equal(desk.includes('role="button"'), true);
  assert.equal(desk.includes('r="10"'), true);
  assert.deepEqual(layersOf(phone), LAYERS);
});

test("end labels stay at least 1.2em apart", () => {
  const chart = flatChart();
  const spot = spotOf("2024-01-01", 10000);
  const desk = chartSvg(chart, spot, 1280);
  const deskYs = labelBaselines(desk);
  assert.equal(deskYs.length, 4);
  for (let i = 1; i < deskYs.length; i += 1) {
    const prev = deskYs[i - 1] ?? 0;
    const next = deskYs[i] ?? 0;
    assert.equal(next - prev >= 12.5 * 1.2 - 0.02, true, `${prev} -> ${next}`);
  }
  assert.equal(desk.includes('class="c-leader" pointer-events="none"'), true);

  const phone = chartSvg(chart, spot, 400);
  assert.equal(phone.includes("Trend $10k"), false);
  const phoneYs = labelBaselines(phone);
  assert.equal(phoneYs.length, 3);
  for (let i = 1; i < phoneYs.length; i += 1) {
    const prev = phoneYs[i - 1] ?? 0;
    const next = phoneYs[i] ?? 0;
    assert.equal(next - prev >= 11 * 1.2 - 0.02, true, `${prev} -> ${next}`);
  }
});

test("height and margins follow the width breakpoints", () => {
  const chart = fridayChart();
  const spot = spotOf("2026-09-25", 84413);
  const cases: { width: number; ratio: number; left: number; right: number }[] = [
    { width: 1440, ratio: 0.5, left: 56, right: 92 },
    { width: 1280, ratio: 0.5, left: 56, right: 92 },
    { width: 1279, ratio: 0.45, left: 56, right: 92 },
    { width: 1024, ratio: 0.45, left: 56, right: 92 },
    { width: 1023, ratio: 0.55, left: 56, right: 92 },
    { width: 768, ratio: 0.55, left: 56, right: 92 },
    { width: 767, ratio: 0.667, left: 40, right: 58 },
    { width: 360, ratio: 0.667, left: 40, right: 58 },
  ];
  for (const item of cases) {
    const svg = chartSvg(chart, spot, item.width);
    const box = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    near(Number(box?.[1]), item.width);
    near(Number(box?.[2]), item.width * item.ratio);
    const grid = svg.match(/<line class="c-grid"[^>]*>/);
    const x1 = Number(grid?.[0]?.match(/x1="([\d.]+)"/)?.[1]);
    const x2 = Number(grid?.[0]?.match(/x2="([\d.]+)"/)?.[1]);
    assert.equal(x1, item.left, String(item.width));
    assert.equal(x2, item.width - item.right, String(item.width));
  }
});

test("the price path follows weekly closes and a later spot", () => {
  const chart = flatChart();
  const first = chartSvg(chart, spotOf("2024-01-01", 10000), 1280);
  const later = chartSvg(chart, spotOf("2024-06-01", 20000), 1280);
  const price = (svg: string) => svg.match(/data-layer="price"[^>]*d="([^"]*)"/)?.[1] ?? "";
  assert.equal(price(first).includes("M"), true);
  assert.equal(price(first) === price(later), false);
  const doubled = {
    ...chart,
    weekly: chart.weekly.map((point) => ({ date: point.date, close: point.close * 2 })),
  };
  assert.equal(price(first) === price(chartSvg(doubled, spotOf("2024-01-01", 10000), 1280)), false);
});
