const MUTED = "#9BA6B5";
const SELL = "#F2A65A";

export function brandIcon(): string {
  return icon(
    24,
    `<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#6CB4FF" stroke-width="2"/><path d="M8 15L11 11L13.5 13L16.5 8.5" fill="none" stroke="#6CB4FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
}

export function lockIcon(): string {
  return icon(
    14,
    `<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="${MUTED}" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="${MUTED}" stroke-width="2"/>`,
  );
}

export function settingsIcon(): string {
  return icon(
    18,
    `<path d="M4 7H14M18 7H20M4 17H8M12 17H20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>`,
  );
}

export function backIcon(): string {
  return icon(
    18,
    `<path d="M15 6L9 12L15 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
}

export function caveatIcon(kind: "gold" | "fireWeek" | "fit" | "sameWeek" | "armedWait"): string {
  switch (kind) {
    case "gold":
      return icon(
        20,
        `<path d="M12 3L22 20H2Z" fill="none" stroke="${SELL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10V14" stroke="${SELL}" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="${SELL}"/>`,
      );
    case "fireWeek":
      return icon(
        20,
        `<path d="M4 17L10 11L13 14L20 7" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7H20V12" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    case "fit":
      return icon(
        20,
        `<path d="M3 18C8 17 12 12 21 5" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round"/><path d="M3 12C9 11 13 8 21 3" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"/>`,
      );
    case "sameWeek":
      return icon(
        20,
        `<path d="M12 3L21 8L12 13L3 8Z" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 13L12 18L21 13" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    case "armedWait":
      return icon(
        20,
        `<circle cx="12" cy="12" r="9" fill="none" stroke="${MUTED}" stroke-width="1.8"/><path d="M12 7V12L15 14" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
  }
}

export function legendSwatch(kind: "price" | "trend" | "upper" | "lower" | "average" | "buy" | "sell"): string {
  switch (kind) {
    case "price":
      return legendLine("#E6EAF0", "2");
    case "trend":
      return legendLine("#7F8A9A", "1.5");
    case "upper":
      return legendLine(SELL, "1.5", "2 3");
    case "lower":
      return legendLine("#6CB4FF", "1.5", "2 3");
    case "average":
      return legendLine("#5F6A7A", "1.2", "5 3");
    case "buy":
      return glyph("0 0 12 12", 11, 11, `<circle cx="6" cy="6" r="5" fill="#6CB4FF"/>`);
    case "sell":
      return glyph("0 0 12 12", 11, 11, `<path d="M6 1L11 6L6 11L1 6Z" fill="${SELL}"/>`);
  }
}

function legendLine(stroke: string, width: string, dash?: string): string {
  const dashAttr = dash == null ? "" : ` stroke-dasharray="${dash}"`;
  return glyph(
    "0 0 20 8",
    20,
    8,
    `<line x1="0" y1="4" x2="20" y2="4" stroke="${stroke}" stroke-width="${width}"${dashAttr}/>`,
  );
}

function icon(size: number, body: string): string {
  return glyph("0 0 24 24", size, size, body);
}

function glyph(viewBox: string, width: number, height: number, body: string): string {
  return `<svg viewBox="${viewBox}" width="${width}" height="${height}" aria-hidden="true">${body}</svg>`;
}
