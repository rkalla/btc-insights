const GENESIS_UTC = Date.UTC(2009, 0, 3);

export interface DatedPrice {
  date: string;
  price: number;
}

export interface PowerLawFit {
  a: number;
  b: number;
}

export function daysSinceGenesis(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return Math.round((Date.UTC(year, month - 1, day) - GENESIS_UTC) / 86_400_000);
}

export function fitPowerLaw(points: readonly DatedPrice[], through: string): PowerLawFit {
  let n = 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const point of points) {
    if (point.date > through) continue;
    if (!(point.price > 0)) continue;
    const days = daysSinceGenesis(point.date);
    if (!(days > 0)) continue;
    const x = Math.log10(days);
    const y = Math.log10(point.price);
    n += 1;
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }
  if (n < 2) {
    throw new Error("power-law fit needs two points");
  }
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const a = (sy - b * sx) / n;
  return { a, b };
}

export function trendAt(fit: PowerLawFit, date: string): number {
  const days = daysSinceGenesis(date);
  return 10 ** (fit.a + fit.b * Math.log10(days));
}

export function gapFraction(price: number, trend: number): number {
  return price / trend - 1;
}

export function bandLower(trend: number): number {
  return trend * 0.8;
}

export function bandUpper(trend: number): number {
  return trend * 1.55;
}
