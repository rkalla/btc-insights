const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function money(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(usd);
}

export function chartMoney(usd: number): string {
  const sign = usd < 0 ? "\u2212" : "";
  const abs = Math.abs(usd);
  if (abs < 1000) {
    return `${sign}$${Math.round(abs)}`;
  }
  const millions = abs >= 1_000_000;
  const scaled = abs / (millions ? 1_000_000 : 1000);
  const suffix = millions ? "M" : "k";
  return `${sign}$${scaledDigits(scaled)}${suffix}`;
}

function scaledDigits(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === Math.trunc(rounded)) {
    return String(Math.trunc(rounded));
  }
  return rounded.toFixed(1);
}

// The page prints a minus, U+2212, not a hyphen.
export function signedPercent(fraction: number): string {
  const pct = Math.round(fraction * 100);
  if (pct === 0) {
    return "0%";
  }
  if (pct > 0) {
    return `+${pct}%`;
  }
  return `\u2212${Math.abs(pct)}%`;
}

export function sentenceDate(isoDate: string): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  const utc = new Date(Date.UTC(year, month - 1, day));
  return `${utc.getUTCDate()} ${MONTHS[utc.getUTCMonth()]} ${utc.getUTCFullYear()}`;
}

export function fridayLabel(isoDate: string): string {
  return `Fri ${sentenceDate(isoDate)}`;
}
