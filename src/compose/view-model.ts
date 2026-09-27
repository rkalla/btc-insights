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
    const due = sentenceDate(live.officialCloseDate);
    cash.posture = "NO_CALL";
    cash.word = "No call";
    cash.tone = "neutral";
    cash.sentences = [
      `The Friday ${due} close is missing. There is no official call until it arrives.`,
    ];
    cash.recordRows = [];
    delete cash.window;
    rails = { cash: null, coins: coins.posture };
    const previous = friday.previousOfficial;
    if (previous == null) {
      context = [];
    } else {
      const label = previous.closeLabel.startsWith("Fri")
        ? previous.closeLabel
        : `Fri ${previous.closeLabel}`;
      context = previous.context.map((reading) => {
        const copy = cloneReading(reading);
        copy.value = `${reading.value} (from ${label})`;
        return copy;
      });
    }
  }

  let stale = live.stale;
  if (!stale) {
    const ageMs = Date.parse(openedAt) - Date.parse(live.spotAsOf);
    stale = Number.isFinite(ageMs) && ageMs > STALE_AFTER_MS;
  }
  let staleNote: string | null = null;
  if (stale) {
    const spotMs = Date.parse(live.spotAsOf);
    const isoDate = Number.isFinite(spotMs)
      ? new Date(spotMs).toISOString().slice(0, 10)
      : live.spotAsOf;
    staleNote = `The latest print is from ${sentenceDate(isoDate)}. Levels may be out of date.`;
  }

  let countdown: string | null = null;
  const lastGrace = cash.window?.lastGraceCloseUtc;
  if (lastGrace != null) {
    const closeMs = Date.parse(lastGrace);
    const openedMs = Date.parse(openedAt);
    if (Number.isFinite(closeMs) && Number.isFinite(openedMs)) {
      if (openedMs >= closeMs) {
        delete cash.window;
      } else {
        const days = Math.floor((closeMs - openedMs) / DAY_MS);
        countdown = days < 1 ? "Closes today" : days === 1 ? "1 day left" : `${days} days left`;
      }
    }
  }

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
      staleNote,
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
    countdown,
  };
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
