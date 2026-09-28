import type { PresentationFacts } from "../contract/types.ts";

export const COPY_WRITTEN_FOR: PresentationFacts = {
  schema: 1,
  buyStrongly: { wins: 4, total: 4, tenths: 6, worstDipPct: 27 },
  lumpIn: { wins: 6, total: 6, tenths: 7, openSinceLabel: "November 2025" },
  build: { up50Pct: 79, weeks: 91, stretches: 4 },
  slowIn: { wins: 2, total: 3 },
  standDown: { wins: 7, total: 8, stretchesAbout: 6 },
  history: [
    { year: 2015, fireDate: "2015-07-24", oneYearPct: 127 },
    { year: 2019, fireDate: "2019-05-03", oneYearPct: 59 },
    { year: 2020, fireDate: "2020-07-31", oneYearPct: 269 },
    { year: 2023, fireDate: "2023-03-17", oneYearPct: 138 },
    { year: 2026, fireDate: "2026-09-18", oneYearPct: null },
  ],
};

export const BANNED_THIS_WEEK = [
  "z-?score",
  "floor",
  "wilson",
  "episodes?",
  "regimes?",
  "postures?",
  "tranches?",
  "arm(ed|s)?",
  "fire[sd]?",
  "firing",
  "cross(es|ed)?",
  "roll",
  "reali[sz]ed",
  "thermometer",
  "gap switch",
  "official close",
  "prints?",
  "utc",
  "trend band",
  "cycle capture",
  "all[ -]in",
  "lump in",
  "slow in",
  "stand[ -]down",
  "stay the course",
  "mvrv",
  "power law",
  "sigma",
  "standard deviation",
  "dca",
  "hodl",
  "basis points?",
  "grace",
  "guaranteed?",
  "risk-free",
  "can'?t lose",
  "safe bet",
  "will rise",
  "19 times in 20",
  "90 of 91",
];

export type WeekState =
  | "BUY_STRONGLY"
  | "ADD_AT_ONCE"
  | "ADD_WEEKLY"
  | "STEADY"
  | "GO_SLOW"
  | "PAUSE"
  | "SELL"
  | "NO_UPDATE";

export type WeekStep = "Pause" | "Go slow" | "Steady" | "Add" | "Buy strongly";

export interface WeekCopy {
  banner: string | null;
  updateLine: string | null;
  disclaimer: string;
  headline: string;
  underHeadline: string;
  replacesPause: string | null;
  step: WeekStep | null;
  scaleNote: string;
  trackLabel: string | null;
  track: string | null;
  chip: string | null;
  actions: string[];
  after: string | null;
  callout: string | null;
  personalise: string | null;
  why: string[];
  worked: string | null;
  tiles: string[];
  tileCaption: string | null;
  risks: string[];
  riskClose: string | null;
  price: string;
  underPrice: string;
  evidence: string;
  evidenceSub: string;
  footer: string;
}

export interface RenderInput {
  state: WeekState;
  step: WeekStep | null;
  gold: boolean;
  gettingClose: boolean;
  replacesPause: boolean;
  takeProfit: boolean;
  outOfDate: boolean;
  showPersonalise: boolean;
  dropTax: boolean;
  deadlinePassed: boolean;
  daysLeft: number | null;
  updatedShort: string;
  updated: string;
  nextUpdate: string;
  nextUpdateShort: string;
  deadline: string | null;
  amount: string | null;
  regularNote: string;
  slice: string | null;
  gap: string | null;
  gapWords: string | null;
  fireDate: string;
  pauseDate: string | null;
  pauseEnds: string | null;
  declaredDate: string | null;
  trimUsd: string | null;
  trimBtc: string | null;
  target: string | null;
  ceiling: string | null;
  share: string | null;
  priceLabel: string;
  tiles: string[];
}

const DISCLAIMER = "Research, not personal financial advice.";
const SCALE_NOTE = "This shows what to do, not how sure we are.";
const NO_STEP = "No step is marked this week.";
const TRACK_LABEL = "Track record:";
const BLANK_AMOUNT = "the money you've set aside";
const BLANK_SLICE = "a small, fixed amount";
const PERSONALISE = "Want this in dollars? Add your amount in Settings. It stays on this device.";
const RISK_CLOSE = "Only use money you won't need for a few years.";
const UNDER_PRICE =
  "Prices move every day. The Friday advice stays put. Selling some Bitcoin can turn on during the week if your share crosses the limit you set.";
