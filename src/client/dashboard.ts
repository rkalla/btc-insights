import { sentenceDate } from "../contract/format.ts";
import type { FridayDocument, LiveSlice } from "../contract/types.ts";
import { compose } from "../compose/view-model.ts";
import { chartSvg } from "../painter/chart.ts";
import { paintDashboard } from "../painter/dashboard.ts";
import { blankSettings, loadSettings } from "../settings/store.ts";
import type { HolderSettings } from "../contract/types.ts";
import { connectPoll, type PollHandle } from "./poll.ts";

const PHONE = "(max-width: 767px)";
const LOAD_ERROR = "The dashboard could not load its data. Nothing here is a call.";

let friday: FridayDocument | null = null;
let live: LiveSlice | null = null;
let currentVm: ReturnType<typeof compose> | null = null;
let openMarkerDate: string | null = null;
let chartWidthDrawn = -1;
let chartPhone = false;
let chartObserver: ResizeObserver | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let poll: PollHandle | null = null;
let rendering = false;

function boot(): void {
  if (typeof document === "undefined") return;
  poll = connectPoll(
    {
      now: () => Date.now(),
      visibility: () => (document.visibilityState === "visible" ? "visible" : "hidden"),
      setTimer: (ms, run) => window.setTimeout(run, ms),
      clearTimer: (handle) => {
        window.clearTimeout(handle as number);
      },
      fetchJson,
    },
    {
      onLive(body: unknown): void {
        live = asLive(body);
        render();
      },
      onFriday(body: unknown, liveBody: unknown): void {
        friday = asFriday(body);
        live = asLive(liveBody);
        render();
      },
      onError(): void {
        if (currentVm == null) showError();
      },
    },
  );
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("scroll", onScroll, true);
  void loadInitial();
}

async function loadInitial(): Promise<void> {
  try {
    const [fridayBody, liveBody] = await Promise.all([
      fetchJson("/data/friday.json"),
      fetchJson("/data/live.json"),
    ]);
    let nextFriday = asFriday(fridayBody);
    const nextLive = asLive(liveBody);
    if (nextLive.officialCloseDate !== nextFriday.official.closeDate) {
      nextFriday = asFriday(await fetchJson("/data/friday.json", { cache: "no-store" }));
    }
    friday = nextFriday;
    live = nextLive;
    render();
    poll?.loaded(nextFriday.official.closeDate);
  } catch {
    showError();
  }
}

async function fetchJson(url: string, init?: { cache?: "no-store" }): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error("fetch failed");
  return response.json() as Promise<unknown>;
}

function render(): void {
  if (friday == null || live == null) return;
  const y = window.scrollY;
  const date = openMarkerDate;
  const active = document.activeElement;
  const restoreDate = active instanceof Element ? active.closest(".marker")?.getAttribute("data-date") ?? null : null;
  const restoreId = active instanceof HTMLElement && active.id !== "" && active.closest(".page") != null ? active.id : null;
  const restoreShowFires = active instanceof Element && active.closest(".page .show-fires") != null;
  const restoreSettings = active instanceof Element && active.closest(".page a.icon-btn") != null;
  const vm = compose(friday, live, readHolder(), new Date().toISOString());
  rendering = true;
  try {
    mount(vm);
    window.scrollTo(0, y);
    if (date != null) {
      const marker = findMarker(date);
      if (marker == null) closePopover(false);
      else openPopover(marker, date, false);
    }
    if (restoreDate != null) findMarker(restoreDate)?.focus({ preventScroll: true });
    else if (restoreId != null) document.getElementById(restoreId)?.focus({ preventScroll: true });
    else if (restoreShowFires) {
      const button = document.querySelector(".show-fires");
      if (button instanceof HTMLElement) button.focus({ preventScroll: true });
    } else if (restoreSettings) {
      const link = document.querySelector("a.icon-btn");
      if (link instanceof HTMLElement) link.focus({ preventScroll: true });
    }
  } finally {
    rendering = false;
  }
  if (document.visibilityState === "visible") armCountdown();
}

