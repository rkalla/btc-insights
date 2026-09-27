import { money, sentenceDate } from "../contract/format.ts";
import type { DashboardVM, FridayDocument, HolderSettings } from "../contract/types.ts";
import { isDeclarationDate } from "./validate.ts";

const TAX_LINE = "A sale can create a tax bill. Rate not computed.";

export function applyHolder(friday: FridayDocument, settings: HolderSettings, spotUsd: number) {
  const exiting = exitOn(settings);
  const cash = cloneCash(friday.cash);
  if (exiting) {
    cash.posture = "NO_NEW_BUY";
    cash.word = "No new buy";
    cash.tone = "neutral";
    cash.sentences = ["No new buy."];
    cash.recordRows = [{ key: "RECORD", text: "No floor." }];
    cash.highConfidence = false;
    delete cash.window;
  } else {
    cash.sentences = appendDollarClause(cash.sentences, friday.dollarSlot, settings.cashAvailable);
  }

  const coins = exiting
    ? exitCoins(settings)
    : trimOn(settings, spotUsd)
      ? trimCoins(friday, settings)
      : holdCoins(friday, settings);

  return {
    cash,
    coins,
    rails: {
      cash: exiting ? null : cash.posture,
      coins: coins.posture,
    },
  };
}

function holdCoins(friday: FridayDocument, settings: HolderSettings): DashboardVM["coins"] {
  return {
    posture: "HOLD",
    word: friday.coinsHold.word,
    tone: friday.coinsHold.tone,
    sentences: [...friday.coinsHold.sentences],
    offChips: [trimOffChip(settings), exitOffChip(settings)],
  };
}

function trimCoins(friday: FridayDocument, settings: HolderSettings): DashboardVM["coins"] {
  const sentences = [
    "Sell from the ceiling down to the target, highest-cost lots first.",
    TAX_LINE,
  ];
  if (friday.standDownPause) {
    sentences.push("Sped up: finish by the end of the pause.");
  }
  return {
    posture: "TRIM",
    word: "Trim",
    tone: "sell",
    sentences,
    offChips: [exitOffChip(settings)],
    taxLine: TAX_LINE,
  };
}

function exitCoins(settings: HolderSettings): DashboardVM["coins"] {
  const date = settings.thesisDate ?? "";
  return {
    posture: "EXIT",
    word: "Exit",
    tone: "sell",
    sentences: ["Sell all.", "No floor."],
    offChips: [],
    taxLine: TAX_LINE,
    declarationDateLabel: sentenceDate(date),
  };
}

function appendDollarClause(
  sentences: readonly string[],
  dollarSlot: FridayDocument["dollarSlot"],
  cashAvailable: number | null,
): string[] {
  const next = [...sentences];
  if (dollarSlot == null) {
    return next;
  }
  const first = next[0];
  if (first == null) {
    return next;
  }
  const clause =
    typeof cashAvailable === "number" && Number.isFinite(cashAvailable)
      ? ` Up to ${money(cashAvailable)}.`
      : " Use your cash available to invest.";
  next[0] = `${first}${clause}`;
  return next;
}

function exitOn(settings: HolderSettings): boolean {
  return settings.thesisBroken === true && isDeclarationDate(settings.thesisDate);
}

function trimOn(settings: HolderSettings, spotUsd: number): boolean {
  const coinsHeld = settings.coinsHeld;
  const netWorth = settings.netWorth;
  const targetShare = settings.targetShare;
  const ceilingShare = settings.ceilingShare;
  if (
    !isFiniteNumber(coinsHeld) ||
    !isFiniteNumber(netWorth) ||
    !isFiniteNumber(targetShare) ||
    !isFiniteNumber(ceilingShare) ||
    !(netWorth > 0) ||
    !Number.isFinite(spotUsd)
  ) {
    return false;
  }
  const sharePct = (coinsHeld * spotUsd * 100) / netWorth;
  return sharePct >= ceilingShare - 1e-6;
}

function trimOffChip(settings: HolderSettings): string {
  if (!isFiniteNumber(settings.ceilingShare)) {
    return "Trim off · ceiling not set";
  }
  if (!isFiniteNumber(settings.coinsHeld)) {
    return "Trim off · coins not set";
  }
  if (!isFiniteNumber(settings.netWorth)) {
    return "Trim off · net worth not set";
  }
  if (!isFiniteNumber(settings.targetShare)) {
    return "Trim off · target not set";
  }
  if (settings.netWorth === 0) {
    return "Trim off · net worth is zero";
  }
  if (!(settings.netWorth > 0)) {
    return "Trim off · net worth not positive";
  }
  return "Trim off · share under the ceiling";
}

function exitOffChip(settings: HolderSettings): string {
  if (settings.thesisBroken !== true) {
    return "Exit off · thesis not declared";
  }
  return "Exit off · date not set";
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function cloneCash(cash: FridayDocument["cash"]): FridayDocument["cash"] {
  const copy: FridayDocument["cash"] = {
    posture: cash.posture,
    word: cash.word,
    tone: cash.tone,
    sentences: [...cash.sentences],
    recordRows: cash.recordRows.map((row) => ({ key: row.key, text: row.text })),
    highConfidence: cash.highConfidence,
  };
  if (cash.window != null) {
    copy.window = {
      lastGraceCloseUtc: cash.window.lastGraceCloseUtc,
      steps: cash.window.steps.map((step) => ({
        dateLabel: step.dateLabel,
        caption: step.caption,
        state: step.state,
      })),
    };
  }
  return copy;
}
