# Dashboard wireframe

Locked on 26 September 2026, and amended the same day to match `docs/10-claude-design-reference.html`. Structure only. Boxes, labels, and the words each box is allowed to say. No color, type, logo, or spacing system. A later change is a new draft, not a quiet edit of this page.

`docs/17-human-first-implementation-plan.md` is that later change for the home page. This wireframe remains the Evidence page until that plan ships. Where the two disagree about a This week sentence, the plan wins.

A picture of the sample page is `docs/mockups/friday-wireframe.png`. The file name still says Friday because that was the first draft. The page is a dashboard the holder can open on any day.

This is one read-only page for a single holder, plus a settings sheet of blanks. The page does not trade, does not compute tax, and does not let the holder pick a posture. The posture comes from `docs/2-signal-strategy.md`. The sample fill is the 26 September 2026 worked example, with the dollar shapes from that spec filled in so the page can be read. Settings themselves start blank.

The page has two clocks. Region 1 is the official call from the last Friday close, and it carries the record. The Now region is the latest print. Friday is the weekly sample the record was built on. It is not a finding that Friday is a better day to act. In this sample the latest print is that same Friday close, so the two clocks match. The Now region still says so.

## Pages

1. Dashboard. Opened any day. Latest print in Now. Official call from the last Friday close in region 1.
2. Settings. Amounts, the trim inputs, and the thesis declaration. The only inputs.
3. Marker detail. Opens from a fire marker. It does not change the official call.

## Dashboard

Wide screens follow `docs/10-claude-design-reference.html`: header, then the spectrum strip, then Cash with Coins and Now beside it. Under 768 px the order is header, the one-line clock sentence, Cash, Coins, Now, then the spectrum strip, then the rest. The clock sentence reads: "Official call: Fri 25 Sep 2026 close · Next close Fri 2 Oct · Friday close is 00:00 UTC Saturday · Opened 26 Sep 2026." Region 3 is not drawn on this sample. Hidden means it is not rendered. It is drawn only when All in and Stand down are both on.

