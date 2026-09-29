const INK = "var(--ink)";
const INK_2 = "var(--ink-2)";
const MUTED = "var(--ink-3)";
const BUY = "var(--buy-stroke)";
const SELL = "var(--caution)";

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
      return legendLine(INK, "2");
    case "trend":
      return legendLine(INK_2, "1.5");
    case "upper":
      return legendLine(SELL, "1.5", "2 3");
    case "lower":
      return legendLine(BUY, "1.5", "2 3");
    case "average":
      return legendLine(MUTED, "1.2", "1 3");
    case "buy":
      return glyph("0 0 12 12", 11, 11, `<circle cx="6" cy="6" r="5" fill="${BUY}"/>`);
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
