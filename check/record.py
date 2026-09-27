import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BUY_DATES = [
    "2015-07-24",
    "2019-05-03",
    "2020-07-31",
    "2023-03-17",
    "2026-09-18",
]

SELL_DATES = [
    "2013-06-07",
    "2014-04-04",
    "2014-08-01",
    "2017-09-01",
    "2018-03-02",
    "2018-05-04",
    "2021-05-07",
    "2021-12-03",
]

BANNED_SELL_MONTHS = {
    (2013, 4): "April 2013",
    (2017, 12): "December 2017",
    (2019, 7): "July 2019",
    (2021, 3): "March 2021",
}

BANNED_SELL_LABELS = (
    "April 2013",
    "December 2017",
    "July 2019",
    "March 2021",
    "Apr 2013",
    "Dec 2017",
    "Jul 2019",
    "Mar 2021",
)

CYCLE_PERCENTS = [60, 71, 34, 54, 25, 84, 42, 51, 93, 44]


def main() -> int:
    errors: list[str] = []

    def expect(ok: bool, message: str) -> None:
        if not ok:
            errors.append(message)

    proc = subprocess.run(
        ["node", "scripts/emit-friday.mjs"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr)
        sys.stderr.write(proc.stdout)
        return proc.returncode or 1
    try:
        emitted = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        sys.stderr.write(f"emitter JSON: {exc}\n")
        return 1

    record = json.loads((ROOT / "fixtures" / "published-record.json").read_text())
    fires = emitted["friday"]["chart"]["fires"]
    buy_dates = [fire["date"] for fire in fires if fire["type"] == "buy"]
    sell_fires = [fire for fire in fires if fire["type"] == "sell"]
    sell_dates = [fire["date"] for fire in sell_fires]

    expect(buy_dates == BUY_DATES, f"buy-cross dates {buy_dates}")
    expect([buy["date"] for buy in record["buys"]] == BUY_DATES, "fixture buy dates")
    expect(len(sell_fires) == 8, f"sell-roll count {len(sell_fires)}")
    expect(len({fire["date"][:7] for fire in sell_fires}) == 8, "sell-roll months")
    expect(sell_dates == SELL_DATES, f"sell-roll dates {sell_dates}")
    expect([sell["date"] for sell in record["sells"]] == SELL_DATES, "fixture sell dates")
    for fire in sell_fires:
        year = int(fire["date"][0:4])
        month = int(fire["date"][5:7])
        banned = BANNED_SELL_MONTHS.get((year, month))
        expect(banned is None, f"banned sell fire {banned}")
        label = str(fire.get("resultLabel", ""))
        for text in BANNED_SELL_LABELS:
            expect(text not in label, f"{label} is a banned sell fire")

    arm = emitted["gold"]["openArm"]
    expect(
        arm["btc0"] == 116149 and arm["btc1"] == 84948,
        f"bitcoin arm {arm['btc0']} to {arm['btc1']}",
    )
    expect(
        arm["gold0"] == 3686 and arm["gold1"] == 4080,
        f"gold arm {arm['gold0']} to {arm['gold1']}",
    )
    expect(abs(arm["share"] - 0.245) <= 0.002, f"open arm share {arm['share']}")
    expect(arm["share"] > 0.15 and arm["flag"] is True, "flag should be on above 0.15")
    falling = emitted["gold"]["falling"]
    expect(falling["gold1"] < falling["gold0"], "expected a falling gold price")
    expect(falling["share"] == 0, f"falling gold share {falling['share']}")
    expect(falling["flag"] is False, "falling gold should not flag")
    expect(emitted["gold"]["flagAtCut"] is False, "flag is off at 0.15")
    expect(emitted["gold"]["flagAboveCut"] is True, "flag is on above 0.15")

    percents: list[int] = []
    for card in emitted["friday"]["cycles"]["cards"]:
        if card.get("isProgress") is True:
            continue
        for row in card["rows"]:
            percents.append(row["sharePct"])
    expect(percents == CYCLE_PERCENTS, f"cycle percents {percents}")

    by_spot = {item["spotUsd"]: item for item in emitted["live"]}
    expect(set(by_spot) == {84413, 90000}, f"spots {sorted(by_spot)}")
    pinned = by_spot.get(84413)
    other = by_spot.get(90000)
    if pinned is None or other is None:
        errors.append("missing live spot")
    else:
        pinned_rows = pinned["progress"]["rows"]
        expect("+208%" in json.dumps(pinned["progress"]), "84413 progress missing +208%")
        expect(any(row.get("sharePct") == 48 for row in pinned_rows), "84413 progress missing 48%")
        expect(
            other["progress"]["lead"] != pinned["progress"]["lead"],
            "other spot did not change the progress lead",
        )
        expect(other["progress"] != pinned["progress"], "other spot did not change progress")
        expect("cash" not in pinned and "cash" not in other, "buildLive emitted cash")
    expect(emitted["friday"]["cash"]["word"] == "All in", f"cash word {emitted['friday']['cash']['word']}")

    if errors:
        sys.stderr.write("\n".join(errors) + "\n")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
