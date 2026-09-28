import { money } from "../contract/format.ts";
import type {
  CashPosture,
  FridayDocument,
  HolderSettings,
  LiveSlice,
  PresentationFacts,
} from "../contract/types.ts";
import {
  regularNote,
  renderWeek,
  type RenderInput,
  type WeekCopy,
  type WeekState,
  type WeekStep,
} from "../copy/thisWeek.ts";
import { isDeclarationDate } from "../settings/validate.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export interface FridayStateOverlay {
  cash?: { posture: CashPosture };
  standDownPause?: boolean;
  armedWait?: boolean;
  standDownFireDate?: string | null;
  official?: Partial<FridayDocument["official"]>;
  caveats?: FridayDocument["caveats"];
}

export interface TrimMeasure {
  on: boolean;
  sharePct: number;
  saleUsd: number;
  saleBtc: number;
}

export interface PlainView {
  schema: 1;
  state: WeekState;
  step: WeekStep | null;
  addMode: "AT_ONCE" | "WEEKLY" | null;
  tone: "buy" | "caution" | "neutral";
  gold: boolean;
  gettingClose: boolean;
  replacesPause: boolean;
  outOfDate: boolean;
  takeProfit: boolean;
  deadlineUtc: string | null;
  pauseEnds: string | null;
  updatedUtc: string;
  nextUpdateUtc: string;
  latestPriceUsd: number;
  latestPriceUtc: string;
  gapFraction: number;
  sharePct: number | null;
  trimUsd: number | null;
  trimBtc: number | null;
  copy: WeekCopy;
}

export function stepForPosture(posture: CashPosture): WeekStep | null {
  switch (posture) {
    case "ALL_IN":
      return "Buy strongly";
    case "LUMP_IN":
    case "BUILD":
      return "Add";
    case "STAY":
      return "Steady";
    case "SLOW_IN":
      return "Go slow";
    case "STAND_DOWN":
    case "NO_NEW_BUY":
      return "Pause";
    case "NO_CALL":
      return null;
  }
}

export function addModeFor(posture: CashPosture): "AT_ONCE" | "WEEKLY" | null {
  if (posture === "LUMP_IN") return "AT_ONCE";
  if (posture === "BUILD") return "WEEKLY";
  return null;
}

export function shareMeetsCeiling(sharePct: number, ceiling: number): boolean {
  return sharePct >= ceiling - 1e-6;
}

export function displayDollars(amount: number): string {
  const rounded = amount > 1000 ? threeSignificant(amount) : Math.round(amount);
  return money(rounded);
}

export function addCalendarMonths(isoDate: string, months: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1 + months, day)).toISOString().slice(0, 10);
}

export function measureTrim(spotUsd: number, settings: HolderSettings): TrimMeasure | null {
  const coins = settings.coinsHeld;
  const investments = settings.netWorth;
  const target = settings.targetShare;
  const ceiling = settings.ceilingShare;
  if (
    !isFiniteNumber(coins) ||
    !isFiniteNumber(investments) ||
    !isFiniteNumber(target) ||
    !isFiniteNumber(ceiling) ||
    !(investments > 0) ||
    !Number.isFinite(spotUsd) ||
    !(spotUsd > 0)
  ) {
    return null;
  }
  const sharePct = (coins * spotUsd * 100) / investments;
  const saleUsd = coins * spotUsd - (target / 100) * investments;
  return {
    on: shareMeetsCeiling(sharePct, ceiling),
    sharePct: Math.round(sharePct),
    saleUsd,
    saleBtc: saleUsd / spotUsd,
  };
}

