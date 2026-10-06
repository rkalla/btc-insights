import assert from "node:assert/strict";
import { test } from "node:test";
import { dueFriday, evaluateFridayCall } from "../src/job/call.ts";
import type { FridayInputs } from "../src/job/call.ts";
import { cashCopy } from "../src/job/copy.ts";
import type { CashFlags } from "../src/job/copy.ts";

function flags(over: Partial<CashFlags> = {}): CashFlags {
  return {
    allIn: false,
    build: false,
    standDownPause: false,
    lumpIn: false,
    slowIn: false,
    armedWait: false,
    ...over,
  };
}

function inputs(over: Partial<FridayInputs> = {}): FridayInputs {
  return {
    friday: "2026-10-02",
    gap: -0.4,
    ratio: 1.57,
    buys: [{ date: "2026-09-18" }],
    sells: [{ date: "2021-12-03" }],
    armedWait: false,
    ...over,
  };
}

test("the 25 September close is still All in, with the same grace window", () => {
  const call = evaluateFridayCall(inputs({
    friday: "2026-09-25",
    gap: -0.41,
    ratio: 1.57,
  }));
  assert.equal(call.flags.allIn, true);
  assert.equal(call.flags.build, false);
  assert.equal(call.flags.lumpIn, false);
  assert.equal(call.activeFireDate, "2026-09-18");
  assert.equal(call.official.closeDate, "2026-09-25");
  assert.equal(call.official.nextCloseDate, "2026-10-02");
  assert.deepEqual(
    cashCopy(call.flags, { fireDate: "2026-09-18", closeDate: "2026-09-25" }),
    cashCopy(flags({ allIn: true })),
  );
});

test("the 2 October close is Lump in once the grace window has closed", () => {
  const call = evaluateFridayCall(inputs());
  assert.equal(call.flags.allIn, false);
  assert.equal(call.flags.lumpIn, true);
  assert.equal(call.flags.build, false);
  assert.equal(call.flags.standDownPause, false);
  assert.equal(call.dollarSlot?.pile, "cashAvailable");
  assert.equal(call.official.closeLabel, "Fri 2 Oct 2026");
  assert.equal(call.official.nextCloseDate, "2026-10-09");
  assert.equal(call.official.nextCloseLabel, "Fri 9 Oct 2026");
});

test("the rollup follows the locked order", () => {
  const underCost = evaluateFridayCall(inputs({ ratio: 0.99 }));
  assert.equal(underCost.flags.build, true);
  assert.equal(underCost.flags.lumpIn, false);

  const fireAndCheap = evaluateFridayCall(inputs({ friday: "2026-09-25", ratio: 0.5 }));
  assert.equal(fireAndCheap.flags.allIn, true);
  assert.equal(fireAndCheap.flags.build, true);

  const pausing = evaluateFridayCall(inputs({
    sells: [{ date: "2026-01-02" }],
    gap: -0.4,
    ratio: 1.6,
  }));
  assert.equal(pausing.flags.standDownPause, true);
  assert.equal(pausing.standDownFireDate, "2026-01-02");
  assert.equal(pausing.flags.lumpIn, false);

  const pauseEnds = evaluateFridayCall(inputs({
    sells: [{ date: "2025-10-02" }],
    gap: -0.4,
  }));
  assert.equal(pauseEnds.flags.standDownPause, false);
  assert.equal(pauseEnds.flags.lumpIn, true);

  const armed = evaluateFridayCall(inputs({ armedWait: true }));
  assert.equal(armed.flags.armedWait, true);
  assert.equal(armed.flags.lumpIn, false);
  assert.equal(armed.dollarSlot, null);

  const slow = evaluateFridayCall(inputs({ gap: 0.55, ratio: 2 }));
  assert.equal(slow.flags.slowIn, true);
  assert.equal(slow.flags.lumpIn, false);

  const stay = evaluateFridayCall(inputs({ gap: -0.199, ratio: 1.2 }));
  assert.equal(stay.flags.lumpIn, false);
  assert.equal(stay.flags.slowIn, false);
  assert.equal(stay.dollarSlot, null);

  const noCap = evaluateFridayCall(inputs({ ratio: null }));
  assert.equal(noCap.flags.build, false);
  assert.equal(noCap.flags.lumpIn, true);

  const line = evaluateFridayCall(inputs({ gap: -0.2 }));
  assert.equal(line.flags.lumpIn, true);
});

test("a later All-in window is dated from that fire", () => {
  const cash = cashCopy(flags({ allIn: true }), { fireDate: "2027-01-15", closeDate: "2027-01-22" });
  assert.equal(cash.sentences[0], "Buy now, or by the Friday 29 Jan 2027 close.");
  assert.deepEqual(
    cash.window?.steps.map((step) => [step.dateLabel, step.caption, step.state]),
    [
      ["Fri 15 Jan", "fired", "done"],
      ["Fri 22 Jan", "grace, this call", "current"],
      ["Fri 29 Jan", "last grace", "next"],
    ],
  );
  assert.equal(cash.window?.lastGraceCloseUtc, "2027-01-30T00:00:00Z");

  const fireWeek = cashCopy(flags({ allIn: true }), { fireDate: "2027-01-15", closeDate: "2027-01-15" });
  assert.equal(fireWeek.window?.steps[1]?.caption, "grace");
  assert.equal(fireWeek.window?.steps[0]?.state, "current");
});

test("a missed Friday is due only after Saturday 06:00 UTC", () => {
  assert.equal(dueFriday(new Date("2026-10-03T05:59:59.000Z")), "2026-09-25");
  assert.equal(dueFriday(new Date("2026-10-03T06:00:00.000Z")), "2026-10-02");
  assert.equal(dueFriday(new Date("2026-10-06T15:00:00.000Z")), "2026-10-02");
  assert.equal(dueFriday(new Date("2026-10-09T23:00:00.000Z")), "2026-10-02");
  assert.equal(dueFriday(new Date("2026-10-10T06:00:00.000Z")), "2026-10-09");
});