const EVIDENCE = "See the evidence behind this.";
const EVIDENCE_SUB = "Charts, the rules, and every past signal.";
const FOOTER =
  "BTC Friday is research, not personal financial advice. It looks at Bitcoin's price history, and history can be wrong about the future. It doesn't know your full situation, doesn't trade for you and doesn't calculate taxes. Before investing money you can't afford to lose, talk to a fee-only financial adviser.";
const KEEP = "Keep any Bitcoin you already own.";
const AFTER = "After that, this page switches to the next week's advice.";
const GETTING_CLOSE =
  "Our strongest buy signal is set up and has not turned on. Extra cash waits. This wait has not been tested.";
const GETTING_CLOSE_WHY =
  "Bitcoin has fallen far enough against gold, and below its trend, to set up our strongest buy signal. It turns on when Bitcoin's price in gold climbs back to its one-year average.";
const GOLD_WHY =
  "Part of this move was gold rising, not only Bitcoin falling. The instruction stays the same.";
const REPLACES = "An earlier signal said to pause. This week's buy signal replaces it.";
const YEAR_DROP = "It has fallen 20% or more at some point in every year since 2012.";
const ANY_YEAR_DROP = "Bitcoin can fall 20% or more at any time. It has, at some point, in every year since 2012.";

export function regularNote(amount: string | null, every: "week" | "month" | null): string {
  if (amount == null || every == null) {
    return "";
  }
  const cadence = every === "week" ? "a week" : "a month";
  return ` (${amount} ${cadence})`;
}

export function renderWeek(input: RenderInput): WeekCopy {
  const amount = input.amount ?? BLANK_AMOUNT;
  const slice = input.slice ?? BLANK_SLICE;
  const note = input.regularNote;
  const keepGoing = input.replacesPause
    ? `Restart your regular buys${note}.`
    : `Keep your regular buys going${note}.`;
  const body = bodyFor(input, amount, slice, note, keepGoing);
  const why = [...body.why];
  if (input.gettingClose) {
    why.push(GETTING_CLOSE_WHY);
  }
  if (input.gold) {
    why.push(GOLD_WHY);
  }
  if (input.takeProfit && input.trimUsd != null && input.trimBtc != null && input.target != null && input.share != null && input.ceiling != null) {
    why.push(
      `Bitcoin has grown to ${input.share}% of your investments, above the ${input.ceiling}% limit you set. This uses the latest price, so it can change before Friday.`,
    );
  }
  const copy: WeekCopy = {
    banner: input.outOfDate
      ? `This page hasn't updated since ${input.updated}. Don't act on it until it does.`
      : null,
    updateLine: input.outOfDate
      ? null
      : `This week's advice, set ${input.updatedShort}. Next update ${input.nextUpdate} your time.`,
    disclaimer: DISCLAIMER,
    headline: body.headline,
    underHeadline: input.state === "SELL"
      ? "You've told us Bitcoin's long-term case is broken."
      : input.takeProfit
        ? "Take some profit: sell part of your Bitcoin."
        : KEEP,
    replacesPause: input.replacesPause ? REPLACES : null,
    step: input.step,
    scaleNote: input.state === "NO_UPDATE" ? NO_STEP : SCALE_NOTE,
    trackLabel: body.track == null ? null : TRACK_LABEL,
    track: body.track,
    chip: timingChip(input),
    actions: body.actions,
    after: input.state === "BUY_STRONGLY" ? AFTER : null,
    callout: input.gettingClose ? GETTING_CLOSE : null,
    personalise: input.showPersonalise ? PERSONALISE : null,
    why,
    worked: body.worked,
    tiles: input.state === "BUY_STRONGLY" ? input.tiles : [],
    tileCaption: input.state === "BUY_STRONGLY" ? "Bitcoin's price one year after each signal." : null,
    risks: body.risks,
    riskClose: input.state === "SELL" ? null : RISK_CLOSE,
    price: `Bitcoin today ${input.priceLabel}.`,
    underPrice: UNDER_PRICE,
    evidence: EVIDENCE,
    evidenceSub: EVIDENCE_SUB,
    footer: FOOTER,
  };
  const blob = weekBlob(copy);
  if (blob.includes("{") || blob.includes("}")) {
    throw new Error("unfilled copy placeholder");
  }
  return copy;
}