export function applyOverlay(friday: FridayDocument, overlay: FridayStateOverlay): FridayDocument {
  const posture = overlay.cash?.posture ?? friday.cash.posture;
  const next: FridayDocument = {
    ...friday,
    cash: { ...friday.cash, posture },
    official: overlay.official != null ? { ...friday.official, ...overlay.official } : { ...friday.official },
    caveats: overlay.caveats ?? friday.caveats,
  };
  if (overlay.standDownPause != null) next.standDownPause = overlay.standDownPause;
  if (overlay.armedWait != null) next.armedWait = overlay.armedWait;
  if ("standDownFireDate" in overlay) next.standDownFireDate = overlay.standDownFireDate ?? null;
  return next;
}

export function composePlain(
  friday: FridayDocument,
  live: LiveSlice,
  settings: HolderSettings,
  openedAt: string,
  timeZone: string,
): PlainView {
  const missingClose = live.missingClose;
  const sell = sellOn(settings);
  const posture = friday.cash.posture;
  const state = pageState(posture, missingClose, sell);
  const step = state === "NO_UPDATE" ? null : state === "SELL" ? "Pause" : stepForPosture(posture);
  const addMode = state === "ADD_AT_ONCE" || state === "ADD_WEEKLY" ? addModeFor(posture) : null;
  const gold = state === "BUY_STRONGLY" && friday.caveats.some((caveat) => caveat.kind === "gold");
  const gettingClose = friday.armedWait && (state === "ADD_AT_ONCE" || state === "ADD_WEEKLY" || state === "STEADY");
  const replacesPause = friday.standDownPause && (state === "BUY_STRONGLY" || state === "ADD_WEEKLY");
  const measured = measureTrim(live.spotUsd, settings);
  const takeProfit = measured != null && measured.on && state !== "SELL" && state !== "NO_UPDATE";
  const outOfDate = pageOutOfDate(friday, live, openedAt);
  const updatedUtc = fridayCloseInstant(friday.official.closeDate);
  const nextUpdateUtc = fridayCloseInstant(friday.official.nextCloseDate);
  const deadlineUtc = state === "BUY_STRONGLY" ? friday.cash.window?.lastGraceCloseUtc ?? null : null;
  const pauseStart = friday.standDownFireDate ?? null;
  const pauseEnds = pauseStart == null ? null : addCalendarMonths(pauseStart, 12);
  const updatedMs = Date.parse(updatedUtc);
  const nextMs = Date.parse(nextUpdateUtc);
  const openedMs = Date.parse(openedAt);
  const deadlineMs = deadlineUtc == null ? null : Date.parse(deadlineUtc);
  const deadlinePassed = deadlineMs != null && Number.isFinite(openedMs) && openedMs >= deadlineMs;
  const daysLeft = deadlineMs != null && Number.isFinite(openedMs)
    ? calendarDaysLeft(openedMs, deadlineMs, timeZone)
    : null;
  const gap = gapFacts(live.gapPct);
  const showPersonalise =
    ((state === "BUY_STRONGLY" || state === "ADD_AT_ONCE") && settings.cashAvailable == null) ||
    (state === "ADD_WEEKLY" && settings.buildAmount == null);
  const input: RenderInput = {
    state,
    step,
    gold,
    gettingClose,
    replacesPause,
    takeProfit,
    outOfDate,
    showPersonalise,
    dropTax: settings.account === "ira",
    deadlinePassed,
    daysLeft,
    updatedShort: formatDayLong(updatedMs, timeZone),
    updated: formatWhen(updatedMs, timeZone),
    nextUpdate: formatWhen(nextMs, timeZone),
    nextUpdateShort: formatDayShort(nextMs, timeZone),
    deadline: deadlineMs == null ? null : formatWhen(deadlineMs, timeZone),
    amount: dollarOrNull(settings.cashAvailable),
    regularNote: regularNote(dollarOrNull(settings.standingAmount), settings.standingEvery),
    slice: settings.buildAmount == null || !Number.isFinite(settings.buildAmount)
      ? null
      : displayDollars(settings.buildAmount / 26),
    gap: gap.gap,
    gapWords: gap.gapWords,
    fireDate: fireDateLabel(friday.presentation),
    pauseDate: pauseStart == null ? null : formatMonthDay(pauseStart),
    pauseEnds: pauseEnds == null ? null : formatMonthDayYear(pauseEnds),
    declaredDate: sell && settings.thesisDate != null ? formatMonthDay(settings.thesisDate) : null,
    trimUsd: takeProfit && measured != null ? displayDollars(measured.saleUsd) : null,
    trimBtc: takeProfit && measured != null ? btcText(measured.saleBtc) : null,
    target: takeProfit && measured != null ? String(Math.round(settings.targetShare ?? 0)) : null,
    ceiling: takeProfit && measured != null ? String(Math.round(settings.ceilingShare ?? 0)) : null,
    share: takeProfit && measured != null ? String(measured.sharePct) : null,
    priceLabel: priceLabel(live.spotUsd, live.spotAsOf, timeZone),
    tiles: tileLines(friday.presentation),
  };
  return {
    schema: 1,
    state,
    step,
    addMode,
    tone: step === "Add" || step === "Buy strongly" ? "buy" : step === "Pause" || step === "Go slow" ? "caution" : "neutral",
    gold,
    gettingClose,
    replacesPause,
    outOfDate,
    takeProfit,
    deadlineUtc,
    pauseEnds,
    updatedUtc,
    nextUpdateUtc,
    latestPriceUsd: live.spotUsd,
    latestPriceUtc: live.spotAsOf,
    gapFraction: live.gapPct,
    sharePct: measured?.sharePct ?? null,
    trimUsd: measured?.saleUsd ?? null,
    trimBtc: measured?.saleBtc ?? null,
    copy: renderWeek(input),
  };
}

