import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { connectPoll, initialPollState, LIVE_POLL_MS, reducePoll, type PollHost } from "../src/client/poll.ts";

const FRIDAY = "2026-09-25";
const NEXT = "2026-10-02";

test("visible schedules 10 minutes", () => {
  const step = reducePoll(initialPollState(), { type: "visibility", visible: true, now: 0 });
  assert.equal(step.state.timerArmed, true);
  assert.deepEqual(step.commands, [{ type: "schedule", ms: LIVE_POLL_MS }]);
  assert.equal(LIVE_POLL_MS, 10 * 60 * 1000);
});

test("hidden clears the timer", () => {
  const shown = reducePoll(initialPollState(), { type: "visibility", visible: true, now: 0 });
  const hidden = reducePoll(shown.state, { type: "visibility", visible: false, now: 1 });
  assert.deepEqual(hidden.commands, [{ type: "clear" }]);
  assert.equal(hidden.state.timerArmed, false);
  assert.equal(hidden.state.visible, false);
  assert.equal(
    reducePoll(hidden.state, { type: "timer", now: LIVE_POLL_MS }).commands.some((command) => command.type === "fetch"),
    false,
  );
});

test("a live result before friday has loaded requests friday", () => {
  const shown = reducePoll(initialPollState(), { type: "visibility", visible: true, now: 0 });
  const tick = reducePoll(shown.state, { type: "timer", now: LIVE_POLL_MS });
  const live = reducePoll(tick.state, { type: "live", officialCloseDate: FRIDAY, now: LIVE_POLL_MS });
  assert.deepEqual(live.commands, [{ type: "fetch", url: "/data/friday.json", cache: "no-store" }]);
});

test("a changed officialCloseDate requests friday with no-store", () => {
  const loaded = reducePoll(initialPollState(), {
    type: "loaded",
    fridayCloseDate: FRIDAY,
    now: 0,
    visible: true,
  });
  const tick = reducePoll(loaded.state, { type: "timer", now: LIVE_POLL_MS });
  assert.deepEqual(tick.commands, [{ type: "fetch", url: "/data/live.json" }]);
  const live = reducePoll(tick.state, { type: "live", officialCloseDate: NEXT, now: LIVE_POLL_MS });
  assert.deepEqual(live.commands, [{ type: "fetch", url: "/data/friday.json", cache: "no-store" }]);
  const same = reducePoll(tick.state, { type: "live", officialCloseDate: FRIDAY, now: LIVE_POLL_MS });
  assert.equal(same.commands.some((command) => command.type === "fetch"), false);
});

test("the scheduler does not fetch faster than 10 minutes", () => {
  const loaded = reducePoll(initialPollState(), {
    type: "loaded",
    fridayCloseDate: FRIDAY,
    now: 0,
    visible: true,
  });
  const early = reducePoll(loaded.state, { type: "timer", now: 1_000 });
  assert.equal(early.commands.some((command) => command.type === "fetch"), false);
  assert.deepEqual(early.commands, [{ type: "schedule", ms: LIVE_POLL_MS }]);
  const due = reducePoll(loaded.state, { type: "timer", now: LIVE_POLL_MS });
  assert.deepEqual(due.commands, [{ type: "fetch", url: "/data/live.json" }]);
  const again = reducePoll(due.state, { type: "timer", now: LIVE_POLL_MS + 1_000 });
  assert.equal(again.commands.some((command) => command.type === "fetch"), false);
});

test("connectPoll asks for friday with no-store and will not fetch early", async () => {
  let now = 0;
  const calls: { url: string; cache?: string }[] = [];
  const fires: Array<() => void | Promise<void>> = [];
  const host: PollHost = {
    now: () => now,
    visibility: () => "visible",
    setTimer(ms, run) {
      assert.equal(ms >= LIVE_POLL_MS, true);
      fires.push(run);
      return fires.length;
    },
    clearTimer() {},
    async fetchJson(url, init) {
      calls.push({ url, cache: init?.cache });
      if (url === "/data/live.json") return { officialCloseDate: now < LIVE_POLL_MS * 2 ? NEXT : FRIDAY };
      return { official: { closeDate: NEXT } };
    },
  };
  const poll = connectPoll(host, { onLive() {}, onFriday() {} });
  poll.loaded(FRIDAY);
  now = 1_000;
  await fires[0]?.();
  assert.equal(calls.length, 0);
  now = LIVE_POLL_MS;
  await fires[1]?.();
  assert.deepEqual(calls, [
    { url: "/data/live.json", cache: undefined },
    { url: "/data/friday.json", cache: "no-store" },
  ]);
  now = LIVE_POLL_MS + 1_000;
  await fires[2]?.();
  assert.equal(calls.length, 2);
  poll.stop();
});

test("built page scripts do not name a market client", () => {
  let js = "";
  try {
    js = readFileSync(new URL("../dist/assets/dashboard.js", import.meta.url), "utf8");
    js += readFileSync(new URL("../dist/assets/settings.js", import.meta.url), "utf8");
  } catch {
    return;
  }
  try {
    js += readFileSync(new URL("../dist/assets/this-week.js", import.meta.url), "utf8");
  } catch {
    // The This week bundle is checked once the page has been built.
  }
  try {
    js += readFileSync(new URL("../dist/assets/projection.js", import.meta.url), "utf8");
  } catch {
    // The Projection bundle is checked once the page has been built.
  }
  const banned = ["coingecko", "coinmetrics", "api_key", "GOLD_QUOTE", "wss://", "WebSocket"];
  for (const word of banned) {
    assert.equal(js.includes(word), false, word);
  }
});
