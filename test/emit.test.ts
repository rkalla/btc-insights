import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

interface Emitted {
  friday: { cash: { word: string } };
  live: {
    spotUsd: number;
    progress: {
      lead?: string;
      rows: { sharePct: number; detail: string }[];
    };
  }[];
}

const root = fileURLToPath(new URL("..", import.meta.url));

test("emitter prints both spots, All in, and a different progress lead", () => {
  const stdout = execFileSync(process.execPath, ["scripts/emit-friday.mjs"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const emitted = JSON.parse(stdout) as Emitted;
  const pinned = emitted.live.find((slice) => slice.spotUsd === 84413);
  const other = emitted.live.find((slice) => slice.spotUsd === 90000);
  assert.deepEqual(
    emitted.live.map((slice) => slice.spotUsd),
    [84413, 90000],
  );
  assert.equal(emitted.friday.cash.word, "All in");
  const row = pinned?.progress.rows.find((item) => item.detail.includes("+208%"));
  assert.equal(row?.detail.includes("+208%"), true);
  assert.equal(`${row?.sharePct}%`, "48%");
  assert.equal(typeof pinned?.progress.lead, "string");
  assert.equal(typeof other?.progress.lead, "string");
  assert.equal(other?.progress.lead === pinned?.progress.lead, false);
});