function pageState(posture: CashPosture, missingClose: boolean, sell: boolean): WeekState {
  // A dated thesis replaces the engine state, including a missing close or no call.
  if (sell) return "SELL";
  if (missingClose || posture === "NO_CALL") return "NO_UPDATE";
  switch (posture) {
    case "ALL_IN":
      return "BUY_STRONGLY";
    case "LUMP_IN":
      return "ADD_AT_ONCE";
    case "BUILD":
      return "ADD_WEEKLY";
    case "STAY":
      return "STEADY";
    case "SLOW_IN":
      return "GO_SLOW";
    case "STAND_DOWN":
    case "NO_NEW_BUY":
      return "PAUSE";
  }
}

function pageOutOfDate(friday: FridayDocument, live: LiveSlice, openedAt: string): boolean {
  if (live.missingClose) return true;
  const nextMs = Date.parse(fridayCloseInstant(friday.official.nextCloseDate));
  const openedMs = Date.parse(openedAt);
  if (!Number.isFinite(nextMs) || !Number.isFinite(openedMs)) return false;
  // A 26-hour-old print is a different state and does not raise this banner.
  if (!(openedMs > nextMs + SIX_HOURS_MS)) return false;
  return friday.official.closeDate < friday.official.nextCloseDate;
}

function sellOn(settings: HolderSettings): boolean {
  return settings.thesisBroken === true && isDeclarationDate(settings.thesisDate);
}

function fridayCloseInstant(isoDate: string): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString();
}

function fireDateLabel(presentation: PresentationFacts): string {
  const open = [...presentation.history].reverse().find((row) => row.oneYearPct == null);
  const iso = open?.fireDate ?? presentation.history[presentation.history.length - 1]?.fireDate;
  return iso == null ? "" : formatMonthDay(iso);
}

function tileLines(presentation: PresentationFacts): string[] {
  return presentation.history.map((row) => {
    if (row.oneYearPct == null) return `${row.year} In progress`;
    const pct = Math.round(row.oneYearPct);
    if (pct < 0) return `${row.year} \u2212${Math.abs(pct)}%`;
    return `${row.year} +${pct}%`;
  });
}

function dollarOrNull(value: number | null): string | null {
  if (!isFiniteNumber(value)) return null;
  return money(value);
}

function btcText(coins: number): string {
  return (Math.round(coins * 100) / 100).toFixed(2);
}

