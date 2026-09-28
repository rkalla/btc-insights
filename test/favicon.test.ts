import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

test("the dashboard and settings heads point at the favicon", () => {
  const build = readFileSync(new URL("../scripts/build.mjs", import.meta.url), "utf8");
  assert.match(build, /rel="icon" href="\/favicon.ico" sizes="48x48"/);
  assert.match(build, /rel="icon" type="image\/png" href="\/favicon-32.png" sizes="32x32"/);
  assert.match(build, /rel="apple-touch-icon" href="\/apple-touch-icon.png"/);
  const uses = build.split("${iconLinks}").length - 1;
  assert.equal(uses, 2);
  const ico = statSync(new URL("../public/favicon.ico", import.meta.url));
  const png = statSync(new URL("../public/favicon-32.png", import.meta.url));
  const touch = statSync(new URL("../public/apple-touch-icon.png", import.meta.url));
  assert.ok(ico.size > 100 && ico.size < 20000);
  assert.ok(png.size > 100 && png.size < 8000);
  assert.ok(touch.size > 100 && touch.size < 80000);
});
