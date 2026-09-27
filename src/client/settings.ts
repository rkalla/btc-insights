import type { HolderSettings } from "../contract/types.ts";
import { paintSettings } from "../painter/settings.ts";
import { blankSettings, loadSettings, saveSettings } from "../settings/store.ts";
import { validateSettings } from "../settings/validate.ts";

const FIELD_IDS: Partial<Record<keyof HolderSettings, string>> = {
  standingAmount: "standing-amount",
  buildAmount: "build-amount",
  cashAvailable: "cash-amount",
  coinsHeld: "coins-held",
  netWorth: "net-worth",
  targetShare: "target-share",
  ceilingShare: "ceiling-share",
  thesisDate: "thesis-date",
};

function bootSettings(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector("main.page") == null) {
    document.body.insertAdjacentHTML("afterbegin", paintSettings());
  }
  const page = document.querySelector("main.page");
  if (!(page instanceof HTMLElement)) return;
  let stored = blankSettings();
  try {
    stored = loadSettings(localStorage);
  } catch {
    stored = blankSettings();
  }
  fill(page, stored);
  wire(page);
}

function wire(page: HTMLElement): void {
  page.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  page.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const fields = fieldsFor(target);
    if (fields.length === 0) return;
    const errors = validateSettings(readSettings(page));
    for (const field of fields) {
      const message = errors.find((error) => error.field === field)?.message ?? null;
      setFieldError(page, field, message);
    }
  });
  const toggle = page.querySelector("button.switch");
  const state = page.querySelector("#thesis-state");
  const date = page.querySelector("#thesis-date");
  toggle?.addEventListener("click", () => {
    const on = toggle.getAttribute("aria-checked") !== "true";
    toggle.setAttribute("aria-checked", on ? "true" : "false");
    if (state) state.textContent = on ? "Declared" : "Not declared";
    if (date instanceof HTMLInputElement) date.disabled = !on;
    const message = validateSettings(readSettings(page)).find((error) => error.field === "thesisDate")?.message ?? null;
    setFieldError(page, "thesisDate", message);
  });
  const save = Array.from(page.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Save settings");
  save?.addEventListener("click", () => {
    const settings = readSettings(page);
    const errors = validateSettings(settings);
    for (const field of Object.keys(FIELD_IDS) as (keyof HolderSettings)[]) {
      const message = errors.find((error) => error.field === field)?.message ?? null;
      setFieldError(page, field, message);
    }
    if (errors.length > 0) {
      const invalid = page.querySelector("[aria-invalid='true']");
      if (invalid instanceof HTMLElement) invalid.focus();
      return;
    }
    try {
      saveSettings(localStorage, settings);
    } catch {
      return;
    }
    location.href = "index.html";
  });
}

function fieldsFor(target: Element): (keyof HolderSettings)[] {
  if (target.id === "standing-amount") return ["standingAmount"];
  if (target.id === "build-amount") return ["buildAmount"];
  if (target.id === "cash-amount") return ["cashAvailable"];
  if (target.id === "coins-held") return ["coinsHeld"];
  if (target.id === "net-worth") return ["netWorth"];
  if (target.id === "target-share" || target.id === "ceiling-share") return ["targetShare", "ceilingShare"];
  if (target.id === "thesis-date" || target.matches("button.switch")) return ["thesisDate"];
  return [];
}

function fill(page: ParentNode, settings: HolderSettings): void {
  writeNumber(page, "standing-amount", settings.standingAmount);
  writeNumber(page, "build-amount", settings.buildAmount);
  writeNumber(page, "cash-amount", settings.cashAvailable);
  writeNumber(page, "coins-held", settings.coinsHeld);
  writeNumber(page, "net-worth", settings.netWorth);
  writeNumber(page, "target-share", settings.targetShare);
  writeNumber(page, "ceiling-share", settings.ceilingShare);
  check(page, "every", settings.standingEvery);
  check(page, "account", settings.account);
  const toggle = page.querySelector("button.switch");
  if (toggle) toggle.setAttribute("aria-checked", settings.thesisBroken ? "true" : "false");
  const state = page.querySelector("#thesis-state");
  if (state) state.textContent = settings.thesisBroken ? "Declared" : "Not declared";
  const date = page.querySelector("#thesis-date");
  if (date instanceof HTMLInputElement) {
    date.disabled = !settings.thesisBroken;
    date.value = settings.thesisDate ?? "";
  }
}

function readSettings(page: ParentNode): HolderSettings {
  const every = checkedValue(page, "every");
  const account = checkedValue(page, "account");
  const date = page.querySelector("#thesis-date");
  const dateValue = date instanceof HTMLInputElement ? date.value.trim() : "";
  return {
    standingAmount: readNumber(page, "standing-amount"),
    standingEvery: every === "week" || every === "month" ? every : null,
    buildAmount: readNumber(page, "build-amount"),
    cashAvailable: readNumber(page, "cash-amount"),
    coinsHeld: readNumber(page, "coins-held"),
    netWorth: readNumber(page, "net-worth"),
    targetShare: readNumber(page, "target-share"),
    ceilingShare: readNumber(page, "ceiling-share"),
    thesisBroken: page.querySelector("button.switch")?.getAttribute("aria-checked") === "true",
    thesisDate: dateValue === "" ? null : dateValue,
    account: account === "taxable" || account === "ira" || account === "fund" ? account : null,
  };
}

function setFieldError(page: ParentNode, field: keyof HolderSettings, message: string | null): void {
  const id = FIELD_IDS[field];
  if (id == null) return;
  const input = page.querySelector(`#${id}`);
  if (!(input instanceof HTMLElement)) return;
  const wrap = input.closest(".field");
  if (wrap == null) return;
  const existing = wrap.querySelector(":scope > .error");
  if (message == null) {
    existing?.remove();
    input.removeAttribute("aria-invalid");
    const described = input.getAttribute("aria-describedby");
    if (described != null) {
      const next = described
        .split(/\s+/)
        .filter((token) => token !== "" && token !== `${id}-error`)
        .join(" ");
      if (next === "") input.removeAttribute("aria-describedby");
      else input.setAttribute("aria-describedby", next);
    }
    return;
  }
  let error = existing;
  if (!(error instanceof HTMLElement)) {
    error = document.createElement("span");
    error.className = "error";
    error.id = `${id}-error`;
    wrap.append(error);
  }
  error.textContent = message;
  input.setAttribute("aria-invalid", "true");
  const described = input.getAttribute("aria-describedby") ?? "";
  const token = `${id}-error`;
  if (!described.split(/\s+/).includes(token)) {
    input.setAttribute("aria-describedby", described === "" ? token : `${described} ${token}`);
  }
}

function readNumber(page: ParentNode, id: string): number | null {
  const input = page.querySelector(`#${id}`);
  if (!(input instanceof HTMLInputElement)) return null;
  const raw = input.value.trim().replaceAll(",", "").replaceAll("$", "").replaceAll("%", "");
  if (raw === "") return null;
  return Number(raw);
}

function writeNumber(page: ParentNode, id: string, value: number | null): void {
  const input = page.querySelector(`#${id}`);
  if (input instanceof HTMLInputElement) input.value = value == null ? "" : String(value);
}

function checkedValue(page: ParentNode, name: string): string | null {
  const input = page.querySelector(`input[name="${name}"]:checked`);
  return input instanceof HTMLInputElement ? input.value : null;
}

function check(page: ParentNode, name: string, value: string | null): void {
  if (value == null) return;
  const input = page.querySelector(`input[name="${name}"][value="${value}"]`);
  if (input instanceof HTMLInputElement) input.checked = true;
}

bootSettings();