function priceLabel(usd: number, asOf: string, timeZone: string): string {
  const ms = Date.parse(asOf);
  const when = Number.isFinite(ms) ? formatWhen(ms, timeZone) : asOf;
  return `${money(usd)}, ${when}`;
}

// live.gapPct is a fraction. The below sentence only takes a gap that is actually below.
function gapFacts(gapPct: number): { gap: string | null; gapWords: string | null } {
  if (!Number.isFinite(gapPct)) return { gap: null, gapWords: null };
  const points = Math.round(gapPct * 100);
  const magnitude = Math.abs(points);
  if (points < 0 || Object.is(points, -0)) {
    return { gap: String(magnitude), gapWords: `about ${magnitude}% below` };
  }
  if (points > 0) return { gap: null, gapWords: `about ${magnitude}% above` };
  if (gapPct > 0) return { gap: null, gapWords: "about 0% above" };
  return { gap: "0", gapWords: "about 0% below" };
}

function threeSignificant(amount: number): number {
  const abs = Math.abs(amount);
  if (abs === 0) return 0;
  const digits = Math.floor(Math.log10(abs)) + 1;
  const factor = 10 ** (digits - 3);
  return Math.sign(amount) * Math.round(abs / factor) * factor;
}

function formatMonthDay(isoDate: string): string {
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return `${MONTHS[month - 1]} ${day}`;
}

function formatMonthDayYear(isoDate: string): string {
  return `${formatMonthDay(isoDate)}, ${isoDate.slice(0, 4)}`;
}

interface Zoned {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function zonedCalendar(ms: number, timeZone: string): Zoned {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((part) => [part.type, part.value]));
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
  };
}

function weekdayIndex(zoned: Zoned): number {
  return new Date(Date.UTC(zoned.year, zoned.month - 1, zoned.day)).getUTCDay();
}

function shown(ms: number, timeZone: string): Zoned {
  const zoned = zonedCalendar(ms, timeZone);
  if (zoned.hour === 0 && zoned.minute === 0) {
    return zonedCalendar(ms - 60_000, timeZone);
  }
  return zoned;
}

function formatWhen(ms: number, timeZone: string): string {
  const zoned = zonedCalendar(ms, timeZone);
  if (zoned.hour === 0 && zoned.minute === 0) {
    const prev = zonedCalendar(ms - 60_000, timeZone);
    return `${WEEKDAYS[weekdayIndex(prev)]}, ${MONTHS[prev.month - 1]} ${prev.day} at midnight`;
  }
  const period = zoned.hour >= 12 ? "pm" : "am";
  let hour = zoned.hour % 12;
  if (hour === 0) hour = 12;
  const minute = String(zoned.minute).padStart(2, "0");
  return `${WEEKDAYS[weekdayIndex(zoned)]}, ${MONTHS[zoned.month - 1]} ${zoned.day}, ${hour}:${minute} ${period}`;
}

function formatDayLong(ms: number, timeZone: string): string {
  const zoned = shown(ms, timeZone);
  return `${WEEKDAYS[weekdayIndex(zoned)]}, ${MONTHS[zoned.month - 1]} ${zoned.day}`;
}

function formatDayShort(ms: number, timeZone: string): string {
  const zoned = shown(ms, timeZone);
  return `${WEEKDAYS_SHORT[weekdayIndex(zoned)]}, ${MONTHS[zoned.month - 1]} ${zoned.day}`;
}

function calendarDaysLeft(nowMs: number, deadlineMs: number, timeZone: string): number {
  const deadlineDay = localDayStamp(deadlineMs - 60_000, timeZone);
  const today = localDayStamp(nowMs, timeZone);
  return Math.round((deadlineDay - today) / DAY_MS);
}

function localDayStamp(ms: number, timeZone: string): number {
  const zoned = zonedCalendar(ms, timeZone);
  return Date.UTC(zoned.year, zoned.month - 1, zoned.day);
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
