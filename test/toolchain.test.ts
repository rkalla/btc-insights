import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const forbidden = new Set([
  "react",
  "react-dom",
  "chart.js",
  "lightweight-charts",
]);

test("package.json has no react, d3, or chart dependency", () => {
  const source = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(source) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    bundleDependencies?: Record<string, string> | readonly string[];
  };
  const fields = [
    pkg.dependencies,
    pkg.devDependencies,
    pkg.optionalDependencies,
    pkg.peerDependencies,
    pkg.bundleDependencies,
  ];
  const names = fields.flatMap((field) => {
    if (field == null) {
      return [];
    }
    if (Array.isArray(field)) {
      return field;
    }
    return Object.keys(field);
  });

  for (const name of names) {
    const banned =
      forbidden.has(name) ||
      name === "d3" ||
      name.startsWith("d3-") ||
      name.toLowerCase().includes("chart");
    assert.equal(banned, false, `${name} is not allowed`);
  }
});
