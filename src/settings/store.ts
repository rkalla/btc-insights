import type { HolderSettings } from "../contract/types.ts";

export const SETTINGS_KEY = "btc-insights.settings.v1";

export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function blankSettings(): HolderSettings {
  return {
    standingAmount: null,
    standingEvery: null,
    buildAmount: null,
    cashAvailable: null,
    coinsHeld: null,
    netWorth: null,
    targetShare: null,
    ceilingShare: null,
    thesisBroken: false,
    thesisDate: null,
    account: null,
  };
}

export function parseSettings(raw: string | null): HolderSettings {
  if (raw == null || raw === "") {
    return blankSettings();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return blankSettings();
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return blankSettings();
  }
  const record = parsed as Record<string, unknown>;
  const every = record.standingEvery;
  const account = record.account;
  const thesisDate = record.thesisDate;
  return {
    standingAmount: finiteOrNull(record.standingAmount),
    standingEvery: every === "week" || every === "month" ? every : null,
    buildAmount: finiteOrNull(record.buildAmount),
    cashAvailable: finiteOrNull(record.cashAvailable),
    coinsHeld: finiteOrNull(record.coinsHeld),
    netWorth: finiteOrNull(record.netWorth),
    targetShare: finiteOrNull(record.targetShare),
    ceilingShare: finiteOrNull(record.ceilingShare),
    thesisBroken: record.thesisBroken === true,
    thesisDate: typeof thesisDate === "string" && thesisDate !== "" ? thesisDate : null,
    account: account === "taxable" || account === "ira" || account === "fund" ? account : null,
  };
}

export function loadSettings(storage: SettingsStorage): HolderSettings {
  return parseSettings(storage.getItem(SETTINGS_KEY) ?? null);
}

export function saveSettings(storage: SettingsStorage, settings: HolderSettings): void {
  const stored: HolderSettings = {
    standingAmount: settings.standingAmount,
    standingEvery: settings.standingEvery,
    buildAmount: settings.buildAmount,
    cashAvailable: settings.cashAvailable,
    coinsHeld: settings.coinsHeld,
    netWorth: settings.netWorth,
    targetShare: settings.targetShare,
    ceilingShare: settings.ceilingShare,
    thesisBroken: settings.thesisBroken,
    thesisDate: settings.thesisDate,
    account: settings.account,
  };
  storage.setItem(SETTINGS_KEY, JSON.stringify(stored));
}

function finiteOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}
