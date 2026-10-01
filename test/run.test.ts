import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import type { ProgressAnchors } from "../src/job/cycle.ts";
import { run } from "../src/job/run.ts";
import { addUtcDays, fridayDate, fridayStep, FRIDAY_RETRY_MS } from "../src/job/run.ts";
import { coinGeckoSpotUrl, COINGECKO_SPOT_URL, createPace, paceCoinMetrics } from "../src/job/vendors.ts";
import type { FetchLike } from "../src/job/vendors.ts";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const runScript = fileURLToPath(new URL("../src/job/run.ts", import.meta.url));
const FIXED_NOW = "2026-09-26T12:00:00.000Z";

function writePrivateState(stateDir: string, lastMetricsDate: string, metricsCheckedOn: string | null = lastMetricsDate): void {
  const record = JSON.parse(
    readFileSync(new URL("../fixtures/published-record.json", import.meta.url), "utf8"),
  ) as { anchors: ProgressAnchors };
  const state = {
    frozen: {
      officialCloseDate: "2026-09-25",
      trend: 141000,
      realizedPrice: 53000,
      realizedAsOf: "2026-09-25",
      anchors: record.anchors,
    },
    spotUsd: 84413,
    spotAsOf: "2026-09-25T00:00:00Z",
    printLabel: "25 Sep 2026 daily close",
    gold: null,
    lastMetricsDate,
    metricsCheckedOn,
    missingFriday: null,
  };
  writeFileSync(join(stateDir, "state.json"), `${JSON.stringify(state)}\n`);
}

function scene(): { root: string; dataDir: string; stateDir: string } {
  const root = mkdtempSync(join(tmpdir(), "btc-job-"));
  const dataDir = join(root, "data");
  const stateDir = join(root, "state");
  mkdirSync(dataDir);
  mkdirSync(stateDir);
  return { root, dataDir, stateDir };
}

function cleanup(root: string): void {
  rmSync(root, { recursive: true, force: true });
}

function startStub(respond: (url: string, response: ServerResponse) => void): Promise<{
  origin: string;
  paths: string[];
  readonly header: string;
  readonly goldHeader: string;
  close(): Promise<void>;
}> {
  const paths: string[] = [];
  let header = "";
  let goldHeader = "";
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = request.url ?? "/";
    paths.push(url);
    const value = request.headers["x-cg-demo-api-key"];
    if (typeof value === "string") header = value;
    const gold = request.headers["x-api-key"];
    if (typeof gold === "string") goldHeader = gold;
    respond(url, response);
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address == null || typeof address === "string") {
        reject(new Error("stub port"));
        return;
      }
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        paths,
        get header() {
          return header;
        },
        get goldHeader() {
          return goldHeader;
        },
        close: () =>
          new Promise<void>((done) => {
            server.closeAllConnections();
            server.close(() => done());
          }),
      });
    });
  });
}

