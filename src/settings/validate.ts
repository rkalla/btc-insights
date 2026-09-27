import type { HolderSettings } from "../contract/types.ts";

const THESIS_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface SettingsFieldError {
  field: keyof HolderSettings;
  message: string;
}

export function isDeclarationDate(value: string | null): boolean {
  if (value == null || !THESIS_DATE.test(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const length = MONTH_LENGTHS[month - 1];
  if (length == null || day < 1) {
    return false;
  }
  const maxDay = month === 2 && isLeapYear(year) ? 29 : length;
  return day <= maxDay;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function validateSettings(settings: HolderSettings): SettingsFieldError[] {
  const errors: SettingsFieldError[] = [];
  amountError(errors, "standingAmount", settings.standingAmount);
  amountError(errors, "buildAmount", settings.buildAmount);
  amountError(errors, "cashAvailable", settings.cashAvailable);
  coinsError(errors, settings.coinsHeld);
  amountError(errors, "netWorth", settings.netWorth);
  shareError(errors, "targetShare", settings.targetShare);
  shareError(errors, "ceilingShare", settings.ceilingShare);
  if (
    isFiniteNumber(settings.targetShare) &&
    isFiniteNumber(settings.ceilingShare) &&
    settings.ceilingShare <= settings.targetShare
  ) {
    errors.push({
      field: "ceilingShare",
      message: "Must be above the target share.",
    });
  }
  thesisError(errors, settings);
  return errors;
}

function amountError(
  errors: SettingsFieldError[],
  field: "standingAmount" | "buildAmount" | "cashAvailable" | "netWorth",
  value: number | null,
): void {
  if (value == null) {
    return;
  }
  if (!isFiniteNumber(value) || value < 0) {
    errors.push({ field, message: "Enter zero or more." });
  }
}

function coinsError(errors: SettingsFieldError[], value: number | null): void {
  if (value == null) {
    return;
  }
  if (!isFiniteNumber(value) || value < 0) {
    errors.push({ field: "coinsHeld", message: "Enter zero or more." });
    return;
  }
  if (!atMostDecimalPlaces(value, 8)) {
    errors.push({ field: "coinsHeld", message: "Use at most eight decimal places." });
  }
}

function shareError(
  errors: SettingsFieldError[],
  field: "targetShare" | "ceilingShare",
  value: number | null,
): void {
  if (value == null) {
    return;
  }
  if (!isFiniteNumber(value) || value < 0 || value > 100) {
    errors.push({ field, message: "Enter a share from 0 to 100." });
    return;
  }
  if (!atMostDecimalPlaces(value, 2)) {
    errors.push({ field, message: "Use at most two decimal places." });
  }
}

function thesisError(errors: SettingsFieldError[], settings: HolderSettings): void {
  const date = settings.thesisDate;
  if (settings.thesisBroken) {
    if (date == null || date === "") {
      errors.push({ field: "thesisDate", message: "Enter the declaration date." });
      return;
    }
    if (!isDeclarationDate(date)) {
      errors.push({ field: "thesisDate", message: "Use a YYYY-MM-DD date." });
    }
    return;
  }
  if (date != null && date !== "" && !isDeclarationDate(date)) {
    errors.push({ field: "thesisDate", message: "Use a YYYY-MM-DD date." });
  }
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function atMostDecimalPlaces(value: number, places: number): boolean {
  const text = value.toString().toLowerCase();
  const match = /^(-?\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(text);
  if (match == null) {
    return false;
  }
  const fraction = match[2] ?? "";
  const exponent = match[3] == null ? 0 : Number(match[3]);
  return Math.max(0, fraction.length - exponent) <= places;
}
