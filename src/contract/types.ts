export type Tone = "buy" | "neutral" | "sell";
export type CashPosture =
  | "STAND_DOWN"
  | "STAY"
  | "SLOW_IN"
  | "BUILD"
  | "LUMP_IN"
  | "ALL_IN"
  | "NO_NEW_BUY"
  | "NO_CALL";
export type CoinPosture = "HOLD" | "TRIM" | "EXIT";
export type ISODate = string;

export interface RecordRow {
  key: "RECORD" | "PAYOFF" | "MISSES" | "STATUS";
  text: string;
}

export interface CycleRow {
  signal: "cross" | "build" | "lump";
  name: string;
  sharePct: number;
  detail: string;
}

export interface CycleCard {
  title: string;
  range: string;
  isProgress: boolean;
  lead?: string;
  note?: string;
  rows: CycleRow[];
}

export interface ContextReading {
  key: "buyCross" | "zScore" | "thermometer" | "realizedPrice" | "sellRoll";
  label: string;
  flag: string;
  flagTone: Tone | "muted";
  value: string;
  note: string;
  fromCloseLabel?: string;
}

export interface PresentationFacts {
  schema: 1;
  buyStrongly: { wins: 4; total: 4; tenths: 6; worstDipPct: 27 };
  lumpIn: { wins: 6; total: 6; tenths: 7; openSinceLabel: "November 2025" };
  build: { up50Pct: 79; weeks: 91; stretches: 4 };
  slowIn: { wins: 2; total: 3 };
  standDown: { wins: 7; total: 8; stretchesAbout: 6 };
  history: { year: number; fireDate: string; oneYearPct: number | null }[];
}

export interface FridayDocument {
  schema: 1;
  official: {
    closeDate: ISODate;
    closeLabel: string;
    nextCloseDate: ISODate;
    nextCloseLabel: string;
  };
  standDownPause: boolean;
  // Twelve calendar months after this Friday is the pause end. Omitted when this week is not a stand-down.
  standDownFireDate?: ISODate | null;
  armedWait: boolean;
  dollarSlot: null | { pile: "cashAvailable" };
  cash: {
    posture: CashPosture;
    word: string;
    tone: Tone;
    sentences: string[];
    window?: {
      steps: {
        dateLabel: string;
        caption: string;
        state: "done" | "current" | "next";
      }[];
      lastGraceCloseUtc: string;
    };
    recordRows: RecordRow[];
    highConfidence: boolean;
  };
  coinsHold: {
    word: "Hold";
    tone: "neutral";
    sentences: string[];
  };
  disagreement: string | null;
  caveats: {
    kind: "gold" | "fireWeek" | "fit" | "sameWeek" | "armedWait";
    title: string;
    body: string;
  }[];
  chart: {
    weekly: { date: ISODate; close: number }[];
    trend: { date: ISODate; value: number }[];
    lower: { date: ISODate; value: number }[];
    upper: { date: ISODate; value: number }[];
    sma200w: { date: ISODate; value: number }[];
    fires: {
      type: "buy" | "sell";
      date: ISODate;
      price: number;
      status: "completed" | "open";
      titleLabel: string;
      resultLabel: string;
    }[];
    trendLabel: string;
    captions: string[];
  };
  context: ContextReading[];
  longView: {
    statement: string;
    caveat: string;
    tiles: { label: string; text: string; wide?: boolean }[];
  };
  cycles: {
    intro: string;
    cards: CycleCard[];
    footnote: string;
  };
  footer: [string, string];
  previousOfficial: null | {
    closeDate: ISODate;
    closeLabel: string;
    context: FridayDocument["context"];
  };
  presentation: PresentationFacts;
}

export interface LiveSlice {
  schema: 1;
  officialCloseDate: ISODate;
  spotUsd: number;
  spotAsOf: string;
  gapPct: number;
  trendUsd: number;
  printLabel: string;
  isOfficialClose: boolean;
  developing: string | null;
  realizedRatio: number | null;
  realizedAsOf: string | null;
  gold: null | { usd: number; asOf: string; filled: boolean };
  chartTip: { date: ISODate; value: number };
  progress: CycleCard;
  stale: boolean;
  missingClose: boolean;
}

export interface HolderSettings {
  standingAmount: number | null;
  standingEvery: "week" | "month" | null;
  buildAmount: number | null;
  cashAvailable: number | null;
  coinsHeld: number | null;
  netWorth: number | null;
  targetShare: number | null;
  ceilingShare: number | null;
  thesisBroken: boolean;
  thesisDate: ISODate | null;
  account: "taxable" | "ira" | "fund" | null;
}

export interface DashboardVM {
  openedAt: string;
  official: FridayDocument["official"];
  now: {
    spotUsd: number;
    gapPct: number;
    trendUsd: number;
    printLabel: string;
    isOfficialClose: boolean;
    developing: string | null;
    stale: boolean;
    staleNote: string | null;
  };
  rails: { cash: CashPosture | null; coins: CoinPosture };
  cash: FridayDocument["cash"];
  coins: {
    posture: CoinPosture;
    word: string;
    tone: Tone;
    sentences: string[];
    offChips: string[];
    taxLine?: string;
    declarationDateLabel?: string;
  };
  disagreement: string | null;
  caveats: FridayDocument["caveats"];
  chart: FridayDocument["chart"] & { spot: { date: ISODate; value: number } };
  context: FridayDocument["context"];
  longView: FridayDocument["longView"];
  cycles: FridayDocument["cycles"];
  footer: FridayDocument["footer"];
  countdown: string | null;
  presentation: PresentationFacts;
  standDownFireDate: string | null;
  missingClose: boolean;
  outOfDate: boolean;
}
