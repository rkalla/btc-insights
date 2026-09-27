import { chartMoney } from "../contract/format.ts";
import type { FridayDocument } from "../contract/types.ts";
import { cashCopy, coinHold, disagreement, type CashFlags } from "./copy.ts";
import { progressCard } from "./cycle.ts";
import type { ProgressAnchors } from "./cycle.ts";
import { bandLower, bandUpper, fitPowerLaw, trendAt } from "./powerlaw.ts";
import type { DatedPrice } from "./powerlaw.ts";
import { officialFeedMatchesPublished } from "./zscore.ts";

export interface HistoryRow {
  time: string;
  PriceUSD: string | number | null;
  CapMVRVCur: string | number | null;
}

export interface PublishedFire {
  date: string;
  price?: number;
  status: "completed" | "open";
  titleLabel: string;
  resultLabel: string;
}

export interface PublishedRecord {
  official: FridayDocument["official"];
  standDownPause: boolean;
  armedWait: boolean;
  dollarSlot: FridayDocument["dollarSlot"];
  cashFlags: CashFlags;
  buys: PublishedFire[];
  sells: PublishedFire[];
  zeroCrossFridays: string[];
  coinsHold: FridayDocument["coinsHold"];
  caveats: FridayDocument["caveats"];
  context: FridayDocument["context"];
  longView: FridayDocument["longView"];
  cycles: {
    intro: string;
    finished: FridayDocument["cycles"]["cards"];
    footnote: string;
  };
  anchors: ProgressAnchors;
  footer: FridayDocument["footer"];
  previousOfficial: FridayDocument["previousOfficial"];
  captions: string[];
  feedCrossFridays?: readonly string[];
}

function rowDate(time: string): string {
  return time.slice(0, 10);
}

function rowPrice(value: string | number | null): number | null {
  if (value == null) return null;
  const price = typeof value === "number" ? value : Number(value);
  return price > 0 ? price : null;
}

function isFriday(isoDate: string): boolean {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 5;
}

function feedMatches(record: PublishedRecord): boolean {
  const feed = record.feedCrossFridays;
  if (feed == null) return false;
  return officialFeedMatchesPublished(feed, record.zeroCrossFridays);
}

export function buildFriday(history: readonly HistoryRow[], record: PublishedRecord): FridayDocument {
  const through = record.official.closeDate;
  const daily: DatedPrice[] = [];
  const weekly: { date: string; close: number }[] = [];
  for (const row of history) {
    const date = rowDate(row.time);
    if (date > through) continue;
    const price = rowPrice(row.PriceUSD);
    if (price == null) continue;
    daily.push({ date, price });
    if (date >= "2013-01-01" && isFriday(date)) {
      weekly.push({ date, close: price });
    }
  }
  weekly.sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0));
  if (weekly.length === 0 || weekly[weekly.length - 1]?.date !== through) {
    throw new Error(`history has no Friday close ${through}`);
  }
  const fit = fitPowerLaw(daily, through);
  const sampled: { date: string; close: number }[] = [];
  for (let index = 0; index < weekly.length; index += 4) {
    const point = weekly[index];
    if (point) sampled.push(point);
  }
  const lastWeek = weekly[weekly.length - 1];
  if (lastWeek && sampled[sampled.length - 1]?.date !== lastWeek.date) {
    sampled.push(lastWeek);
  }
  const trend = sampled.map((point) => ({ date: point.date, value: trendAt(fit, point.date) }));
  const lower = trend.map((point) => ({ date: point.date, value: bandLower(point.value) }));
  const upper = trend.map((point) => ({ date: point.date, value: bandUpper(point.value) }));
  const tail = weekly.slice(-200);
  const sma = tail.reduce((sum, point) => sum + point.close, 0) / tail.length;
  const closes = new Map(weekly.map((point) => [point.date, point.close]));
  const buysByDate = new Map(record.buys.map((buy) => [buy.date, buy]));
  const matchedFeed = feedMatches(record);
  const buyDates = matchedFeed ? record.feedCrossFridays ?? [] : record.buys.map((buy) => buy.date);
  const fires: FridayDocument["chart"]["fires"] = [];
  for (const date of buyDates) {
    const buy = buysByDate.get(date);
    if (!buy || buy.price == null) throw new Error(`published buy missing ${date}`);
    fires.push({
      type: "buy",
      date,
      price: buy.price,
      status: buy.status,
      titleLabel: buy.titleLabel,
      resultLabel: buy.resultLabel,
    });
  }
  for (const sell of record.sells) {
    const price = closes.get(sell.date);
    if (price == null) throw new Error(`history missing sell Friday ${sell.date}`);
    fires.push({
      type: "sell",
      date: sell.date,
      price,
      status: sell.status,
      titleLabel: sell.titleLabel,
      resultLabel: sell.resultLabel,
    });
  }
  fires.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const close = closes.get(through);
  if (close == null) throw new Error(`history missing ${through}`);
  const endTrend = trendAt(fit, through);
  const cash = cashCopy(record.cashFlags);
  const hold = coinHold();
  return {
    schema: 1,
    official: record.official,
    standDownPause: record.standDownPause,
    armedWait: record.armedWait,
    dollarSlot: record.dollarSlot,
    cash,
    coinsHold: {
      word: "Hold",
      tone: "neutral",
      sentences: [...hold.sentences],
    },
    disagreement: disagreement(cash.posture, record.standDownPause),
    caveats: record.caveats,
    chart: {
      weekly,
      trend,
      lower,
      upper,
      sma200w: [{ date: through, value: sma }],
      fires,
      trendLabel: `Trend ${chartMoney(Math.round(endTrend / 1000) * 1000)}`,
      captions: [...record.captions],
    },
    context: record.context,
    longView: record.longView,
    cycles: {
      intro: record.cycles.intro,
      cards: [
        ...record.cycles.finished,
        progressCard(close, through, record.anchors),
      ],
      footnote: record.cycles.footnote,
    },
    footer: record.footer,
    previousOfficial: record.previousOfficial,
  };
}