function mount(vm: ReturnType<typeof compose>): void {
  currentVm = vm;
  chartWidthDrawn = -1;
  const page = document.querySelector(".page");
  if (!(page instanceof HTMLElement)) return;
  const holder = document.createElement("template");
  holder.innerHTML = paintDashboard(vm);
  const painted = holder.content.querySelector(".page");
  if (painted == null) return;
  page.replaceChildren(...Array.from(painted.childNodes));
  const header = page.querySelector("header");
  const main = document.createElement("main");
  main.className = "dashboard-main";
  const rest = Array.from(page.childNodes).filter((node) => node !== header);
  main.append(...rest);
  page.append(main);
  watchChart();
}

function readHolder(): HolderSettings {
  try {
    return loadSettings(localStorage);
  } catch {
    return blankSettings();
  }
}

function watchChart(): void {
  chartObserver?.disconnect();
  const figure = document.querySelector("figure.chart");
  if (!(figure instanceof HTMLElement)) return;
  chartObserver = new ResizeObserver(() => {
    redrawChart();
  });
  chartObserver.observe(figure);
  redrawChart();
}

function redrawChart(): void {
  const figure = document.querySelector("figure.chart");
  if (!(figure instanceof HTMLElement) || currentVm == null) return;
  const measured = contentWidth(figure);
  if (measured < 32) return;
  const phone = window.matchMedia(PHONE).matches;
  const drawWidth = measured;
  if (figure.querySelector(".chart-svg") != null && chartPhone === phone && Math.abs(drawWidth - chartWidthDrawn) < 2) {
    if (openMarkerDate != null) {
      const marker = findMarker(openMarkerDate);
      if (marker) positionPopover(marker);
    }
    return;
  }
  chartPhone = phone;
  chartWidthDrawn = drawWidth;
  const markup = chartSvg(currentVm.chart, currentVm.chart.spot, drawWidth, !phone);
  const at = markup.indexOf('\n<div class="sr-only"');
  const svg = (at < 0 ? markup : markup.slice(0, at)).replace('role="img"', 'role="group"');
  for (const old of figure.querySelectorAll(".chart-svg")) old.remove();
  const anchor = figure.querySelector(".show-fires");
  if (anchor) anchor.insertAdjacentHTML("beforebegin", svg);
  else figure.insertAdjacentHTML("beforeend", svg);
  if (openMarkerDate != null) {
    const marker = findMarker(openMarkerDate);
    if (marker == null) {
      closePopover(false);
      return;
    }
    markSelected(marker);
    positionPopover(marker);
  }
}

function contentWidth(el: HTMLElement): number {
  const style = getComputedStyle(el);
  const pad = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
  return Math.max(0, Math.floor(el.clientWidth - (Number.isFinite(pad) ? pad : 0)));
}

function onScroll(): void {
  if (rendering || openMarkerDate == null) return;
  closePopover(false);
}

function onClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const marker = target.closest(".marker");
  if (marker instanceof SVGGElement) {
    onMarker(marker);
    return;
  }
  if (target.closest(".show-fires") != null) {
    openSheet();
    return;
  }
  if (target.closest(".sheet-close") != null || (target.closest(".sheet-root") != null && target.closest(".sheet") == null)) {
    closeSheet();
    return;
  }
  if (openMarkerDate != null && target.closest(".fire-popover") == null) closePopover(true);
}

function onKey(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    if (isSheetOpen()) {
      event.preventDefault();
      closeSheet();
      return;
    }
    if (openMarkerDate != null) {
      event.preventDefault();
      closePopover(true);
    }
    return;
  }
  if (event.key === "Tab" && isSheetOpen()) {
    trapSheet(event);
    return;
  }
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const marker = target.closest(".marker");
  if (marker instanceof SVGGElement) {
    event.preventDefault();
    onMarker(marker);
  }
}

function onMarker(marker: SVGGElement): void {
  if (window.matchMedia(PHONE).matches) return;
  const date = marker.getAttribute("data-date");
  if (date == null) return;
  if (openMarkerDate === date) {
    closePopover(true);
    return;
  }
  openPopover(marker, date, true);
}

