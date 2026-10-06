import { sentenceDate } from "../contract/format.ts";
import type { CashPosture, CoinPosture, FridayDocument, RecordRow, Tone } from "../contract/types.ts";
import { highConfidence, wilsonLower } from "./wilson.ts";

export interface CashFlags {
  allIn: boolean;
  build: boolean;
  standDownPause: boolean;
  lumpIn: boolean;
  slowIn: boolean;
  armedWait: boolean;
  exit?: boolean;
}

export interface CoinCopy {
  posture: CoinPosture;
  word: string;
  tone: Tone;
  sentences: string[];
  offChips: string[];
  taxLine?: string;
  declarationDateLabel?: string;
}

const ALL_IN_SENTENCES = [
  "Buy now, or by the Friday 2 Oct 2026 close.",
  "After that close, the call is whatever that Friday says.",
  "Standing contribution continues.",
];

const ALL_IN_ROWS: RecordRow[] = [
  { key: "RECORD", text: "4 of 4. Floor about 60% (Wilson 90%). 4 episodes." },
  { key: "PAYOFF", text: "Beat a 52-week spread, 4 of 4, +18% to +92% coins." },
  { key: "STATUS", text: "This fire is open. Not high confidence." },
];

const ALL_IN_WINDOW: NonNullable<FridayDocument["cash"]["window"]> = {
  steps: [
    { dateLabel: "Fri 18 Sep", caption: "fired", state: "done" },
    { dateLabel: "Fri 25 Sep", caption: "grace, this call", state: "current" },
    { dateLabel: "Fri 2 Oct", caption: "last grace", state: "next" },
  ],
  lastGraceCloseUtc: "2026-10-03T00:00:00Z",
};

export interface AllInSchedule {
  fireDate: string;
  closeDate: string;
}

