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
  return {
    standingAmount: finiteOrNull(record.standingAmount),
    standingEvery: everyOrNull(record.standingEvery),
    buildAmount: finiteOrNull(record.buildAmount),
    cashAvailable: finiteOrNull(record.cashAvailable),
    coinsHeld: finiteOrNull(record.coinsHeld),
    netWorth: finiteOrNull(record.netWorth),
    targetShare: finiteOrNull(record.targetShare),
    ceilingShare: finiteOrNull(record.ceilingShare),
    thesisBroken: record.thesisBroken === true,
    thesisDate: dateOrNull(record.thesisDate),
    account: accountOrNull(record.account),
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

function everyOrNull(value: unknown): HolderSettings["standingEvery"] {
  if (value === "week" || value === "month") {
    return value;
  }
  return null;
}

function accountOrNull(value: unknown): HolderSettings["account"] {
  if (value === "taxable" || value === "ira" || value === "fund") {
    return value;
  }
  return null;
}

function dateOrNull(value: unknown): string | null {
  if (typeof value !== "string" || value === "") {
    return null;
  }
  return value;
}
