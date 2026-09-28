import { composePlain, type PlainView } from "../compose/plain.ts";
import type { FridayDocument, HolderSettings, LiveSlice } from "../contract/types.ts";
import { paintThisWeek, WEEK_LOAD_ERROR, WEEK_TRY_AGAIN } from "../painter/this-week.ts";
import { blankSettings, loadSettings } from "../settings/store.ts";
import { connectPoll, type PollHandle } from "./poll.ts";

let friday: FridayDocument | null = null;
let live: LiveSlice | null = null;
let painted = false;
let poll: PollHandle | null = null;

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
        if (!painted) showError();
      },
    },
  );
  document.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", () => {
    poll?.visibilityChanged();
  });
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
    if (painted) poll?.loaded(nextFriday.official.closeDate);
  } catch {
    if (!painted) showError();
  }
}

async function fetchJson(url: string, init?: { cache?: "no-store" }): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error("fetch failed");
  return response.json() as Promise<unknown>;
}

function render(): void {
  if (friday == null || live == null) return;
  let view: PlainView;
  try {
    view = composePlain(friday, live, readHolder(), new Date().toISOString(), viewerZone());
  } catch {
    if (!painted) showError();
    return;
  }
  mount(view);
  painted = true;
}

function mount(view: PlainView): void {
  const sheet = document.querySelector("#sheet");
  if (!(sheet instanceof HTMLElement)) throw new Error("sheet");
  const y = window.scrollY;
  const active = document.activeElement;
  const restoreHref = active instanceof HTMLAnchorElement && sheet.contains(active)
    ? active.getAttribute("href")
    : null;
  sheet.innerHTML = paintThisWeek(view);
  window.scrollTo(0, y);
  if (restoreHref != null && /^\/[a-z0-9./-]*$/i.test(restoreHref)) {
    const link = sheet.querySelector(`a[href="${restoreHref}"]`);
    if (link instanceof HTMLElement) link.focus({ preventScroll: true });
  }
}

function showError(): void {
  const sheet = document.querySelector("#sheet");
  if (!(sheet instanceof HTMLElement)) return;
  sheet.innerHTML = `<main id="week" class="page"><p class="load-error">${WEEK_LOAD_ERROR}</p><p><button type="button" class="retry">${WEEK_TRY_AGAIN}</button></p></main>`;
}

function onClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest(".retry") != null) location.reload();
}

function readHolder(): HolderSettings {
  try {
    return loadSettings(localStorage);
  } catch {
    return blankSettings();
  }
}

function viewerZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone != null && zone !== "") return zone;
  } catch {
    // A broken runtime zone still has to format. UTC keeps the page readable.
  }
  return "UTC";
}

function asLive(value: unknown): LiveSlice {
  if (typeof value !== "object" || value == null) throw new Error("live");
  const record = value as {
    officialCloseDate?: unknown;
    spotUsd?: unknown;
    spotAsOf?: unknown;
    gapPct?: unknown;
  };
  if (
    typeof record.officialCloseDate !== "string" ||
    typeof record.spotUsd !== "number" ||
    typeof record.spotAsOf !== "string" ||
    typeof record.gapPct !== "number"
  ) {
    throw new Error("live");
  }
  return value as LiveSlice;
}

function asFriday(value: unknown): FridayDocument {
  if (typeof value !== "object" || value == null) throw new Error("friday");
  const record = value as {
    official?: { closeDate?: unknown; nextCloseDate?: unknown };
    presentation?: unknown;
    cash?: { posture?: unknown };
  };
  const official = record.official;
  if (
    official == null ||
    typeof official.closeDate !== "string" ||
    typeof official.nextCloseDate !== "string" ||
    typeof record.cash?.posture !== "string"
  ) {
    throw new Error("friday");
  }
  return value as FridayDocument;
}

boot();