function openPopover(marker: SVGGElement, date: string, focus: boolean): void {
  const fire = currentVm?.chart.fires.find((item) => item.date === date);
  if (fire == null) return;
  const lines = fireLines(fire);
  const pop = ensurePopover();
  const title = pop.querySelector(".t");
  const result = pop.querySelector(".b");
  if (title) title.textContent = lines.title;
  if (result instanceof HTMLElement) {
    result.textContent = lines.result;
    result.hidden = lines.result === "";
  }
  pop.hidden = false;
  openMarkerDate = date;
  markSelected(marker);
  positionPopover(marker);
  if (focus) marker.focus();
}

function closePopover(restore: boolean): void {
  const date = openMarkerDate;
  openMarkerDate = null;
  const pop = document.querySelector(".fire-popover");
  if (pop instanceof HTMLElement) pop.hidden = true;
  const line = document.querySelector(".fire-connector");
  if (line instanceof HTMLElement) line.hidden = true;
  const marker = date == null ? null : findMarker(date);
  markSelected(null);
  if (restore && marker) marker.focus();
}

function positionPopover(marker: SVGGElement): void {
  const pop = document.querySelector(".fire-popover");
  if (!(pop instanceof HTMLElement) || pop.hidden) return;
  const hit = marker.querySelector(".m-hit");
  const rect = (hit instanceof Element ? hit : marker).getBoundingClientRect();
  const margin = 8;
  const width = pop.offsetWidth;
  const height = pop.offsetHeight;
  let left = rect.left + rect.width / 2 - width / 2;
  let top = rect.bottom + 12;
  let above = false;
  if (top + height > window.innerHeight - margin) {
    top = rect.top - height - 12;
    above = true;
  }
  if (top < margin) top = margin;
  if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
  if (left < margin) left = margin;
  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
  const line = document.querySelector(".fire-connector");
  if (!(line instanceof HTMLElement)) return;
  const x = rect.left + rect.width / 2;
  const y1 = above ? top + height : rect.bottom;
  const y2 = above ? rect.top : top;
  line.hidden = false;
  line.style.left = `${Math.round(x)}px`;
  line.style.top = `${Math.round(Math.min(y1, y2))}px`;
  line.style.height = `${Math.max(0, Math.round(Math.abs(y2 - y1)))}px`;
}

function ensurePopover(): HTMLElement {
  const existing = document.querySelector(".fire-popover");
  if (existing instanceof HTMLElement) return existing;
  const pop = document.createElement("div");
  pop.className = "fire-popover";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-labelledby", "fire-popover-title");
  pop.hidden = true;
  const title = document.createElement("p");
  title.className = "t";
  title.id = "fire-popover-title";
  const result = document.createElement("p");
  result.className = "b";
  pop.append(title, result);
  const line = document.createElement("div");
  line.className = "fire-connector";
  line.hidden = true;
  line.setAttribute("aria-hidden", "true");
  document.body.append(line, pop);
  return pop;
}

function markSelected(marker: SVGGElement | null): void {
  for (const el of document.querySelectorAll(".marker.is-selected")) {
    el.classList.remove("is-selected");
    el.removeAttribute("aria-expanded");
    el.querySelector(".m-sel")?.remove();
  }
  if (marker == null) return;
  marker.classList.add("is-selected");
  marker.setAttribute("aria-expanded", "true");
  const hit = marker.querySelector(".m-hit");
  if (!(hit instanceof SVGCircleElement)) return;
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("class", "m-sel");
  ring.setAttribute("cx", hit.getAttribute("cx") ?? "0");
  ring.setAttribute("cy", hit.getAttribute("cy") ?? "0");
  ring.setAttribute("r", "9");
  marker.append(ring);
}

function findMarker(date: string): SVGGElement | null {
  const marker = document.querySelector(`figure.chart .marker[data-date="${date}"]`);
  return marker instanceof SVGGElement ? marker : null;
}

function openSheet(): void {
  const vm = currentVm;
  if (vm == null) return;
  closePopover(false);
  const root = ensureSheet();
  const list = root.querySelector(".sheet-list");
  if (list == null) return;
  list.replaceChildren();
  const fires = [...vm.chart.fires].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  for (const fire of fires) {
    const lines = fireLines(fire);
    const row = document.createElement("div");
    row.className = "fire-row";
    const title = document.createElement("span");
    title.className = "t";
    title.textContent = lines.title;
    row.append(title);
    if (lines.result !== "") {
      const result = document.createElement("span");
      result.className = "b";
      result.textContent = lines.result;
      row.append(result);
    }
    list.append(row);
  }
  root.hidden = false;
  const close = root.querySelector(".sheet-close");
  if (close instanceof HTMLElement) close.focus();
}

