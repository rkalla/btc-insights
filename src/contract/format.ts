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
  const rounded = Math.round(scaled * 10) / 10;
  const digits = rounded === Math.trunc(rounded) ? String(Math.trunc(rounded)) : rounded.toFixed(1);
  return `${sign}$${digits}${suffix}`;
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
  const year = isoDate.slice(0, 4);
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function fridayLabel(isoDate: string): string {
  return `Fri ${sentenceDate(isoDate)}`;
}
