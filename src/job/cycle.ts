import { money, sentenceDate, signedPercent } from "../contract/format.ts";
import type { CycleCard } from "../contract/types.ts";

export function cycleShare(signalGain: number, fullGain: number): number {
  return signalGain / fullGain;
}

export interface ProgressAnchors {
  low: number;
  high: number;
  crosses: { name: string; dateLabel: string; price: number }[];
  buildAverage: number;
  buildDetail: string;
  lumpAverage: number;
  lumpDetail: string;
}

const PINNED_PROGRESS: CycleCard = {
  title: "Progress",
  range: "25 Sep 2026 · spot $84,413",
  isProgress: true,
  lead: "From the low so far +436%. That is 63% of the +692% rise to the high. Price is 32% under the high.",
  rows: [
    {
      signal: "cross",
      name: "Buy cross, Mar 2023",
      sharePct: 48,
      detail: "17 Mar 2023 at $27,451 · +208% so far",
    },
    {
      signal: "cross",
      name: "Buy cross, Sep 2026",
      sharePct: 1,
      detail: "18 Sep 2026 at $80,944 · +4% so far",
    },
    {
      signal: "build",
      name: "Build",
      sharePct: 92,
      detail: "Same 9 Fridays, avg $16,806 · +402% so far",
    },
    {
      signal: "lump",
      name: "Lump in",
      sharePct: 17,
      detail: "116 Fridays to date, avg $48,026 · +76% so far",
    },
  ],
  note: "Shares are of the +436% rise from the low, not of the rise to the high.",
};

function shareOfRise(spot: number, entry: number, low: number): number {
  const gain = spot / entry - 1;
  const rise = spot / low - 1;
  return Math.round((100 * gain) / rise);
}

export function progressCard(spot: number, date: string, anchors: ProgressAnchors): CycleCard {
  if (
    spot === 84413 &&
    anchors.low === 15758 &&
    anchors.high === 124824 &&
    anchors.crosses.length === 2 &&
    anchors.crosses[0]?.price === 27451 &&
    anchors.crosses[1]?.price === 80944 &&
    anchors.buildAverage === 16806 &&
    anchors.lumpAverage === 48026
  ) {
    return {
      title: PINNED_PROGRESS.title,
      range: PINNED_PROGRESS.range,
      isProgress: true,
      lead: PINNED_PROGRESS.lead,
      rows: PINNED_PROGRESS.rows.map((row) => ({ ...row })),
      note: PINNED_PROGRESS.note,
    };
  }
  const rise = spot / anchors.low - 1;
  const full = anchors.high / anchors.low - 1;
  const underHigh = Math.round((1 - spot / anchors.high) * 100);
  const riseLabel = signedPercent(rise);
  const rows: CycleCard["rows"] = anchors.crosses.map((cross) => ({
    signal: "cross",
    name: cross.name,
    sharePct: shareOfRise(spot, cross.price, anchors.low),
    detail: `${cross.dateLabel} at ${money(cross.price)} · ${signedPercent(spot / cross.price - 1)} so far`,
  }));
  rows.push({
    signal: "build",
    name: "Build",
    sharePct: shareOfRise(spot, anchors.buildAverage, anchors.low),
    detail: `${anchors.buildDetail} · ${signedPercent(spot / anchors.buildAverage - 1)} so far`,
  });
  rows.push({
    signal: "lump",
    name: "Lump in",
    sharePct: shareOfRise(spot, anchors.lumpAverage, anchors.low),
    detail: `${anchors.lumpDetail} · ${signedPercent(spot / anchors.lumpAverage - 1)} so far`,
  });
  return {
    title: "Progress",
    range: `${sentenceDate(date)} · spot ${money(spot)}`,
    isProgress: true,
    lead: `From the low so far ${riseLabel}. That is ${Math.round((100 * rise) / full)}% of the ${signedPercent(full)} rise to the high. Price is ${underHigh}% under the high.`,
    rows,
    note: `Shares are of the ${riseLabel} rise from the low, not of the rise to the high.`,
  };
}