export function timingChip(input: RenderInput): string | null {
  if (input.outOfDate || input.state === "SELL" || input.state === "NO_UPDATE") {
    return null;
  }
  if (input.state === "BUY_STRONGLY" && input.daysLeft != null) {
    if (input.deadlinePassed) {
      return "Updating soon";
    }
    if (input.daysLeft <= 0) {
      return "Due today";
    }
    if (input.daysLeft === 1) {
      return "1 day left";
    }
    return `${input.daysLeft} days left`;
  }
  return `Holds until ${input.nextUpdateShort}`;
}

export function weekBlob(copy: WeekCopy): string {
  return [
    copy.banner,
    copy.updateLine,
    copy.disclaimer,
    copy.headline,
    copy.underHeadline,
    copy.replacesPause,
    copy.scaleNote,
    copy.trackLabel,
    copy.track,
    copy.chip,
    ...copy.actions,
    copy.after,
    copy.callout,
    copy.personalise,
    ...copy.why,
    copy.worked,
    ...copy.tiles,
    copy.tileCaption,
    ...copy.risks,
    copy.riskClose,
    copy.price,
    copy.underPrice,
    copy.evidence,
    copy.evidenceSub,
    copy.footer,
  ]
    .filter((chunk): chunk is string => chunk != null && chunk.trim() !== "")
    .join("\n");
}

interface StateBody {
  headline: string;
  track: string | null;
  actions: string[];
  why: string[];
  worked: string | null;
  risks: string[];
}

