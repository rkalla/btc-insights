import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFriday } from "../src/job/friday.ts";
import { goldFlag, goldShare } from "../src/job/gold-share.ts";
import { buildLive } from "../src/job/live.ts";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const history = JSON.parse(readFileSync(join(root, "fixtures/history/btc-daily.json"), "utf8"));
const record = JSON.parse(readFileSync(join(root, "fixtures/published-record.json"), "utf8"));

const friday = buildFriday(history, record);
const trend = friday.chart.trend.at(-1);
if (trend == null) {
  throw new Error("friday trend missing");
}

const frozen = {
  officialCloseDate: friday.official.closeDate,
  trend: trend.value,
  realizedPrice: 53000,
  realizedAsOf: friday.official.closeDate,
  anchors: record.anchors,
};

function slice(spot, spotAsOf, printLabel, isOfficialClose) {
  return buildLive(frozen, {
    spot,
    spotAsOf,
    printLabel,
    isOfficialClose,
    bitcoin: { usd: spot, asOf: spotAsOf },
    gold: null,
    now: spotAsOf,
    missingClose: false,
  });
}

const open = record.openArmPrices;
const openShare = goldShare(open.btc0, open.btc1, open.gold0, open.gold1);
const fallingShare = goldShare(100, 80, 200, 180);

console.log(JSON.stringify({
  friday,
  live: [
    slice(84413, "2026-09-25T00:00:00Z", "25 Sep 2026 daily close", true),
    slice(90000, "2026-09-26T12:00:00Z", "Sat 26 Sep 2026 print", false),
  ],
  gold: {
    falling: {
      btc0: 100,
      btc1: 80,
      gold0: 200,
      gold1: 180,
      share: fallingShare,
      flag: goldFlag(fallingShare),
    },
    openArm: {
      btc0: open.btc0,
      btc1: open.btc1,
      gold0: open.gold0,
      gold1: open.gold1,
      share: openShare,
      flag: goldFlag(openShare),
    },
    flagAtCut: goldFlag(0.15),
    flagAboveCut: goldFlag(0.150001),
  },
}));
