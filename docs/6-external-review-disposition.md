# External review, what was merged

Source: `docs/5-claude-design-review-findings.pdf`, 26 September 2026. The review checked the pre-merge goal, quality write-up, and strategy against price history, and proposed a new goal, new rows, and a new posture set.

The living specs are now `docs/goal.md`, `docs/1-signal-quality.md`, and `docs/2-signal-strategy.md`. `docs/4-confirmation-findings.md` stays the audit of the pre-merge text, with the verdict corrections below. `docs/3-confirmation-plan.md` is unchanged.

The original quality table is still the record of the original test. Figures from the external check are labeled as that check. Its Coin Metrics file ends 23 May 2026. It did not rebuild the gold z-score. Sell-roll months were measured from each month's first Friday. Weekly windows overlap. No fees, slippage, or taxes were included.

## Adopted

- The goal no longer asks for a proven 80% action. Every action shows its record, a Wilson 90% floor, and its episode count. High confidence is a floor of at least 80%, which on this method is 11 of 11 or 19 of 20. Eight of eight reaches 74.7%.
- The goal splits the two questions. Cash runs from a pause to an immediate buy of about $100,000 of cash already on hand. Coins already held are held, trimmed to a ceiling the holder sets, or exited. Exit is a thesis break, not a cycle high.
- Timing is judged at 1 year. The 5-year and 10-year panel is allocation and the long-hold base rate. That base rate is not a timing signal.
- The standing timing reserve is removed. In all four cycles it bought fewer coins than spending the same dollars as they arrived.
- All in spends cash on hand on the fire Friday. The next two Fridays are grace for a missed check, not three planned slices. The external check found the three-Friday spread cost 1% to 13% more in three of four episodes, and a 26-week spread cost 2% to 60% more.
- The gap switch is in. At least 20% under the trend, extra cash is bought as it arrives, unless the cross is armed. At least 55% over the trend, a new lump sum is spread over 12 months. Between the lines there was no edge. Those percentages are overlapping weeks from the external check, read as a few regimes.
- The macro-pressure blend is back on the chart as a non-voting thermometer.
- The z-score is shown as a Bitcoin leg and a gold leg.
- Sell-roll recall sits beside the 6 of 8: silent since 2021, missed 2019–20 and 2025–26, usually late, and the +55% band may be fading. Peaks over the trend ran +782%, +557%, +217%, and +27%.
- Stand down can last up to 12 months, because that is the horizon the score actually covers, and it ends early if All in or Build turns on. Paused cash waits in short-term Treasury bills. The 12-month length is untested. Coins are not sold.
- Build is one tranche. A spell ends on the fifth consecutive Friday close at or above cost. Four do not end it. A leftover carries. A second tranche does not open inside a choppy bear. The weekly schedule remains untested.
- The 26 September 2026 call stays a buy. It is All in, up to $100,000 of cash on hand, through the last grace Friday of 2 October 2026. The line is 4 of 4, floor about 60%, open episode, not high confidence. Build stays off. Two caveats are on the line: the trend level depends on the fit's start year, and gold did part of the arming.
- Hash ribbons, Mayer under 0.8, trend-following exits, and the 200-week average were scored in the external check and kept out of the decision. The 200-week average is a map line only.
- ETF flows and corporate treasury buying are context from 2024, and a regime flag on older calibrations.
- Macro liquidity is named as a later filter on Stand down, not as a timer.

## Narrowed on purpose

- The −20% and +55% lines now also choose lump versus spread. The original quality row forbade them as a weekly buy/sell ladder, and confirmation check A5 passed only while they did not release cash by themselves. The authority for the new use is the external lump-versus-spread test, which is a different score. The quality write-up now says that in the power-law row.
- "Not a trigger" on the realized-price flag is read as "not a lump sum on the first Friday." Pacing buys through the cheap spell is allowed. The schedule is still untested. That is why A6 no longer counts the flag as a second conflict.
- Armed extra cash still waits for the fire. The reserve's loss was the multi-year gap between episodes. The arm-to-fire wait has not been scored. The chart has to say so.
- Thesis-break monitors are listed and have no floor. No power-law floor band was invented. The −20% line is not that band.
- Tax is a line on Trim and Exit. The spec does not assume a jurisdiction or a rate. The external review named an Arizona resident's rates. Those rates are not in this spec.
- The original buy-cross results stay +127%, +59%, +269%, and +138%. The external check's +125%, +57%, +269%, and +153% are recorded as end-date sensitive, and they do not replace the table.
- The six-rung ladder stays off the decision. Restoring it would put a calendar-sensitive ladder back on the action. The quality write-up called it optional. That remaining drop is the leftover of A6.

## Corrections to the confirmation audit

Applied inside `docs/4-confirmation-findings.md`, against the pre-merge documents:

