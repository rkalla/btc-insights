import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const forbidden = new Set([
  "react",
  "react-dom",
  "d3",
  "d3-scale",
  "chart.js",
  "lightweight-charts",
]);

test("package.json has no react, d3, or chart dependency", () => {
  const source = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(source) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const names = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];

  for (const name of names) {
    assert.equal(forbidden.has(name), false, `${name} is not allowed`);
    assert.equal(
      name.toLowerCase().includes("chart"),
      false,
      `${name} is a chart package`,
    );
  }
});