function stubFetch(origin: string): FetchLike {
  return async (url, init) => {
    if (!url.startsWith(origin)) throw new Error(`off-stub ${url}`);
    const response = await fetch(url, init);
    return {
      status: response.status,
      ok: response.ok,
      json: () => response.json(),
      text: () => response.text(),
    };
  };
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

test("vendor pacing and the Friday clock stay inside the locked window", async () => {
  assert.equal(coinGeckoSpotUrl("https://api.coingecko.com"), COINGECKO_SPOT_URL);
  assert.equal(FRIDAY_RETRY_MS, 60_000);
  const saturday = new Date("2026-10-03T00:05:00.000Z");
  assert.equal(saturday.getUTCDay(), 6);
  assert.equal(fridayStep(new Date("2026-10-03T00:04:59.000Z")), "idle");
  assert.equal(fridayStep(saturday), "try");
  assert.equal(fridayStep(new Date("2026-10-03T05:59:00.000Z")), "try");
  assert.equal(fridayStep(new Date("2026-10-03T06:00:00.000Z")), "stop");
  assert.equal(fridayStep(new Date("2026-10-02T23:00:00.000Z")), "idle");
  assert.equal(fridayDate(new Date("2026-10-03T01:00:00.000Z")), "2026-10-02");
  assert.equal(addUtcDays("2026-10-02", 1), "2026-10-03");

  const pace = createPace();
  let time = 1_000;
  const slept: number[] = [];
  const now = (): number => time;
  const sleep = async (ms: number): Promise<void> => {
    slept.push(ms);
    time += ms;
  };
  for (let count = 0; count < 10; count += 1) {
    await paceCoinMetrics(pace, now, sleep);
  }
  assert.equal(slept.length, 0);
  await paceCoinMetrics(pace, now, sleep);
  assert.deepEqual(slept, [6_000]);
});

test("missing DATA_DIR is not created and the process exits non-zero", async () => {
  const root = mkdtempSync(join(tmpdir(), "btc-job-missing-"));
  const missing = join(root, "no-data");
  const stateDir = join(root, "state");
  mkdirSync(stateDir);
  try {
    const code = await run({
      env: {
        DATA_DIR: missing,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "not-used",
        GOLD_QUOTE_URL: "",
      },
      stderr: () => undefined,
    });
    assert.equal(code, 1);
    assert.equal(existsSync(missing), false);

    const child = spawn(process.execPath, [runScript], {
      cwd: repoRoot,
      env: {
        PATH: process.env.PATH ?? "",
        DATA_DIR: missing,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINMETRICS_BASE_URL: "http://127.0.0.1:9",
        GOLD_QUOTE_URL: "",
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    const exitCode = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("job timed out"));
      }, 5_000);
      child.on("error", (error: Error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", (status: number | null) => {
        clearTimeout(timer);
        resolve(status ?? 1);
      });
    });
    assert.equal(exitCode === 0, false);
    assert.equal(existsSync(missing), false);
    assert.equal(stderr.includes("\n"), true);
    assert.equal(stderr.trim().split("\n").length, 1);
  } finally {
    cleanup(root);
  }
});