| Check | Was | Now | Why |
| --- | --- | --- | --- |
| B1 | Conflict | Refused | The plan's own rule: the strategy showed the action and printed the lower floor. The fix is the goal. |
| Ruling 1 | Strategy yields | Goal yields | The strategy already refused 80%. |
| Ruling 4 | Strategy yields | Goal yields | "All the signals" has to be narrowed in the goal. A6 is the strategy concession, not the whole ruling. |
| A6 | Conflict, including realized price | Conflict on the thermometer and the six-rung only | The first-week lump sum was already the failed trigger. The schedule is A10. |
| A9 | Extension, with −18% marked unverified inside the check | Extension | The external check reproduced −18%, the four dips, the down-year share, and the Wilson floors. They were still additions at audit time. |
| B4 | Conflict | Pass | The like-for-like test is the lift, 11 of 16 against 4 of 4. Deploy plus Build was not claimed as a stronger signal. |

Corrected count of the pre-merge audit: Pass 11, Fail 6, Extension 6, Conflict 4, Unverified 0, Refused 1. No averaged grade.

The Fail rows B3, B6, B7, B8, B9, and B10, and the Conflicts B2, B5, and B11, still describe the pre-merge goal and strategy. The rewrite was aimed at those clauses: an open episode is labeled open, the spectrum is Exit through All in, the boldest buy is $100,000 immediate, steps out of coins exist only as Trim and Exit, the gap switch is the dollar-cost-average clause, and the horizons are split. This file does not re-grade the rewritten documents against the old plan. The old plan quotes the old goal.

## Left open

- Where the coins are held, and whether a sale is even possible.
- The allocation ceiling that would turn Trim on. Until it is set, Trim stays off.
- Whether the score of record becomes after-tax dollars, or stays coins against steady buying. The strategy scores coins. After-tax dollars wait on the account.
- The arm-to-fire test, the four-Friday spell replay, the gold leg of every past fire, macro liquidity as a stand-down filter, and volatility-scaled bands. Constants stay frozen until those are done.
- A full posture-set backtest against steady buying, in coins at 1, 2, and 4 years, was not run.

## What 26 September 2026 is, after the merge

All in. Up to $100,000 of cash already on hand. Last grace Friday 2 October 2026. Standing contribution continues. Build off. Coins held. Label: 4 of 4, floor about 60%, open episode, not high confidence. Gold participated in the arm. The trend level moves with the fit's start year, and the arm still holds.

## Wireframe review, locked 26 September 2026

Source: `docs/8-claude-friday-wireframe-review-findings.pdf`. The page design in `docs/7-friday-wireframe.md` is locked. The picture is `docs/mockups/friday-wireframe.png`.

Adopted from that review, with the two holder choices below already applied: one record contract of episodes then floor; All in's coin payoff against a 52-week spread; Lump in 6 of 6 and Slow in 2 of 3 by regime; Stand down's coin replay of 7 of 8; precedence with Build ending the pause and the −20% line not ending it; paused cash at 12 months follows the gap switch; a cheap spell ends on the fifth Friday at or above cost; Trim needs coins, net worth, target, and ceiling; Exit is a dated declaration; the gold flag cuts at 15%, and the 38% year figure is not that flag; Friday close is the UTC Friday bar, complete at 00:00 UTC Saturday; live feeds are required before go-live and the study dates stay until the fires are rebuilt. Region 3 is not drawn when hidden. The chart axis is log price, with buy markers at or below −20% and sell markers near +55%. A posture-change alert is a later phase, not this page.

The posture engine still waits on the arm-to-fire test and on one backtest of the whole posture set against steady buying. Those tests are not part of this lock.

## Two holder choices after the lock

The cheap spell now ends on the fifth Friday at or above cost. Four Fridays do not end it. That keeps the 2022 boundary, 22 July through 12 August, inside one spell. The holder chose five after that boundary was known.

The gold flag cuts at 15%, not 50%. Measured on the buy-cross arms, using the move from the last week the ratio was still at its 52-week mean. The four completed arms had a gold share of 0%. The 21 November 2025 arm had a gold share of 24.5%. Fifteen percent sits in that gap: it flags this arm and does not flag the completed arms. A 50% cut would have hidden this arm. Prices in that measurement start in July 2010. The z-score needs 52 weeks, and the first arm is 3 October 2014.

The bottom of the dashboard now shows the share of each cycle's percentage gain for the buy cross, Build, and Lump in, measured by holding to the cycle high. The sell roll is not in that table. The 2022 cycle is still current. At the 25 September 2026 print the panel also shows progress from the 9 November 2022 low: +436% so far, 63% of the rise to the October 2025 high still in the price, and each signal's gain to that print. The table is in `docs/1-signal-quality.md`.

## Two clocks, added after the first external review

The dashboard opens on any day and shows the latest print. The official call still changes only at the Friday close, because that is the weekly sample behind the record. Friday was not established as a better day to act. A print between Fridays that would have fired is marked developing and does not move the call. The wireframe for that page is `docs/7-friday-wireframe.md`, and the picture is `docs/mockups/friday-wireframe.png`.
