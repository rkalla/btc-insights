import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHTML } from "linkedom";
import { layoutProbeOverflow } from "../src/client/layout-probe.ts";

test("layout probe skips the screen-reader table and still names a real overflow", () => {
  const parsed = parseHTML(`<!doctype html><html><body>
    <div class="sr-only"><table><caption>Signal fires shown on the chart</caption><thead><tr><th>Signal</th></tr></thead></table></div>
    <p id="wide">wide</p>
    <aside class="layout-probe"></aside>
    <span class="layout-probe-sample">Size</span>
  </body></html>`) as { document: Document };
  const { document } = parsed;
  const hits = layoutProbeOverflow(document.body.querySelectorAll("*"), 390, (el) => {
    if (el.id === "wide") return { width: 500, height: 20, right: 500 };
    if (el.closest(".sr-only") != null) return { width: 459, height: 20, right: 459 };
    return { width: 10, height: 10, right: 10 };
  });
  assert.deepEqual(
    hits.map((el) => el.tagName.toLowerCase()),
    ["p"],
  );
  const hidden = document.querySelector(".sr-only");
  assert.equal(hidden?.getAttribute("aria-hidden"), null);
  assert.equal(document.querySelector(".sr-only table") != null, true);
  for (const name of ["div", "table", "caption", "thead", "tr", "th"]) {
    const el = [...document.querySelectorAll(name)].find((node) => node.closest(".sr-only") != null);
    assert.equal(el != null, true, name);
    assert.equal(el?.classList.contains("layout-probe-hit"), false, name);
  }
  assert.equal(document.getElementById("wide")?.classList.contains("layout-probe-hit"), true);
  assert.equal(document.querySelector(".layout-probe")?.classList.contains("layout-probe-hit"), false);
});
