import { fitPowerLaw, trendAt, type DatedPrice, type PowerLawFit } from "./powerlaw.ts";

const SAMPLES = 204;
const DAY_MS = 86_400_000;

export interface FinishedCycle {
  low: string;
  high: string;
  end: string;
}

export interface OpenCycle {
  low: string;
  high: string;
  highPrice: number;
}

export interface ProjectionCycle extends FinishedCycle {
  highRatio: number;
}

export interface ProjectionDocument {
  schema: 1;
  asOf: string;
  fit: PowerLawFit;
  genesis: "2009-01-03";
  samples: 204;
  template: number[];
  highIndex: number;
  lowIndex: number;
  cyclesUsed: number;
  cycles: ProjectionCycle[];
  open: OpenCycle | null;
}

interface Scan {
  low: number;
  high: number;
  confirmed: number;
}

export function findCycles(points: readonly DatedPrice[]): {
  finished: FinishedCycle[];
  open: OpenCycle | null;
} {
  const finished: FinishedCycle[] = [];
  let pending: { low: string; high: string } | null = null;
  let index = 0;
  while (index < points.length) {
    const scan = scanFrom(points, index);
    if (pending != null) {
      finished.push({ low: pending.low, high: pending.high, end: points[scan.low]?.date ?? "" });
      pending = null;
    }
    const lowPoint = points[scan.low];
    const highPoint = points[scan.high];
    if (lowPoint == null || highPoint == null) break;
    if (scan.confirmed < 0) {
      return {
        finished,
        open: { low: lowPoint.date, high: highPoint.date, highPrice: highPoint.price },
      };
    }
    pending = { low: lowPoint.date, high: highPoint.date };
    index = scan.high + 1;
  }
  return { finished, open: null };
}

export function buildProjectionDocument(
  points: readonly DatedPrice[],
  through: string,
  fit: PowerLawFit = fitPowerLaw(points, through),
): ProjectionDocument {
  const used = points.filter((point) => point.date <= through && point.price > 0);
  const { finished, open } = findCycles(used);
  if (finished.length === 0) {
    throw new Error("projection needs a finished cycle");
  }
  const byDate = new Map(used.map((point) => [point.date, point.price]));
  const series = finished.map((cycle) => sampleCycle(cycle, byDate, fit));
  const template = averageColumns(series.map((row) => row.ratios));
  return {
    schema: 1,
    asOf: through,
    fit: { a: fit.a, b: fit.b },
    genesis: "2009-01-03",
    samples: SAMPLES,
    template,
    highIndex: extremeIndex(template, "max"),
    lowIndex: extremeIndex(template, "min"),
    cyclesUsed: finished.length,
    cycles: finished.map((cycle, index) => ({
      ...cycle,
      highRatio: round2(Math.max(...series[index]!.ratios)),
    })),
    open,
  };
}

function scanFrom(points: readonly DatedPrice[], start: number): Scan {
  let low = start;
  let high = start;
  for (let index = start + 1; index < points.length; index += 1) {
    const price = points[index]?.price ?? 0;
    const lowPrice = points[low]?.price ?? 0;
    const highPrice = points[high]?.price ?? 0;
    if (price <= lowPrice) {
      low = index;
      high = index;
      continue;
    }
    if (price >= highPrice) high = index;
    const peak = points[high]?.price ?? 0;
    const trough = points[low]?.price ?? 0;
    if (index > high && peak >= trough * 4 && price <= peak * 0.3) {
      return { low, high, confirmed: index };
    }
  }
  return { low, high, confirmed: -1 };
}

function sampleCycle(
  cycle: FinishedCycle,
  byDate: ReadonlyMap<string, number>,
  fit: PowerLawFit,
): { ratios: number[] } {
  const start = utcMs(cycle.low);
  const end = utcMs(cycle.end);
  const ratios: number[] = [];
  for (let index = 0; index < SAMPLES; index += 1) {
    const at = start + Math.round(((end - start) * index) / (SAMPLES - 1));
    const date = isoDate(at);
    const price = priceOnOrBefore(byDate, at);
    ratios.push(price / trendAt(fit, date));
  }
  return { ratios };
}

function priceOnOrBefore(byDate: ReadonlyMap<string, number>, at: number): number {
  for (let back = 0; back <= 4; back += 1) {
    const price = byDate.get(isoDate(at - back * DAY_MS));
    if (price != null && price > 0) return price;
  }
  throw new Error(`missing close near ${isoDate(at)}`);
}

function averageColumns(rows: readonly (readonly number[])[]): number[] {
  const width = rows[0]?.length ?? 0;
  const mean: number[] = [];
  for (let index = 0; index < width; index += 1) {
    let sum = 0;
    for (const row of rows) sum += row[index] ?? 0;
    mean.push(sum / rows.length);
  }
  return mean;
}

function extremeIndex(values: readonly number[], pick: "max" | "min"): number {
  let index = 0;
  for (let cursor = 1; cursor < values.length; cursor += 1) {
    const value = values[cursor] ?? 0;
    const best = values[index] ?? 0;
    const better = pick === "max" ? value > best : value < best;
    if (better || value === best) index = cursor;
  }
  return index;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function utcMs(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