test("a successful write is mode 0o640 and keeps private state out of DATA_DIR", async () => {
  const { root, dataDir, stateDir } = scene();
  const stub = await startStub((_url, response) => {
    sendJson(response, 200, { bitcoin: { usd: 90000 } });
  });
  try {
    writePrivateState(stateDir, "2026-09-26");
    const lines: string[] = [];
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: (line) => lines.push(line),
    });
    assert.equal(code, 0);
    assert.deepEqual(lines, []);
    assert.equal(stub.paths.length, 1);
    assert.equal(stub.paths[0]?.includes("/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"), true);
    assert.equal(stub.header, "demo-test-key");
    const names = readdirSync(dataDir);
    assert.deepEqual(names, ["live.json"]);
    const livePath = join(dataDir, "live.json");
    assert.equal(statSync(livePath).mode & 0o777, 0o640);
    const live = JSON.parse(readFileSync(livePath, "utf8")) as {
      schema: number;
      spotUsd: number;
      developing: string | null;
      gold: unknown;
      missingClose: boolean;
    };
    assert.equal(live.schema, 1);
    assert.equal(live.spotUsd, 90000);
    assert.equal(live.developing, null);
    assert.equal(live.gold, null);
    assert.equal(live.missingClose, false);
    assert.equal(existsSync(join(dataDir, "state.json")), false);
    assert.equal(existsSync(join(stateDir, "state.json")), true);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("HTTP 429 does not loop and leaves the previous JSON", async () => {
  const { root, dataDir, stateDir } = scene();
  const fridayPath = join(dataDir, "friday.json");
  const livePath = join(dataDir, "live.json");
  const fridayBody = "{\"keep\":\"friday\"}\n";
  const liveBody = "{\"keep\":\"live\"}\n";
  writeFileSync(fridayPath, fridayBody);
  writeFileSync(livePath, liveBody);
  const old = new Date("2020-01-01T00:00:00.000Z");
  utimesSync(fridayPath, old, old);
  utimesSync(livePath, old, old);
  const fridayMtime = statSync(fridayPath).mtimeMs;
  const liveMtime = statSync(livePath).mtimeMs;
  const stub = await startStub((_url, response) => {
    sendJson(response, 429, { error: "rate limit" });
  });
  const slept: number[] = [];
  try {
    const lines: string[] = [];
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: `${stub.origin}/gold`,
      },
      argv: ["node", runScript, "friday"],
      fetch: stubFetch(stub.origin),
      now: () => new Date("2026-10-03T01:00:00.000Z"),
      sleep: async (ms) => {
        slept.push(ms);
        if (slept.length > 1) throw new Error("retry loop");
      },
      stderr: (line) => lines.push(line),
    });
    assert.equal(code, 0);
    assert.equal(stub.paths.length, 1);
    assert.deepEqual(slept, []);
    assert.deepEqual(lines, ["vendor failure: 429"]);
    assert.equal(readFileSync(fridayPath, "utf8"), fridayBody);
    assert.equal(readFileSync(livePath, "utf8"), liveBody);
    assert.equal(statSync(fridayPath).mtimeMs, fridayMtime);
    assert.equal(statSync(livePath).mtimeMs, liveMtime);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("an empty gold URL makes no gold request and leaves developing null", async () => {
  const { root, dataDir, stateDir } = scene();
  const stub = await startStub((url, response) => {
    if (url.startsWith("/gold")) {
      sendJson(response, 200, { usd: 1, asOf: FIXED_NOW, filled: false });
      return;
    }
    sendJson(response, 200, { bitcoin: { usd: 91000 } });
  });
  try {
    writePrivateState(stateDir, "2026-09-26");
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => {
        throw new Error("live poll retried");
      },
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    assert.equal(stub.paths.some((path) => path.includes("gold")), false);
    assert.equal(stub.paths.length, 1);
    const live = JSON.parse(readFileSync(join(dataDir, "live.json"), "utf8")) as {
      developing: string | null;
      gold: unknown;
    };
    assert.equal(live.developing, null);
    assert.equal(live.gold, null);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a set gold URL is the only gold request and developing stays a sentence", async () => {
  const { root, dataDir, stateDir } = scene();
  const stub = await startStub((url, response) => {
    if (url.startsWith("/gold")) {
      sendJson(response, 200, { usd: 4080, asOf: "2026-09-26T12:00:00Z", filled: false });
      return;
    }
    sendJson(response, 200, { bitcoin: { usd: 90000 } });
  });
  try {
    writePrivateState(stateDir, "2026-09-26");
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: `${stub.origin}/gold`,
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    const goldPaths = stub.paths.filter((path) => path.includes("gold"));
    assert.deepEqual(goldPaths, ["/gold"]);
    const live = JSON.parse(readFileSync(join(dataDir, "live.json"), "utf8")) as {
      developing: string | null;
      gold: { usd: number } | null;
    };
    assert.equal(live.developing?.endsWith("Not an official fire."), true);
    assert.equal(live.gold?.usd, 4080);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a gold snapshot uses the XAUUSD last trade and does not store the key", async () => {
  const { root, dataDir, stateDir } = scene();
  const quotedAt = Date.parse("2026-09-26T12:00:00.000Z");
  const stub = await startStub((url, response) => {
    if (url.startsWith("/gold")) {
      sendJson(response, 200, {
        data: [
          { s: "XAGUSD", p: "30.00", t: quotedAt },
          { s: "XAUUSD", p: "4080.50", t: quotedAt },
        ],
        meta: { as_of: "2026-09-26T12:00:01Z", venue: "commodities", count: 2 },
      });
      return;
    }
    sendJson(response, 200, { bitcoin: { usd: 90000 } });
  });
  try {
    writePrivateState(stateDir, "2026-09-26");
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: `${stub.origin}/gold`,
        GOLD_QUOTE_API_KEY: "gold-test-key",
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    assert.equal(stub.goldHeader, "gold-test-key");
    const liveText = readFileSync(join(dataDir, "live.json"), "utf8");
    assert.equal(liveText.includes("gold-test-key"), false);
    const live = JSON.parse(liveText) as {
      developing: string | null;
      gold: { usd: number; asOf: string; filled: boolean } | null;
    };
    assert.equal(live.developing?.endsWith("Not an official fire."), true);
    assert.equal(live.gold?.usd, 4080.5);
    assert.equal(live.gold?.asOf, "2026-09-26T12:00:00Z");
    assert.equal(live.gold?.filled, false);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a gold snapshot without XAUUSD keeps the previous live file", async () => {
  const { root, dataDir, stateDir } = scene();
  const livePath = join(dataDir, "live.json");
  const body = "{\"keep\":\"live\"}\n";
  writeFileSync(livePath, body);
  const stub = await startStub((url, response) => {
    if (url.startsWith("/gold")) {
      sendJson(response, 200, { data: [{ s: "XAGUSD", p: "30", t: 1 }], meta: { as_of: FIXED_NOW } });
      return;
    }
    sendJson(response, 200, { bitcoin: { usd: 90000 } });
  });
  const lines: string[] = [];
  try {
    writePrivateState(stateDir, "2026-09-26");
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: `${stub.origin}/gold`,
        GOLD_QUOTE_API_KEY: "gold-test-key",
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: (line) => lines.push(line),
    });
    assert.equal(code, 0);
    assert.deepEqual(lines, ["vendor failure: network"]);
    assert.equal(readFileSync(livePath, "utf8"), body);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("an empty CoinGecko key skips the spot call and keeps the live file", async () => {
  const { root, dataDir, stateDir } = scene();
  const livePath = join(dataDir, "live.json");
  const body = "{\"keep\":\"live\"}\n";
  writeFileSync(livePath, body);
  const stub = await startStub((_url, response) => {
    sendJson(response, 200, { bitcoin: { usd: 1 } });
  });
  try {
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: `${stub.origin}/gold`,
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    assert.equal(stub.paths.length, 0);
    assert.equal(readFileSync(livePath, "utf8"), body);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a missing Friday bar does not replace friday.json before the deadline", async () => {
  const { root, dataDir, stateDir } = scene();
  const fridayPath = join(dataDir, "friday.json");
  const fridayBody = "{\"keep\":\"previous-friday\"}\n";
  writeFileSync(fridayPath, fridayBody);
  const old = new Date("2020-01-01T00:00:00.000Z");
  utimesSync(fridayPath, old, old);
  const fridayMtime = statSync(fridayPath).mtimeMs;
  writePrivateState(stateDir, "2026-10-03");
  let nowMs = Date.parse("2026-10-03T05:59:00.000Z");
  const slept: number[] = [];
  const stub = await startStub((url, response) => {
    assert.equal(url.includes("gold"), false);
    sendJson(response, 200, { data: [] });
  });
  try {
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      argv: ["node", runScript, "friday"],
      fetch: stubFetch(stub.origin),
      now: () => new Date(nowMs),
      sleep: async (ms) => {
        slept.push(ms);
        if (slept.length > 2) throw new Error("friday retry loop");
        nowMs += ms;
      },
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    assert.deepEqual(slept, [FRIDAY_RETRY_MS]);
    assert.equal(stub.paths.length, 1);
    assert.equal(stub.paths[0]?.includes("/v4/timeseries/asset-metrics"), true);
    assert.equal(readFileSync(fridayPath, "utf8"), fridayBody);
    assert.equal(statSync(fridayPath).mtimeMs, fridayMtime);
    const names = readdirSync(dataDir);
    assert.equal(names.includes("state.json"), false);
    assert.equal(names.includes("friday.json"), true);
    assert.equal(names.includes("live.json"), true);
    for (const name of names) {
      assert.equal(name.includes(".tmp"), false);
      assert.equal(name === "friday.json" || name === "live.json", true);
    }
    const live = JSON.parse(readFileSync(join(dataDir, "live.json"), "utf8")) as {
      officialCloseDate: string;
      missingClose: boolean;
      trendUsd: number;
    };
    assert.equal(live.missingClose, true);
    assert.equal(live.officialCloseDate, "2026-10-02");
    assert.equal(live.trendUsd, 141000);
    assert.equal(statSync(join(dataDir, "live.json")).mode & 0o777, 0o640);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a published Friday writes projection.json beside the Friday call", async () => {
  const { root, dataDir, stateDir } = scene();
  writePrivateState(stateDir, "2026-09-18");
  const history = JSON.parse(
    readFileSync(new URL("../fixtures/history/btc-daily.json", import.meta.url), "utf8"),
  ) as { time: string; PriceUSD?: unknown; CapMVRVCur?: unknown }[];
  const row = history.find((item) => item.time.slice(0, 10) === "2026-09-25");
  if (row == null) throw new Error("missing 2026-09-25 close");
  const stub = await startStub((_url, response) => {
    sendJson(response, 200, { data: [row] });
  });
  try {
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      argv: ["node", runScript, "friday"],
      fetch: stubFetch(stub.origin),
      now: () => new Date("2026-09-26T01:00:00.000Z"),
      sleep: async () => {
        throw new Error("friday retried");
      },
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    const names = readdirSync(dataDir).filter((name) => !name.startsWith(".")).sort();
    assert.deepEqual(names, ["friday.json", "live.json", "projection.json"]);
    assert.equal(statSync(join(dataDir, "friday.json")).mode & 0o777, 0o640);
    assert.equal(statSync(join(dataDir, "projection.json")).mode & 0o777, 0o640);
    const friday = JSON.parse(readFileSync(join(dataDir, "friday.json"), "utf8")) as {
      cash: { word: string };
      cycles: {
        intro: string;
        footnote: string;
        cards: { isProgress: boolean; range: string }[];
      };
      chart: { fires: { date: string }[] };
    };
    const fixture = JSON.parse(
      readFileSync(new URL("../fixtures/friday-2026-09-25.json", import.meta.url), "utf8"),
    ) as typeof friday;
    assert.equal(friday.cash.word, "All in");
    assert.deepEqual(friday.cash, fixture.cash);
    assert.equal(friday.cycles.intro, fixture.cycles.intro);
    assert.equal(friday.cycles.footnote, fixture.cycles.footnote);
    assert.deepEqual(
      friday.cycles.cards.filter((card) => !card.isProgress),
      fixture.cycles.cards.filter((card) => !card.isProgress),
    );
    assert.equal(friday.cycles.cards.some((card) => card.isProgress && card.range.includes("$84,062")), true);
    assert.deepEqual(
      friday.chart.fires.map((fire) => fire.date),
      fixture.chart.fires.map((fire) => fire.date),
    );
    assert.equal(JSON.stringify(friday).includes("\"template\""), false);
    const projection = JSON.parse(readFileSync(join(dataDir, "projection.json"), "utf8")) as {
      schema: number;
      asOf: string;
      samples: number;
      cyclesUsed: number;
      template: number[];
    };
    assert.equal(projection.schema, 2);
    assert.equal(projection.asOf, "2026-09-25");
    assert.equal(projection.samples, 204);
    assert.equal(projection.cyclesUsed, 5);
    assert.equal(projection.template.length, 204);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a priced daily row is stored when the CoinGecko key is empty", async () => {
  const { root, dataDir, stateDir } = scene();
  const livePath = join(dataDir, "live.json");
  const liveBody = "{\"keep\":\"live\"}\n";
  writeFileSync(livePath, liveBody);
  writePrivateState(stateDir, "2026-09-25", null);
  let serveRow = false;
  const stub = await startStub((url, response) => {
    assert.equal(url.includes("/api/v3/simple/price"), false);
    assert.equal(url.includes("gold"), false);
    if (!serveRow) {
      sendJson(response, 200, { data: [] });
      return;
    }
    sendJson(response, 200, {
      data: [
        {
          time: "2026-09-26T00:00:00.000000000Z",
          PriceUSD: "91000",
          CapMVRVCur: "1.5",
        },
      ],
    });
  });
  try {
    const emptyCode = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: `${stub.origin}/gold`,
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: () => undefined,
    });
    assert.equal(emptyCode, 0);
    assert.equal(stub.paths.length, 1);
    assert.equal(stub.paths[0]?.includes("/v4/timeseries/asset-metrics"), true);
    assert.equal(existsSync(join(stateDir, "history.json")), false);
    assert.equal(readFileSync(livePath, "utf8"), liveBody);
    const afterEmpty = JSON.parse(readFileSync(join(stateDir, "state.json"), "utf8")) as {
      lastMetricsDate: string | null;
      metricsCheckedOn: string | null;
    };
    assert.equal(afterEmpty.lastMetricsDate, "2026-09-25");
    assert.equal(afterEmpty.metricsCheckedOn, null);

    serveRow = true;
    const storedCode = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: `${stub.origin}/gold`,
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: () => undefined,
    });
    assert.equal(storedCode, 0);
    assert.equal(stub.paths.length, 2);
    assert.equal(readFileSync(livePath, "utf8"), liveBody);
    const history = readFileSync(join(stateDir, "history.json"), "utf8");
    assert.equal(history.includes("2010-07-18"), true);
    assert.equal(history.includes("2026-09-26"), true);
    assert.equal(history.includes("91000"), true);
    const stored = JSON.parse(readFileSync(join(stateDir, "state.json"), "utf8")) as {
      lastMetricsDate: string | null;
    };
    assert.equal(stored.lastMetricsDate, "2026-09-26");
    assert.equal(existsSync(join(dataDir, "history.json")), false);
    assert.equal(existsSync(join(dataDir, "state.json")), false);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a disk error during Friday publish exits non-zero", async () => {
  const { root, dataDir, stateDir } = scene();
  const fridayPath = join(dataDir, "friday.json");
  const fridayBody = "{\"keep\":\"friday\"}\n";
  writeFileSync(fridayPath, fridayBody);
  writePrivateState(stateDir, "2026-09-25", null);
  chmodSync(dataDir, 0o555);
  const stub = await startStub((_url, response) => {
    sendJson(response, 200, {
      data: [
        {
          time: "2026-10-02T00:00:00.000000000Z",
          PriceUSD: "92000",
          CapMVRVCur: "1.6",
        },
      ],
    });
  });
  try {
    const lines: string[] = [];
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      argv: ["node", runScript, "friday"],
      fetch: stubFetch(stub.origin),
      now: () => new Date("2026-10-03T01:00:00.000Z"),
      sleep: async () => {
        throw new Error("publish retried");
      },
      stderr: (line) => lines.push(line),
    });
    assert.equal(code === 0, false);
    assert.equal(lines.some((line) => line.includes("vendor failure")), false);
    assert.equal(lines.some((line) => line.includes("EACCES")), true);
    assert.equal(readFileSync(fridayPath, "utf8"), fridayBody);
  } finally {
    chmodSync(dataDir, 0o755);
    await stub.close();
    cleanup(root);
  }
});

test("a live write does not clear missingClose set after the state was read", async () => {
  const { root, dataDir, stateDir } = scene();
  const livePath = join(dataDir, "live.json");
  const statePath = join(stateDir, "state.json");
  writeFileSync(livePath, "{\"missingClose\":false}\n");
  writePrivateState(stateDir, "2026-09-25", null);
  const stub = await startStub((url, response) => {
    if (url.includes("/v4/timeseries/asset-metrics")) {
      const state = JSON.parse(readFileSync(statePath, "utf8")) as { missingFriday: string | null };
      state.missingFriday = "2026-10-02";
      writeFileSync(statePath, `${JSON.stringify(state)}\n`);
      writeFileSync(
        livePath,
        `${JSON.stringify({ officialCloseDate: "2026-10-02", missingClose: true })}\n`,
      );
      sendJson(response, 200, { data: [] });
      return;
    }
    sendJson(response, 200, { bitcoin: { usd: 90000 } });
  });
  try {
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    const live = JSON.parse(readFileSync(livePath, "utf8")) as {
      missingClose: boolean;
      officialCloseDate: string;
      spotUsd: number;
    };
    assert.equal(live.missingClose, true);
    assert.equal(live.officialCloseDate, "2026-10-02");
    assert.equal(live.spotUsd, 90000);
    const state = JSON.parse(readFileSync(statePath, "utf8")) as { missingFriday: string | null };
    assert.equal(state.missingFriday, "2026-10-02");
  } finally {
    await stub.close();
    cleanup(root);
  }
});

function waitFor(child: ReturnType<typeof spawn>): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out\n${stderr}`));
    }, 15_000);
    child.on("error", (error: Error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (status: number | null) => {
      clearTimeout(timer);
      resolve({ code: status ?? 1, stderr });
    });
  });
}

test("a missing history seed does not write an empty history", async () => {
  const { root, dataDir, stateDir } = scene();
  writePrivateState(stateDir, "2026-09-25", null);
  const stub = await startStub((_url, response) => {
    sendJson(response, 200, {
      data: [{ time: "2026-09-26T00:00:00.000000000Z", PriceUSD: "91000", CapMVRVCur: "1.5" }],
    });
  });
  try {
    const lines: string[] = [];
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
        HISTORY_PATH: join(root, "missing-history.json"),
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => undefined,
      stderr: (line) => lines.push(line),
    });
    assert.equal(code, 1);
    assert.deepEqual(lines, ["history seed missing"]);
    assert.equal(existsSync(join(stateDir, "history.json")), false);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("a lock whose pid is not running is removed", async () => {
  const { root, dataDir, stateDir } = scene();
  writePrivateState(stateDir, "2026-09-26");
  let stalePid = 1_000_199;
  for (let pid = 1_000_000; pid < 1_000_200; pid += 1) {
    try {
      process.kill(pid, 0);
    } catch {
      stalePid = pid;
      break;
    }
  }
  writeFileSync(join(stateDir, ".live.lock"), `${stalePid}\n`);
  const stub = await startStub((_url, response) => {
    sendJson(response, 200, { bitcoin: { usd: 90000 } });
  });
  try {
    const code = await run({
      env: {
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "demo-test-key",
        COINGECKO_BASE_URL: stub.origin,
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      fetch: stubFetch(stub.origin),
      now: () => new Date(FIXED_NOW),
      sleep: async () => {
        throw new Error("waited on a dead lock");
      },
      stderr: () => undefined,
    });
    assert.equal(code, 0);
    const live = JSON.parse(readFileSync(join(dataDir, "live.json"), "utf8")) as { spotUsd: number };
    assert.equal(live.spotUsd, 90000);
    assert.equal(existsSync(join(stateDir, ".live.lock")), false);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test("built job/run.mjs resolves the committed fixtures", async () => {
  const build = await waitFor(spawn(process.execPath, [join(repoRoot, "scripts/build.mjs")], {
    cwd: repoRoot,
    env: { PATH: process.env.PATH ?? "" },
    stdio: ["ignore", "ignore", "pipe"],
  }));
  assert.equal(build.code, 0, build.stderr);
  const { root, dataDir, stateDir } = scene();
  writePrivateState(stateDir, "2020-01-01", null);
  const stub = await startStub((_url, response) => {
    sendJson(response, 200, {
      data: [{ time: "2020-01-02T00:00:00.000000000Z", PriceUSD: "1", CapMVRVCur: "1" }],
    });
  });
  try {
    const child = await waitFor(spawn(process.execPath, [join(repoRoot, "job/run.mjs")], {
      cwd: "/tmp",
      env: {
        PATH: process.env.PATH ?? "",
        DATA_DIR: dataDir,
        STATE_DIR: stateDir,
        COINGECKO_API_KEY: "",
        COINMETRICS_BASE_URL: stub.origin,
        GOLD_QUOTE_URL: "",
      },
      stdio: ["ignore", "ignore", "pipe"],
    }));
    assert.equal(child.code, 0, child.stderr);
    const history = readFileSync(join(stateDir, "history.json"), "utf8");
    assert.equal(history.includes("2010-07-18"), true);
    assert.equal(history.includes("2020-01-02"), true);
    assert.equal(existsSync(join(dataDir, "history.json")), false);
  } finally {
    await stub.close();
    cleanup(root);
  }
});

test(".env.example has empty keys and the community Coin Metrics URL", () => {
  const example = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  assert.equal(
    example,
    "COINGECKO_API_KEY=\nCOINMETRICS_BASE_URL=https://community-api.coinmetrics.io\nGOLD_QUOTE_URL=\nGOLD_QUOTE_API_KEY=\n",
  );
});