function addDays(isoDate: string, days: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function shortFri(isoDate: string): string {
  return `Fri ${sentenceDate(isoDate).slice(0, -5)}`;
}

function graceWindow(fireDate: string, closeDate: string): NonNullable<FridayDocument["cash"]["window"]> {
  const grace = addDays(fireDate, 7);
  const last = addDays(fireDate, 14);
  const step = (date: string, caption: string) => ({
    dateLabel: shortFri(date),
    caption,
    state: (date < closeDate ? "done" : date === closeDate ? "current" : "next") as "done" | "current" | "next",
  });
  return {
    steps: [
      step(fireDate, "fired"),
      step(grace, closeDate === grace ? "grace, this call" : "grace"),
      step(last, "last grace"),
    ],
    lastGraceCloseUtc: `${addDays(last, 1)}T00:00:00Z`,
  };
}

function allInSentences(schedule?: AllInSchedule): string[] {
  if (schedule == null) return [...ALL_IN_SENTENCES];
  const last = sentenceDate(addDays(schedule.fireDate, 14));
  return [
    `Buy now, or by the Friday ${last} close.`,
    "After that close, the call is whatever that Friday says.",
    "Standing contribution continues.",
  ];
}

function cashBlock(
  posture: CashPosture,
  word: string,
  tone: Tone,
  sentences: string[],
  recordRows: RecordRow[],
  confident: boolean,
  window?: FridayDocument["cash"]["window"],
): FridayDocument["cash"] {
  const cash: FridayDocument["cash"] = {
    posture,
    word,
    tone,
    sentences,
    recordRows,
    highConfidence: confident,
  };
  if (window) cash.window = window;
  return cash;
}

export function cashCopy(input: CashFlags, schedule?: AllInSchedule): FridayDocument["cash"] {
  if (input.exit) {
    return cashBlock("NO_NEW_BUY", "No new buy", "neutral", ["No new buy."], [
      { key: "RECORD", text: "No floor." },
    ], false);
  }
  if (input.allIn) {
    const sentences = allInSentences(schedule);
    if (input.build) sentences.push("The build slice also runs.");
    const window = schedule == null
      ? {
          steps: ALL_IN_WINDOW.steps.map((step) => ({ ...step })),
          lastGraceCloseUtc: ALL_IN_WINDOW.lastGraceCloseUtc,
        }
      : graceWindow(schedule.fireDate, schedule.closeDate);
    return cashBlock(
      "ALL_IN",
      "All in",
      "buy",
      sentences,
      ALL_IN_ROWS.map((row) => ({ ...row })),
      highConfidence(wilsonLower(4, 4)),
      window,
    );
  }
  if (input.build) {
    const sentences = [
      "One tranche, sliced this Friday, while under cost.",
      "A stand-down pause ends. Standing contribution resumes.",
    ];
    const recordRows: RecordRow[] = [
      { key: "RECORD", text: "79% of 91 weeks. 4 spells." },
      { key: "STATUS", text: "Schedule untested." },
    ];
    if (input.armedWait) {
      sentences.push("Cash waiting on the cross stays put.");
      recordRows.push({ key: "STATUS", text: "Armed wait untested." });
    }
    return cashBlock("BUILD", "Build", "buy", sentences, recordRows, false);
  }
  if (input.standDownPause) {
    return cashBlock(
      "STAND_DOWN",
      "Stand down",
      "sell",
      [
        "Pause new money for up to 12 months, or until All in or Build.",
        "At 12 months the cash follows the gap switch.",
      ],
      [
        { key: "RECORD", text: "7 of 8. Floor about 59%. About six episodes." },
        { key: "MISSES", text: "June 2013 lost. Missed 2019\u201320 and 2025\u201326." },
      ],
      false,
    );
  }
  if (input.lumpIn) {
    return cashBlock(
      "LUMP_IN",
      "Lump in",
      "buy",
      [
        "Cash available goes in on the Friday it is available.",
        "Standing contribution continues.",
      ],
      [
        { key: "RECORD", text: "6 of 6 finished regimes. Floor 69%." },
        { key: "STATUS", text: "One regime open since November 2025." },
      ],
      false,
    );
  }
  if (input.slowIn) {
    return cashBlock(
      "SLOW_IN",
      "Slow in",
      "buy",
      [
        "A new lump sum spreads over 12 months.",
        "Standing contribution continues.",
      ],
      [
        { key: "RECORD", text: "2 of 3 regimes. Floor 25%." },
        { key: "STATUS", text: "Weakest record on the page." },
      ],
      false,
    );
  }
  if (input.armedWait) {
    return cashBlock(
      "STAY",
      "Stay the course",
      "neutral",
      ["Standing contribution continues. Extra cash waits."],
      [
        { key: "RECORD", text: "No event record." },
        { key: "STATUS", text: "Armed wait untested." },
      ],
      false,
    );
  }
  return cashBlock(
    "STAY",
    "Stay the course",
    "neutral",
    ["Standing contribution only."],
    [
      { key: "RECORD", text: "No event record." },
      { key: "STATUS", text: "Between the gap lines, a new lump sum has no measured edge." },
    ],
    false,
  );
}

export function disagreement(posture: CashPosture, standDownPause: boolean): string | null {
  if (posture === "ALL_IN" && standDownPause) {
    return "Sell roll is also in its pause. All in still wins. The week is not cut in half.";
  }
  return null;
}

export function sameWeekCaveat(allIn: boolean, build: boolean): string | null {
  if (allIn && build) return "This week is not a higher probability.";
  return null;
}

export function armedWaitCaveat(posture: CashPosture, armedWait: boolean): string | null {
  if (!armedWait) return null;
  if (posture === "STAY") return "Waiting for the cross. The cross has not fired.";
  if (posture === "BUILD") return "Extra cash waits for the z-score to cross above zero.";
  return null;
}

const HOLD_CHIPS = ["Trim off · ceiling not set", "Exit off · thesis not declared"];

export function coinHold(): CoinCopy {
  return {
    posture: "HOLD",
    word: "Hold",
    tone: "neutral",
    sentences: ["Coins already held stay held."],
    offChips: [...HOLD_CHIPS],
  };
}

export function coinCopy(input: {
  trim: boolean;
  exit: boolean;
  standDownPause: boolean;
  declarationDateLabel?: string;
}): CoinCopy {
  if (input.exit) {
    const copy: CoinCopy = {
      posture: "EXIT",
      word: "Exit",
      tone: "sell",
      sentences: ["Sell all.", "No floor."],
      offChips: [],
    };
    if (input.declarationDateLabel) copy.declarationDateLabel = input.declarationDateLabel;
    return copy;
  }
  if (input.trim) {
    const sentences = [
      "Sell from the ceiling down to the target, highest-cost lots first.",
      "A sale can create a tax bill. Rate not computed.",
    ];
    if (input.standDownPause) sentences.push("Sped up: finish by the end of the pause.");
    return {
      posture: "TRIM",
      word: "Trim",
      tone: "sell",
      sentences,
      offChips: [],
      taxLine: "A sale can create a tax bill. Rate not computed.",
    };
  }
  return coinHold();
}
