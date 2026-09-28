import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const painter = new URL("../src/painter/", import.meta.url);
const sheets = ["site.css", "this-week.css", "evidence.css", "settings.css"];
const loading = readFileSync(new URL("loading.html", painter), "utf8");

function sheet(name: string): string {
  return readFileSync(new URL(name, painter), "utf8");
}

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

test("stylesheets stay on the light shell", () => {
  for (const name of sheets) {
    const css = sheet(name);
    assert.equal(css.includes("fonts.googleapis.com"), false, name);
    assert.equal(css.includes("fonts.gstatic.com"), false, name);
    assert.equal(/@keyframes\s+shimmer\b/i.test(css), false, name);
    assert.equal(css.toLowerCase().includes("#0c0f14"), false, name);
    assert.equal(css.includes("Geist Mono"), false, name);
    assert.equal(css.includes("monospace"), false, name);
    assert.equal(css.toLowerCase().replace(/\s+/g, "").includes("text-transform:uppercase"), false, name);
    assert.equal(css.includes("overflow-x:clip") || css.includes("overflow-x: clip"), false, name);
  }
  const site = sheet("site.css");
  const evidence = sheet("evidence.css");
  assert.equal(site.includes("font-display:swap"), true);
  assert.equal(site.includes("--paper:#F7F6F2"), true);
  assert.equal(site.includes("--page-max:680px"), true);
  assert.equal(site.includes("text-size-adjust:100%"), true);
  assert.equal(site.includes("-webkit-text-size-adjust:100%"), true);
  assert.equal(site.includes("svg,img,table{max-width:100%}"), true);
  assert.equal(site.includes("minmax(0,1fr)"), true);
  assert.equal(site.includes("overflow-wrap:anywhere"), true);
  assert.equal(evidence.includes(".topbar{order:1}.row-1{order:3}.disagreement{order:4}"), true);
  assert.equal(evidence.includes(".glossary{order:10;"), true);
  assert.equal(evidence.includes(".loading-bar{"), true);
  assert.equal(evidence.includes("animation:none"), true);
  assert.equal(evidence.includes("figure.chart{position:relative"), true);
  const build = readFileSync(new URL("../scripts/build.mjs", import.meta.url), "utf8");
  assert.equal(build.includes('writeCss("dashboard.css")'), false);
  assert.equal(build.includes('writeCss("site.css")'), true);
  assert.equal(build.includes("links dashboard.css"), true);
  assert.equal(build.includes("missing site.css"), true);
  assert.equal(build.includes("#0c0f14"), true);
  assert.equal(build.includes("geist mono"), true);
  assert.equal(build.includes("monospace"), true);
  assert.equal(build.includes("text-transform:uppercase"), true);
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
