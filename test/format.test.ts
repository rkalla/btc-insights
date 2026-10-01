import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chartMoney,
  fridayLabel,
  money,
  sentenceDate,
  signedPercent,
} from "../src/contract/format.ts";

test("money prints en-US dollars with no cents", () => {
  assert.equal(money(84413), "$84,413");
});

test("chartMoney uses axis suffixes without extra decimals", () => {
  assert.equal(chartMoney(141000), "$141k");
  assert.equal(chartMoney(10), "$10");
  assert.equal(chartMoney(100), "$100");
  assert.equal(chartMoney(1000), "$1k");
  assert.equal(chartMoney(10000), "$10k");
  assert.equal(chartMoney(100000), "$100k");
  assert.equal(chartMoney(1000000), "$1M");
  assert.equal(chartMoney(1_200_000_000), "$1.2B");
  assert.equal(chartMoney(3_400_000_000), "$3.4B");
});

test("signedPercent uses a plus and U+2212", () => {
  const down = signedPercent(-0.41);
  assert.equal(down, "\u221241%");
  assert.equal(down.codePointAt(0), 0x2212);
  assert.equal(down.includes("-"), false);
  assert.equal(signedPercent(1.38), "+138%");
  assert.equal(signedPercent(0), "0%");
});

test("Friday and sentence dates use UTC month names", () => {
  assert.equal(fridayLabel("2026-09-25"), "Fri 25 Sep 2026");
  assert.equal(fridayLabel("2026-10-02"), "Fri 2 Oct 2026");
  assert.equal(sentenceDate("2026-09-18"), "18 Sep 2026");
});