function bodyFor(
  input: RenderInput,
  amount: string,
  slice: string,
  note: string,
  keepGoing: string,
): StateBody {
  switch (input.state) {
    case "BUY_STRONGLY":
      return {
        headline: "A strong week to buy Bitcoin.",
        track: "The set-aside money went in at once and beat spreading it over a year, all 4 times. 4 is a small number.",
        actions: [
          `Put ${amount} into Bitcoin by ${input.deadline ?? input.nextUpdate} your time.`,
          keepGoing,
          ...trimAction(input),
        ],
        why: [
          `On ${input.fireDate}, our strongest buy signal turned on. Before this, it had turned on only 4 times: in 2015, 2019, 2020 and 2023. Those 4 times, putting the money in at once beat spreading it over the next year.`,
        ],
        worked: "Yes, all 4 times, against spreading the same money over a year. That's too few to be sure. A cautious reading is about 6 times in 10 or better. Treat it as a strong hint, not a promise.",
        risks: [
          "After past signals like this, Bitcoin still dropped as much as 27% below its signal-day price at some point in the next year. It has fallen 20% or more at some point in every year since 2012.",
        ],
      };
    case "ADD_AT_ONCE":
      return {
        headline: "A good time to add to Bitcoin.",
        track: "Putting the money in at once beat spreading it over a year in all 6 finished stretches. One stretch is still open.",
        actions: [
          `Put ${amount} into Bitcoin when you have it. There's no need to spread it out.`,
          keepGoing,
          ...trimAction(input),
        ],
        why: [
          input.gap == null
            ? "In stretches like this, putting money in at once beat spreading it over a year in all 6 finished cases. A cautious reading is about 7 times in 10 or better."
            : `Bitcoin is about ${input.gap}% below its long-run trend. In stretches like this, putting money in at once beat spreading it over a year in all 6 finished cases. A cautious reading is about 7 times in 10 or better.`,
        ],
        worked: "Yes, in all 6 finished stretches. That's still a small number. A cautious reading is about 7 times in 10 or better. This stretch began in November 2025 and hasn't finished yet.",
        risks: [`Bitcoin can keep falling after you buy. ${YEAR_DROP}`],
      };
    case "ADD_WEEKLY":
      return {
        headline: "Bitcoin is cheap. Add a little each week.",
        track: "Bitcoin was up at least 50% a year later in about 79% of 91 weeks like this, across 4 stretches. The weekly pace was not tested.",
        actions: [
          `Add ${slice} to Bitcoin this week, and each week while it stays this cheap.`,
          keepGoing,
          ...trimAction(input),
        ],
        why: [
          "Bitcoin is trading below what the average holder paid for it. That has happened in 4 stretches since 2012. In those stretches, Bitcoin was up at least 50% a year later in about 79% of 91 weeks.",
        ],
        worked: "Yes, on that 50% test. The 91 weeks come from 4 stretches, and weeks close together move together. The weekly pace was not tested.",
        risks: [
          "Cheap can get cheaper. In past stretches, the price sometimes kept falling for months before it turned. Adding a little each week spreads that risk out.",
        ],
      };
    case "STEADY":
      return {
        headline: "A normal week. Keep your regular buys.",
        track: "None needed. This is the normal plan.",
        actions: [
          keepGoing,
          "Have new money to invest? History shows no clear winner in weeks like this, so put it in now or spread it out, whichever you prefer.",
          ...trimAction(input),
        ],
        why: [
          input.gapWords == null
            ? "None of our buy or caution signals is on."
            : `Bitcoin is ${input.gapWords} its long-run trend, which is within its normal range. None of our buy or caution signals is on.`,
        ],
        worked: "Nothing to test this week. There's no special signal, so there's no record to show. Regular buying is the default plan.",
        risks: [ANY_YEAR_DROP],
      };
    case "GO_SLOW":
      return {
        headline: "Prices are stretched. Go slow with new money.",
        track: "Worked 2 of 3 times, our weakest record.",
        actions: [
          "Spread any new lump sum evenly over the next 12 months.",
          keepGoing,
          ...trimAction(input),
        ],
        why: [
          "Bitcoin is more than 55% above its long-run trend. At times like this, spreading new money out did better than investing it at once in 2 of 3 cases.",
        ],
        worked: "2 of 3 times. With only 3 cases, we can't say it beats a coin flip. Treat it as a hint, not a rule.",
        risks: ["If prices keep rising, spreading out means paying more for some of your Bitcoin."],
      };
    case "PAUSE":
      return {
        headline: "Pause new buying for now.",
        track: "Pausing got more Bitcoin for the same money 7 of 8 times. Those overlap, so count about six stretches. June 2013 was the miss.",
        actions: [
          "Pause new buys, including your regular ones.",
          "Keep that money somewhere safe that pays interest, such as Treasury bills or a high-yield savings account.",
          pauseEnd(input.pauseEnds),
          ...trimAction(input),
        ],
        why: [
          input.pauseDate == null
            ? "Our caution signal turned on: after a big run-up above its long-run trend, Bitcoin fell 10% from its peak. Pausing and buying later got more Bitcoin for the same money in 7 of 8 cases, about six stretches."
            : `On ${input.pauseDate}, our caution signal turned on: after a big run-up above its long-run trend, Bitcoin fell 10% from its peak. Pausing and buying later got more Bitcoin for the same money in 7 of 8 cases, about six stretches.`,
        ],
        worked: "7 of 8 times, about six stretches. In June 2013, pausing missed a large rise. The signal also stayed off before two big drops, in 2019\u201320 and 2025\u201326. A 12-month pause has not been tested on its own.",
        risks: ["Pausing can mean buying back at a higher price. In 2013, it meant missing a large rise."],
      };
    case "SELL":
      return {
        headline: "Stop buying, and sell your Bitcoin.",
        track: "None. This follows your decision, not a market signal.",
        actions: [
          input.dropTax
            ? "Sell the Bitcoin you hold."
            : "Sell the Bitcoin you hold. Selling can create a tax bill, so check with a tax adviser first.",
          "Stop new buys, including your regular ones.",
        ],
        why: [
          `On ${input.declaredDate ?? ""}, you said in Settings that you no longer believe in Bitcoin's long-term case.`,
        ],
        worked: "There's no record for this. It's your decision, not a signal, so there's nothing to test.",
        risks: ["If you change your mind, you may buy back at a higher price. You can undo this in Settings."],
      };
    case "NO_UPDATE":
      return {
        headline: "No update this week.",
        track: null,
        actions: [
          `Keep your regular buys going${note}.`,
          "Check back later. We'll update as soon as the data comes through.",
        ],
        why: ["This week's price data didn't arrive, or it failed our checks. We won't guess."],
        worked: null,
        risks: [ANY_YEAR_DROP],
      };
  }
}

function pauseEnd(pauseEnds: string | null): string {
  const first = "This pause ends when the page says Buy strongly or Add each week.";
  if (pauseEnds == null) {
    return first;
  }
  return `${first} If neither has happened by ${pauseEnds}, that money is available again and follows the advice that day.`;
}

function trimAction(input: RenderInput): string[] {
  if (!input.takeProfit || input.trimUsd == null || input.trimBtc == null || input.target == null) {
    return [];
  }
  const tax = input.dropTax ? "" : " Selling can create a tax bill.";
  const finish = input.state === "PAUSE" && input.pauseEnds != null ? ` Finish by ${input.pauseEnds}.` : "";
  return [
    `Sell about ${input.trimUsd} of Bitcoin (about ${input.trimBtc} bitcoin) to get back to ${input.target}% of your investments. Sell the coins that cost you the most first, over about 12 months.${tax}${finish}`,
  ];
}
