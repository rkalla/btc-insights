import { paintProjection } from "../painter/projection.ts";
import { PROJECTION_COPY, isProjectionDocument, projectionFromDocuments } from "../projection/portfolio.ts";
import { loadSettings } from "../settings/store.ts";

function boot(): void {
  if (typeof document === "undefined") return;
  const root = document.querySelector("#projection");
  if (root == null) return;
  void load(root);
}

async function load(root: Element): Promise<void> {
  let projectionBody: unknown;
  try {
    projectionBody = await fetchJson("/data/projection.json");
  } catch {
    show(root, PROJECTION_COPY.noReplay);
    return;
  }
  if (!isProjectionDocument(projectionBody)) {
    show(root, PROJECTION_COPY.noReplay);
    return;
  }
  let liveBody: unknown;
  try {
    liveBody = await fetchJson("/data/live.json");
  } catch {
    show(root, PROJECTION_COPY.noPrice);
    return;
  }
  const live = readLive(liveBody);
  if (live == null) {
    show(root, PROJECTION_COPY.noPrice);
    return;
  }
  const settings = loadSettings(localStorage);
  try {
    const model = projectionFromDocuments(
      projectionBody,
      live.spot,
      live.date,
      settings.coinsHeld,
      settings.standingAmount,
      settings.standingEvery,
      live.stale,
    );
    root.innerHTML = paintProjection(model);
  } catch {
    show(root, PROJECTION_COPY.noReplay);
  }
}

function show(root: Element, message: string): void {
  root.innerHTML = `<h1>Projection</h1><p>${escapeText(message)}</p>`;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<unknown>;
}

function readLive(value: unknown): { spot: number; date: string; stale: boolean } | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as { spotUsd?: unknown; spotAsOf?: unknown; stale?: unknown };
  if (typeof record.spotUsd !== "number" || !(record.spotUsd > 0)) return null;
  if (typeof record.spotAsOf !== "string" || record.spotAsOf.length < 10) return null;
  return {
    spot: record.spotUsd,
    date: record.spotAsOf.slice(0, 10),
    stale: record.stale === true,
  };
}

function escapeText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

boot();
