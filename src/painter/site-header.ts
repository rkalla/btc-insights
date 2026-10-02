import { PROJECTION_PUBLIC } from "../projection/publish.ts";

export type SitePage = "week" | "evidence" | "projection" | "settings";

const WEEK_HREF = "/";
const EVIDENCE_HREF = "/evidence/";
const PROJECTION_HREF = "/projection/";
const SETTINGS_HREF = "/settings.html";
const REPO_HREF = "https://github.com/rkalla/btc-insights";
const DISCLAIMER =
  "BTC Friday is research, not personal financial advice. It looks at Bitcoin's price history, and history can be wrong about the future. It doesn't know your full situation, doesn't trade for you and doesn't calculate taxes. Before investing money you can't afford to lose, talk to a fee-only financial adviser.";

export function siteHeader(current: SitePage | null): string {
  const weekCurrent = current === "week" ? ` aria-current="page"` : "";
  const evidenceCurrent = current === "evidence" ? ` aria-current="page"` : "";
  const projectionCurrent = current === "projection" ? ` aria-current="page"` : "";
  const settingsCurrent = current === "settings" ? ` aria-current="page"` : "";
  const projectionTab = PROJECTION_PUBLIC
    ? `<li><a href="${PROJECTION_HREF}"${projectionCurrent}>Projection</a></li>`
    : "";
  return `<header class="site">
  <div class="site-inner">
    <a class="brand" href="${WEEK_HREF}"><span class="brand-mark" aria-hidden="true"></span>BTC Friday</a>
    <nav aria-label="Main">
      <ul class="tabs">
        <li><a href="${WEEK_HREF}"${weekCurrent}>This week</a></li>
        <li><a href="${EVIDENCE_HREF}"${evidenceCurrent}>Evidence</a></li>
        ${projectionTab}
      </ul>
    </nav>
    <div class="site-tools">
      <button type="button" class="theme" aria-label="Color mode: System">
        ${systemIcon()}
        ${sunIcon()}
        ${moonIcon()}
      </button>
      <span class="sr-only" data-color-mode-live aria-live="polite"></span>
      <a class="gear" href="${SETTINGS_HREF}" aria-label="Settings"${settingsCurrent}>
        ${gearIcon()}
        <span class="gear-label">Settings</span>
      </a>
    </div>
  </div>
</header>`;
}

export function siteFooter(): string {
  return `<footer class="foot" id="about"><div class="foot-inner"><p>${DISCLAIMER}</p>${footerLinks()}</div></footer>`;
}

export function footerLinks(): string {
  const projection = PROJECTION_PUBLIC ? `<a href="${PROJECTION_HREF}">Projection</a>` : "";
  return `<div class="foot-links"><a href="${EVIDENCE_HREF}">Evidence</a>${projection}<a href="${SETTINGS_HREF}">Settings</a><a class="repo" href="${REPO_HREF}">${githubIcon()}<span>GitHub</span></a></div>`;
}

function githubIcon(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;
}

function systemIcon(): string {
  return `<svg class="theme-icon theme-icon--system" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>`;
}

function sunIcon(): string {
  return `<svg hidden class="theme-icon theme-icon--light" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v1.6M12 19.4V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.6M19.4 12H21M4.9 19.1l1.1-1.1M18 6l1.1-1.1"/></svg>`;
}

function moonIcon(): string {
  return `<svg hidden class="theme-icon theme-icon--dark" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/></svg>`;
}

function gearIcon(): string {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
}