function closeSheet(): void {
  const root = document.querySelector(".sheet-root");
  if (!(root instanceof HTMLElement) || root.hidden) return;
  root.hidden = true;
  const button = document.querySelector(".show-fires");
  if (button instanceof HTMLElement) button.focus();
}

function isSheetOpen(): boolean {
  const root = document.querySelector(".sheet-root");
  return root instanceof HTMLElement && !root.hidden;
}

function ensureSheet(): HTMLElement {
  const existing = document.querySelector(".sheet-root");
  if (existing instanceof HTMLElement) return existing;
  const root = document.createElement("div");
  root.className = "sheet-root";
  root.hidden = true;
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-labelledby", "fires-title");
  const head = document.createElement("div");
  head.className = "sheet-head";
  const title = document.createElement("h2");
  title.id = "fires-title";
  title.textContent = "Fires";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "btn btn--ghost sheet-close";
  close.textContent = "Close";
  head.append(title, close);
  const list = document.createElement("div");
  list.className = "sheet-list";
  sheet.append(head, list);
  root.append(sheet);
  document.body.append(root);
  return root;
}

function trapSheet(event: KeyboardEvent): void {
  const sheet = document.querySelector(".sheet");
  if (!(sheet instanceof HTMLElement)) return;
  const focusable = Array.from(sheet.querySelectorAll("button")).filter((el) => !el.disabled);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (first == null || last == null) return;
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !sheet.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

function fireLines(fire: FridayDocument["chart"]["fires"][number]): { title: string; result: string } {
  const title =
    fire.type === "sell"
      ? `${fire.titleLabel} · ${fire.resultLabel}`
      : `${fire.titleLabel} · ${sentenceDate(fire.date)}`;
  return { title, result: title.includes(fire.resultLabel) ? "" : fire.resultLabel };
}

function armCountdown(): void {
  if (countdownTimer != null) return;
  countdownTimer = setInterval(() => {
    if (document.visibilityState !== "visible") return;
    updateCountdown();
  }, 60_000);
}

function clearCountdown(): void {
  if (countdownTimer == null) return;
  clearInterval(countdownTimer);
  countdownTimer = null;
}

function updateCountdown(): void {
  if (friday == null || live == null) return;
  const vm = compose(friday, live, readHolder(), new Date().toISOString());
  currentVm = vm;
  if (vm.countdown == null) {
    document.querySelector(".window")?.remove();
    return;
  }
  const slot = document.querySelector(".window-left");
  if (slot) slot.textContent = vm.countdown;
}

function onVisibility(): void {
  poll?.visibilityChanged();
  if (document.visibilityState === "visible") {
    armCountdown();
    updateCountdown();
  } else {
    clearCountdown();
  }
}

function showError(): void {
  clearCountdown();
  chartObserver?.disconnect();
  chartObserver = null;
  openMarkerDate = null;
  const page = document.querySelector(".page");
  if (!(page instanceof HTMLElement)) return;
  page.innerHTML = `<main class="load-error-host"><section class="panel load-error"><p>${LOAD_ERROR}</p><button type="button" class="btn btn--primary">Try again</button></section></main>`;
  page.querySelector("button")?.addEventListener("click", () => {
    location.reload();
  });
}

function asLive(value: unknown): LiveSlice {
  if (typeof value !== "object" || value == null) throw new Error("live");
  const record = value as { officialCloseDate?: unknown; spotUsd?: unknown };
  if (typeof record.officialCloseDate !== "string" || typeof record.spotUsd !== "number") throw new Error("live");
  return value as LiveSlice;
}

function asFriday(value: unknown): FridayDocument {
  if (typeof value !== "object" || value == null) throw new Error("friday");
  const record = value as { official?: { closeDate?: unknown }; chart?: unknown };
  if (typeof record.official?.closeDate !== "string" || record.chart == null) throw new Error("friday");
  return value as FridayDocument;
}

boot();