```
+----------------------------------------------------------------------------+
| DASHBOARD                                                            Set   |
| Opened 26 Sep 2026.                                                        |
| Official call: Friday 25 Sep 2026 close.                                   |
| Next official close: Friday 2 Oct 2026.                                    |
+----------------------------------------------------------------------------+
| SPECTRUM     Position on the spectrum only. Not a confidence scale.       |
| 02 Coins held   Exit · Trim · HOLD                                         |
| 01 Cash         Stand down · Stay the course · Slow in · Build ·          |
|                 Lump in · ALL IN                                           |
| ← Out of Bitcoin                              Into Bitcoin →               |
+----------------------------------------------------------------------------+
| 1  CASH          Official call                                             |
|    ALL IN                                                                  |
|    Buy now, or by the Friday 2 Oct 2026 close. Up to $100,000.            |
|    After that close, the call is whatever that Friday says.               |
|    Standing contribution continues.                                        |
|                                                                            |
|    4 of 4. Floor about 60% (Wilson 90%). 4 episodes.                       |
|    Beat a 52-week spread, 4 of 4, +18% to +92% coins.                      |
|    This fire is open. Not high confidence.                                 |
+----------------------------------------------------------------------------+
| 2  COINS                                                                   |
|    HOLD                                                                    |
|    Coins already held stay held. Trim is off. Exit is off.                |
+----------------------------------------------------------------------------+
| NOW                                                                        |
| Latest print: 25 Sep 2026 daily close. Same print as the official call.   |
| Spot $84,413. Gap about -41% against the Friday trend, about $141,000.    |
| A later print can move these levels. It does not change region 1.         |
| Developing: none. This print is the official Friday close.                |
+----------------------------------------------------------------------------+
| 4  CAVEATS                                                                 |
|    Gold flag is on. Arm 21 Nov 2025. Gold share 24.5%, cut 15%.           |
|    From 12 Sep 2025: Bitcoin about -27%, gold about +11%.                 |
|    The 38% year-over-year figure is a different window.                   |
|    Fire week was led by Bitcoin (+10.4% to this close).                   |
|    Gap about -41% on this fit (trend about $141,000).                      |
|    Other start years: -29% to -46%. The arm holds. Not a price target.    |
+----------------------------------------------------------------------------+
| 5  PRICE         Log price. Latest print on the chart.                    |
|    +------------------------------------------------------------------+    |
|    |  log price                                                     |    |
|    |  trend ----    -20% ....    +55% ....    200-week ....        |    |
|    |  B at or below -20%      S near +55%                          |    |
|    +------------------------------------------------------------------+    |
|    Spot $84,413.  200-week average is a map line. It does not time a buy. |
|    Schematic. July 2020 fired nearer the trend. This drawing is not that. |
+----------------------------------------------------------------------------+
| 6  CONTEXT       Official Friday readings                                  |
|    These blocks are the Friday close. None of them change region 1        |
|    on a later day. A developing z-score does not arm or fire.             |
|                                                                            |
|    BUY CROSS        Fired 18 Sep 2026. Open.                              |
|    Z-score crossed above 0. Gap about -41%, past -20%.                    |
|                                                                            |
|    Z-SCORE          Into the arm: Bitcoin about -27%. Gold about +11%.    |
|    Gold share 24.5%. Flag on. Cut is 15%.                                 |
|                                                                            |
|    THERMOMETER      about +4.   Signed, zero when the inputs disagree.    |
|    Non-voting.                                                             |
|                                                                            |
|    REALIZED PRICE   About 59% above cost. Cost about $53,000.             |
|    Build is off until a Friday close.                                      |
|                                                                            |
|    SELL ROLL        Quiet. Not armed since 2021.                          |
|    Missed 2019-20 and 2025-26.                                             |
|    Coins: 7 of 8, floor about 59%. June 2013 lost.                        |
+----------------------------------------------------------------------------+
| 7  FIVE AND TEN YEARS                                                      |
|    Holds of 3, 4, 5, and 10 years were up in 99% or more of entry weeks.  |
|    Fewer than three independent 5-year windows since 2012.                |
|    Early growth inflates the rate. Not today's action.                    |
|    Ceiling: not set. Trim is off. Thesis broken: not declared. Exit off. |
|    Monitors, not triggers: hash-rate collapse; signature break with no    |
|    migration; prohibition across major markets. Floor band: not defined. |
|    Regime from 2024: spot ETF and corporate buying. No flow number yet.  |
+----------------------------------------------------------------------------+
| 8  CYCLE CAPTURE                                                           |
|    Share of that cycle's percentage gain, buying the signal and holding   |
|    to the cycle high. This page does not sell there.                      |
|    A higher share is an earlier price. It is not a higher probability.    |
|    Sell roll is not in this table. It does not sell coins.                |
|                                                                            |
|    2015-2017   $176 to $19,641          full +11,082%                     |
|    Buy cross   24 Jul 2015 at $289      +6,689%    60%                    |
|    Build       39 Fridays, avg $246     +7,895%    71%                    |
|    Lump in     119 Fridays, avg $511    +3,747%    34%                    |
|                                                                            |
|    2018-2021   $3,185 to $67,542        full +2,021%                      |
|    Buy cross   3 May 2019 at $5,658     +1,094%    54%                    |
|    Buy cross   31 Jul 2020 at $11,338   +496%      25%                    |
|    Build       15 Fridays, avg $3,769   +1,692%    84%                    |
|    Lump in     60 Fridays, avg $7,147   +845%      42%                    |
|                                                                            |
|    2022-2025   $15,758 to $124,824      full +692%                        |
|    Buy cross   17 Mar 2023 at $27,451   +355%      51%                    |
|    Build       9 Fridays, avg $16,806   +643%      93%                    |
|    Lump in     71 Fridays, avg $30,841  +305%      44%                    |
|    The drop after 6 Oct 2025 reached about 53% on 30 Jun 2026.           |
|    Not a finished 70% bear. This cycle is still the current one.         |
|                                                                            |
|    PROGRESS  25 Sep 2026 spot $84,413                                     |
|    From the low so far +436%. That is 63% of the +692% rise to the high. |
|    Price is 32% under the high.                                           |
|    Buy cross   17 Mar 2023 at $27,451   +208% so far   48%                |
|    Buy cross   18 Sep 2026 at $80,944   +4% so far      1%                |
|    Build       same 9 Fridays, avg $16,806   +402% so far   92%          |
|    Lump in     116 Fridays to date, avg $48,026   +76% so far   17%      |
|    Shares are of the +436% rise from the low, not of the rise to the high.|
|                                                                            |
|    2011 and 2013 had no buy-cross fire. They are not scored.             |
+----------------------------------------------------------------------------+
| 9  FOOTER                                                                  |
|    Research rule. A large position needs the holder's full balance sheet. |
|    This page does not trade and does not compute tax.                     |
+----------------------------------------------------------------------------+
```

