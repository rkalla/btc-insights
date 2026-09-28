import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/painter/dashboard.css", import.meta.url), "utf8");
const loading = readFileSync(new URL("../src/painter/loading.html", import.meta.url), "utf8");

const postureWords = [
  /\ball in\b/i,
  /\bstand down\b/i,
  /\bhold\b/i,
  /\bstay the course\b/i,
  /\bslow in\b/i,
  /\bbuild\b/i,
  /\blump in\b/i,
  /\bexit\b/i,
  /\btrim\b/i,
  /\bno call\b/i,
  /\bno new buy\b/i,
];

test("dashboard.css does not call a font host or define shimmer", () => {
  assert.equal(css.includes("fonts.googleapis.com"), false);
  assert.equal(css.includes("fonts.gstatic.com"), false);
  assert.equal(/@keyframes\s+shimmer\b/i.test(css), false);
  assert.equal(css.includes("font-display:swap"), true);
  assert.equal(css.includes(".topbar{order:1}.spectrum{order:2}.row-1{order:3}"), true);
  assert.equal(css.includes(".row-1{order:2}.spectrum{order:3}"), true);
  assert.equal(css.includes(".loading-bar{"), true);
  assert.equal(css.includes("animation:none"), true);
});

test("loading.html has the shell and no posture words or font host", () => {
  assert.equal(loading.includes("fonts.googleapis.com"), false);
  assert.equal(loading.includes("fonts.gstatic.com"), false);
  assert.equal(loading.includes('aria-busy="true"'), true);
  assert.equal(loading.includes("Bitcoin dashboard"), false);
  assert.equal(loading.includes("Read-only · one holder"), false);
  assert.equal(loading.includes("spectrum"), false);
  for (const pattern of postureWords) {
    assert.equal(pattern.test(loading), false, pattern.source);
  }
});
