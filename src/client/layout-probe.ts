const HIT = "layout-probe-hit";

export function layoutProbeOverflow(
  elements: Iterable<Element>,
  limit: number,
  rectOf: (el: Element) => { width: number; height: number; right: number },
): Element[] {
  const hits: Element[] = [];
  for (const el of elements) {
    if (el.closest(".sr-only, .layout-probe, .layout-probe-sample") != null) {
      el.classList.remove(HIT);
      continue;
    }
    const rect = rectOf(el);
    const over = rect.width > 0 && rect.height > 0 && rect.right > limit + 0.5;
    el.classList.toggle(HIT, over);
    if (over) hits.push(el);
  }
  return hits;
}

export function installLayoutProbe(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const body = document.body;
  if (body == null) return;
  let enabled = false;
  try {
    enabled = new URLSearchParams(window.location.search).get("debug") === "layout";
  } catch {
    return;
  }
  if (!enabled || document.querySelector(".layout-probe") != null) return;

  const sample = document.createElement("span");
  sample.className = "layout-probe-sample";
  sample.textContent = "Size";
  const panel = document.createElement("aside");
  panel.className = "layout-probe";
  panel.setAttribute("aria-hidden", "true");
  body.append(sample, panel);

  let observer: MutationObserver | null = null;
  const paint = (): void => {
    observer?.disconnect();
    const root = document.documentElement;
    const hits = layoutProbeOverflow(body.querySelectorAll("*"), root.clientWidth, (el) => el.getBoundingClientRect());
    const viewport = window.visualViewport;
    const lines = [
      `innerWidth ${window.innerWidth}`,
      `clientWidth ${root.clientWidth}`,
      `scrollWidth ${root.scrollWidth}`,
      `visualViewport.width ${viewport == null ? "none" : viewport.width}`,
      `visualViewport.scale ${viewport == null ? "none" : viewport.scale}`,
      `devicePixelRatio ${window.devicePixelRatio}`,
      `fontSize ${getComputedStyle(sample).fontSize}`,
    ];
    for (const el of hits.slice(0, 5)) lines.push(nameOf(el));
    panel.textContent = lines.join("\n");
    observer?.observe(body, { childList: true, subtree: true });
  };

  observer = new MutationObserver(() => {
    paint();
  });
  paint();
  window.addEventListener("resize", paint);
  window.visualViewport?.addEventListener("resize", paint);
  window.visualViewport?.addEventListener("scroll", paint);
}

function nameOf(el: Element): string {
  const id = el.id === "" ? "" : `#${el.id}`;
  const classes = [...el.classList].filter((name) => name !== HIT).map((name) => `.${name}`).join("");
  return `${el.tagName.toLowerCase()}${id}${classes}`;
}