## What each region may say

| Region | Always shows | May add | Collapses when |
| --- | --- | --- | --- |
| Header | When the page was opened, which Friday close the official call uses, the next official Friday, a way to Settings | The All-in window end, when that window is open. Under 1024 px, the chips collapse to the one-line clock sentence. | Never |
| Spectrum | Two rails. Coins: Exit, Trim, Hold. Cash: Stand down, Stay the course, Slow in, Build, Lump in, All in. The line "Position on the spectrum only. Not a confidence scale." | — | Never, except the cash rail has no active segment during Exit or a missing Friday close. The middle sentence hides under 768 px. |
| Now | The latest print's time, spot, and gap against the last Friday's trend. Whether that print is the official close or a later print. | "Developing:" plus the condition that would arm or fire if this print were a Friday close. The sentence ends with "Not an official fire." | Never. When the clocks match, it says developing is none. |
| 1 Cash | One posture name, the action in words, wins of episodes, then the floor. The words "Official call." | "Open episode." "Not high confidence." The All-in coin payoff. "Schedule untested." "Armed wait untested." | Never on a normal close. A missing Friday close replaces the posture with "No call" and drops the record box. |
| 2 Coins | Hold, Trim, or Exit | Tax line on Trim and Exit. "No floor" on Exit. | Never |
| 3 Disagreement | — | "Sell roll is also in its pause. All in still wins. The week is not cut in half." | Not rendered unless All in and Stand down are both on. It then sits between Coins and Caveats. |
| 4 Caveats | — | Gold flag in words. Fit-range sentence. "Same week is not a higher probability." Armed-wait sentence. | Hidden when none of those apply |
| 5 Price | Log price, trend, −20% line, +55% line, 200-week average. Buy markers at or below −20%. Sell markers near +55%. | Spot, trend level, gap. A note when a real fire, such as July 2020, sat nearer the trend. | Never |
| 6 Context | Official Friday readings: buy-cross state, the arm's Bitcoin and gold moves, thermometer with its scale, price against realized price, sell-roll sentence | Gold share and whether it is above the 15% cut. Sell-roll coin record and misses. | Never. A quiet sell roll still prints "quiet." |
| 7 Five and ten years | Long-hold base rate, the independent-window caveat, thesis monitors, declaration state | The ceiling percent, once set. A flow number, once a feed exists. | Never |
| 8 Cycle capture | One row per finished cycle the buy cross traded, with that cycle's full percentage gain, then the buy cross, Build, and Lump in. The current cycle adds progress at the latest print: rise from the low, the share of the rise to the high still in the price, and each signal's gain so far as a share of the rise from the low. | The note that 2011 and 2013 had no fire. | Never. The current cycle still occupies its progress lines when it has not ended. |
| 9 Footer | Research line. Does not trade. Does not compute tax. | — | Never |

