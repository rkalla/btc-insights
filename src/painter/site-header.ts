export type SitePage = "week" | "evidence";

const WEEK_HREF = "/";
const EVIDENCE_HREF = "/evidence/";
const SETTINGS_HREF = "/settings.html";

export function siteHeader(current: SitePage): string {
  const weekCurrent = current === "week" ? ` aria-current="page"` : "";
  const evidenceCurrent = current === "evidence" ? ` aria-current="page"` : "";
  return `<header class="site">
  <div class="site-inner">
    <a class="brand" href="${WEEK_HREF}"><span class="brand-mark" aria-hidden="true"></span>BTC Friday</a>
    <nav aria-label="Main">
      <ul class="tabs">
        <li><a href="${WEEK_HREF}"${weekCurrent}>This week</a></li>
        <li><a href="${EVIDENCE_HREF}"${evidenceCurrent}>Evidence</a></li>
      </ul>
    </nav>
    <a class="gear" href="${SETTINGS_HREF}" aria-label="Settings">
      ${gearIcon()}
      <span class="gear-label">Settings</span>
    </a>
  </div>
</header>`;
}

function gearIcon(): string {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
}
