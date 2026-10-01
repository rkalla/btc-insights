import type { VisitorsReport } from "../visitors/log.ts";
import { nextVisitorsView, reduceVisitorsPoll, type VisitorsPollState } from "../visitors/page.ts";

const found = document.querySelector("main.page");
if (found == null) throw new Error("missing main");
const main: Element = found;

let html = "";
let state: VisitorsPollState = { visible: false, timerArmed: false };
let timer = 0;

async function load(): Promise<void> {
  try {
    const response = await fetch("/data/visitors.json", { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    const report = (await response.json()) as VisitorsReport;
    html = nextVisitorsView(html, { ok: true, report });
  } catch {
    html = nextVisitorsView(html, { ok: false });
  }
  main.textContent = "";
  main.innerHTML = html;
}

function apply(commands: ReturnType<typeof reduceVisitorsPoll>["commands"]): void {
  for (const command of commands) {
    if (command.type === "clear") {
      window.clearTimeout(timer);
      timer = 0;
    } else if (command.type === "schedule") {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        dispatch({ type: "timer" });
      }, command.ms);
    } else {
      void load();
    }
  }
}

function dispatch(event: Parameters<typeof reduceVisitorsPoll>[1]): void {
  const next = reduceVisitorsPoll(state, event);
  state = next.state;
  apply(next.commands);
}

dispatch({ type: "visibility", visible: document.visibilityState === "visible" });
document.addEventListener("visibilitychange", () => {
  dispatch({ type: "visibility", visible: document.visibilityState === "visible" });
});