The record line is the only confidence display. The spectrum strip is not one. If a rule later clears a Wilson 90% floor of 80%, that same line gains the words "High confidence." There is no meter, badge slot, or second score that grows when the action gets larger.

Region 1 names one posture. All in together with Build is still led by All in. The cash box adds one sentence that the build slice also runs, and region 4 says the week is not a higher probability. Build does not lend its record to All in, and All in does not lend the 4 of 4 to Build.

## Same skeleton, other states

Only regions 1, 2, 3, and 4 change with the posture. The chart, the context block, and the long-horizon panel stay in place and refresh their numbers. Sample words below are the instruction, not a second worked Friday.

| State | Region 1 | Record line on region 1 | Region 2 | Region 3 or 4 |
| --- | --- | --- | --- | --- |
| All in, this sample | Buy now, or by the last grace Friday. After that close, the call is whatever that Friday says. Standing contribution continues. | 4 of 4. Floor about 60%. Beat a 52-week spread, 4 of 4, +18% to +92% coins. Open. Not high confidence. | Hold. Trim off. Exit off. | Gold flag on. Share 24.5% at the 21 Nov 2025 arm, cut 15%. Fit range. |
| All in and under cost | Same, plus the build slice also runs. | All-in record. Build's record stays in the realized-price block. | Hold | This week is not a higher probability. |
| All in during a stand-down pause | All in. Standing contribution continues. | All-in record | Hold | Region 3 is rendered. Coins stay held. |
| Build | One tranche, sliced this Friday, while under cost. A stand-down pause ends. Standing contribution resumes. | 79% of 91 weeks. 4 spells. Schedule untested. | Hold | — |
| Build while armed | Build, as above. Cash waiting on the cross stays put. | Build record, plus "armed wait untested." | Hold | Extra cash waits for the z-score to cross above zero. |
| Stand down | Pause new money for up to 12 months, or until All in or Build. At 12 months the cash follows the gap switch. | 7 of 8. Floor about 59%. About six episodes. June 2013 lost. Missed 2019–20 and 2025–26. | Hold | — |
| Lump in | Cash available goes in on the Friday it is available. Standing contribution continues. | 6 of 6 finished regimes. Floor 69%. One regime open since November 2025. | Hold | — |
| Slow in | A new lump sum spreads over 12 months. Standing contribution continues. | 2 of 3 regimes. Floor 25%. Weakest record on the page. | Hold | — |
| Stay the course | Standing contribution only. | No event record. Between the gap lines, a new lump sum has no measured edge. | Hold | — |
| Stay the course while armed | Standing contribution continues. Extra cash waits. | Armed wait untested. | Hold | Waiting for the cross. The cross has not fired. |
| Trim, any cash posture | Cash region unchanged | Cash record unchanged | Sell from the ceiling down to the target, highest-cost lots first. A sale can create a tax bill. Rate not computed. | "Sped up" when a stand-down pause is also on: finish by the end of the pause. |
| Exit | No new buy. | No floor | Sell all. Declaration date shown. | Monitors stay in region 7. They do not fire Exit. |

There is no "Build during stand down" row. Build ends the pause. Trim stays off until Settings has coins held, investable net worth, a target, and a ceiling. Exit stays off until Settings has a dated "Thesis broken" declaration. The power-law floor band is not drawn.

A visit on any day refreshes Now and the chart from the latest print. Region 1 stays the last Friday's official call until the next Friday close. If the latest print would arm or fire, Now says developing and region 1 does not change. Inside an open All-in window the cash box still gives the date of the last grace Friday. After that close, region 1 falls through to whichever posture the new Friday close actually is.

## Settings

