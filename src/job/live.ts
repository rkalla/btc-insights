import type { CycleCard, LiveSlice } from "../contract/types.ts";
import { progressCard } from "./cycle.ts";
import type { ProgressAnchors } from "./cycle.ts";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const TWENTY_SIX_HOURS_MS = 26 * 60 * 60 * 1000;
const DEVELOPING = "A developing z-score uses the latest Bitcoin and gold prints. Not an official fire.";

export interface FrozenFriday {
  officialCloseDate: string;
  trend: number;
  realizedPrice: number | null;
  realizedAsOf: string | null;
  anchors: ProgressAnchors;
}

export interface LivePrint {
  spot: number;
  spotAsOf: string;
  printLabel: string;
  isOfficialClose: boolean;
  bitcoin: { usd: number; asOf: string } | null;
  gold: { usd: number; asOf: string; filled: boolean } | null;
  now: string;
  missingClose: boolean;
}

export function buildLive(frozen: FrozenFriday, print: LivePrint): LiveSlice {
  const gold =
    print.gold != null && Date.parse(print.spotAsOf) - Date.parse(print.gold.asOf) <= TEN_DAYS_MS
      ? print.gold
      : null;
  const times = [Date.parse(print.spotAsOf)];
  if (print.bitcoin) times.push(Date.parse(print.bitcoin.asOf));
  if (gold) times.push(Date.parse(gold.asOf));
  const newest = Math.max(...times);
  const developing = print.bitcoin != null && gold != null ? DEVELOPING : null;
  const realizedRatio =
    frozen.realizedPrice != null && frozen.realizedPrice > 0
      ? print.spot / frozen.realizedPrice
      : null;
  const progress: CycleCard = progressCard(print.spot, print.spotAsOf.slice(0, 10), frozen.anchors);
  return {
    schema: 1,
    officialCloseDate: frozen.officialCloseDate,
    spotUsd: print.spot,
    spotAsOf: print.spotAsOf,
    gapPct: print.spot / frozen.trend - 1,
    trendUsd: frozen.trend,
    printLabel: print.printLabel,
    isOfficialClose: print.isOfficialClose,
    developing,
    realizedRatio,
    realizedAsOf: frozen.realizedAsOf,
    gold: gold == null ? null : { usd: gold.usd, asOf: gold.asOf, filled: gold.filled },
    chartTip: { date: print.spotAsOf.slice(0, 10), value: print.spot },
    progress,
    stale: Date.parse(print.now) - newest > TWENTY_SIX_HOURS_MS,
    missingClose: print.missingClose,
  };
}
