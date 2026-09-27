import { sentenceDate } from "../contract/format.ts";
import type {
  ContextReading,
  CycleCard,
  DashboardVM,
  FridayDocument,
  HolderSettings,
  LiveSlice,
} from "../contract/types.ts";
import { applyHolder } from "../settings/holder.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_MS = 26 * 60 * 60 * 1000;

export function compose(
  friday: FridayDocument,
  live: LiveSlice,
  settings: HolderSettings,
  openedAt: string,
): DashboardVM {
  const held = applyHolder(friday, settings, live.spotUsd);
  const cash = held.cash;
  const coins = held.coins;
  let rails = held.rails;
  let context = friday.context.map(cloneReading);

  if (live.missingClose) {
    cash.posture = "NO_CALL";
    cash.word = "No call";
    cash.tone = "neutral";
    cash.sentences = [missingSentence(live)];
    cash.recordRows = [];
    delete cash.window;
    rails = { cash: null, coins: coins.posture };
    context =
      friday.previousOfficial == null ? [] : previousContext(friday.previousOfficial);
  }

  const stale = printIsStale(live, openedAt);

  return {
    openedAt,
    official: {
      closeDate: friday.official.closeDate,
      closeLabel: friday.official.closeLabel,
      nextCloseDate: friday.official.nextCloseDate,
      nextCloseLabel: friday.official.nextCloseLabel,
    },
    now: {
      spotUsd: live.spotUsd,
      gapPct: live.gapPct,
      trendUsd: live.trendUsd,
      printLabel: live.printLabel,
      isOfficialClose: live.isOfficialClose,
      developing: live.developing == null ? "Developing: none." : live.developing,
      stale,
      staleNote: stale ? stalePrintNote(live.spotAsOf) : null,
    },
    rails,
    cash,
    coins,
    disagreement: friday.disagreement,
    caveats: friday.caveats.map((caveat) => ({
      kind: caveat.kind,
      title: caveat.title,
      body: caveat.body,
    })),
    chart: {
      ...friday.chart,
      spot: { date: live.chartTip.date, value: live.chartTip.value },
    },
    context,
    longView: {
      statement: friday.longView.statement,
      caveat: friday.longView.caveat,
      tiles: friday.longView.tiles.map((tile) => ({ ...tile })),
    },
    cycles: {
      intro: friday.cycles.intro,
      footnote: friday.cycles.footnote,
      cards: friday.cycles.cards.map((card) =>
        card.isProgress ? cloneCard(live.progress) : cloneCard(card),
      ),
    },
    footer: [friday.footer[0], friday.footer[1]],
    countdown: countdownLabel(cash, openedAt),
  };
}

function missingSentence(live: LiveSlice): string {
  // The live slice names the Friday whose close was due.
  const due = sentenceDate(live.officialCloseDate);
  return `The Friday ${due} close is missing. There is no official call until it arrives.`;
}

function previousContext(
  previous: NonNullable<FridayDocument["previousOfficial"]>,
): ContextReading[] {
  const label = previous.closeLabel.startsWith("Fri")
    ? previous.closeLabel
    : `Fri ${previous.closeLabel}`;
  return previous.context.map((reading) => {
    const copy = cloneReading(reading);
    copy.value = `${reading.value} (from ${label})`;
    return copy;
  });
}

function printIsStale(live: LiveSlice, openedAt: string): boolean {
  if (live.stale) {
    return true;
  }
  const ageMs = Date.parse(openedAt) - Date.parse(live.spotAsOf);
  return Number.isFinite(ageMs) && ageMs > STALE_AFTER_MS;
}

function stalePrintNote(spotAsOf: string): string {
  return `The latest print is from ${spotCalendarDate(spotAsOf)}. Levels may be out of date.`;
}

function spotCalendarDate(spotAsOf: string): string {
  const ms = Date.parse(spotAsOf);
  const isoDate = Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : spotAsOf;
  return sentenceDate(isoDate);
}

function countdownLabel(cash: FridayDocument["cash"], openedAt: string): string | null {
  const last = cash.window?.lastGraceCloseUtc;
  if (last == null) {
    return null;
  }
  const closeMs = Date.parse(last);
  const openedMs = Date.parse(openedAt);
  if (!Number.isFinite(closeMs) || !Number.isFinite(openedMs)) {
    return null;
  }
  if (openedMs >= closeMs) {
    delete cash.window;
    return null;
  }
  const days = Math.floor((closeMs - openedMs) / DAY_MS);
  if (days < 1) {
    return "Closes today";
  }
  return days === 1 ? "1 day left" : `${days} days left`;
}

function cloneReading(reading: ContextReading): ContextReading {
  const copy: ContextReading = {
    key: reading.key,
    label: reading.label,
    flag: reading.flag,
    flagTone: reading.flagTone,
    value: reading.value,
    note: reading.note,
  };
  if (reading.fromCloseLabel != null) {
    copy.fromCloseLabel = reading.fromCloseLabel;
  }
  return copy;
}

function cloneCard(card: CycleCard): CycleCard {
  const copy: CycleCard = {
    title: card.title,
    range: card.range,
    isProgress: card.isProgress,
    rows: card.rows.map((row) => ({
      signal: row.signal,
      name: row.name,
      sharePct: row.sharePct,
      detail: row.detail,
    })),
  };
  if (card.lead != null) {
    copy.lead = card.lead;
  }
  if (card.note != null) {
    copy.note = card.note;
  }
  return copy;
}