```
+----------------------------------------------------------------------------+
| SETTINGS                                                 Back to dashboard |
+----------------------------------------------------------------------------+
| STANDING CONTRIBUTION                                                      |
| Amount        [ blank ]                                                    |
| Every         [ week  /  month ]                                           |
| Shape, if you have not chosen: about $5,000.                              |
+----------------------------------------------------------------------------+
| BUILD TRANCHE                                                              |
| Amount        [ blank ]                                                    |
| Shape, if you have not chosen: about $100,000, sliced on cheap Fridays.   |
+----------------------------------------------------------------------------+
| CASH AVAILABLE TO INVEST                                                   |
| Used by All in, Lump in, and Slow in.                                      |
| Amount        [ blank ]                                                    |
| Shape, if you have not chosen: up to $100,000 on an All-in fire.          |
| This amount is not refilled in order to wait for the next cross.          |
+----------------------------------------------------------------------------+
| TRIM                                                                       |
| Coins held              [ blank ]                                          |
| Investable net worth   [ blank ]                                          |
| Target share            [ blank ]                                          |
| Ceiling share           [ blank ]                                          |
| Any blank means Trim stays off.                                            |
+----------------------------------------------------------------------------+
| THESIS                                                                     |
| Thesis broken           [ not declared ]                                   |
| Date                    [ blank ]                                          |
| Not declared means Exit stays off.                                         |
+----------------------------------------------------------------------------+
| ACCOUNT                                                                    |
| [ blank ]   taxable    /    IRA    /    fund                               |
| Blank means the page does not compute tax.                                 |
| After-tax dollars are not a score until this is set.                       |
+----------------------------------------------------------------------------+
| The dashboard reads these amounts. It does not place an order.            |
+----------------------------------------------------------------------------+
```

If an amount is blank, the dollar clause comes out and the pile is named. "Up to $100,000." becomes "Use your cash available to invest." The page does not invent $100,000 on a live page. The $100,000 in the sample frame is the spec's shape, used so this draft can be read.

## Marker detail

Opened from a B or an S on the chart. Closing it returns to the dashboard with the official call unchanged.

```
+----------------------------------------------+
| FIRE                                         |
| Buy cross          or          Sell roll     |
| Date                                         |
| Finished year: result                        |
| or: Open. Not in the completed count.        |
+----------------------------------------------+
```

Completed buy-cross results that may appear here: +127%, +59%, +269%, +138%. The open buy cross is 18 September 2026, near $81,000. Sell-roll dates that may appear here: June 2013, April 2014, August 2014, September 2017, March 2018, May 2018, May 2021, December 2021.

Under 768 px the markers are display-only. A "Show fires" text button under the chart opens a bottom sheet titled "Fires". The sheet lists each fire with the same two lines, newest first, and a Close button. Opening it does not change the official call.

## System states

These states do not show a posture the engine did not produce. No state uses a toast.

| State | Trigger | What the page shows |
| --- | --- | --- |
| Loading | Before the first view model arrives | The header, plus panels whose text lines are empty bars at their line heights. No numbers and no posture words. The main region is marked busy. No shimmer. |
| Stale print | The latest print is more than 26 hours old | The Now chip reads "Stale print". The note reads "The latest print is from [date]. Levels may be out of date." The official call is untouched. |
| Missing Friday close | The engine cannot compute the official close | Cash word "No call". Sentence: "The Friday [date] close is missing. There is no official call until it arrives." No record box. No active cash segment. Coins and Context show the previous Friday, with "(from Fri [date])" after each Context value. |
| No data at all | The view model fails to load | One centred panel: "The dashboard could not load its data. Nothing here is a call." and a "Try again" button. |

## Not on this wireframe

No Fear & Greed dial, reserve-risk zone, VDD, Puell, netflow, funding rate, Galaxy checklist, Stage Two, six-rung ladder, NUPL, or MVRV z-score. No reserve balance. No confidence meter. No vote count. No control that lets the holder pick a signal posture. The Thesis-broken declaration is a holder record, not a signal override. No broker connection. No tax calculation. No second timing page for the 5-year and 10-year base rate.

A posture-change alert is not on this page. A missed All-in window is the main way the page can fail a holder who does not open it. One alert when the official call changes can be added in a later phase. It is not part of this lock.
