# Signal strategy

The dashboard can be opened any day. It answers two questions. What happens to cash. What happens to coins already held. The official answer changes at the Friday close. Most weeks the cash answer is the standing contribution. On rare weeks it is a lump sum, a paced build, a pause, or an immediate buy of cash already on hand. Coins already held stay held unless the holder has set a trim, or a thesis-break rule is on.

The buy cross remains the timing event. The realized-price flag remains the cheap-state flag. The new evidence changes how a buy is funded, how large it is, and what the sell side is allowed to claim. It does not add a second timing engine.

Of the candidates tested from 2012 through September 2025, two measured inputs still carry the timing. They combine into the buy cross and the sell roll. The power-law gap, tested later as a lump-versus-spread switch, decides what to do with new cash when no event is on. The realized-price ratio sets the pace of one tranche while coins are cheap. Everything else is context or left out.

## Size is not confidence

A bigger action is not a higher probability.

| Word | What it decides |
| --- | --- |
| Record, floor, and episodes | How often finished episodes were right, the Wilson 90% lower bound on that record, and how many independent episodes are behind it. |
| Posture | Which cash moves, how fast, and what happens to coins already held. |

High confidence means a floor of at least 80%. On a Wilson 90% interval, 8 of 8 has a floor of 74.7%. 10 of 10 has 78.7%. 11 of 11 has 80.3%. 19 of 20 has 80.4%. The old line that asked for eight episodes and an 80% floor cannot be met. The buy cross is 4 of 4, and the floor on four wins is about 60% (59.7% on the external check). All in is the larger buy because the fire is the scored entry, and because an immediate buy of cash on hand beat both a three-Friday spread and a 26-week spread. It is not larger because the odds are 80%.

The dashboard must not print "80%" on this action, and it must not grow a meter as the action gets larger. The September 2026 cross is not a stronger buy than July 2020 because the gap under the trend is wider. At the July 2020 fire the gap was about −18%, and that year was the best of the four (+269%). Depth under the trend is not a size multiplier. Neither is a more extreme z-score.

The dollars are chosen by the holder, before any signal fires. The signal names which cash moves and how fast. The shapes below use a standing buy of about $5,000, a build tranche of about $100,000, and an immediate buy of up to $100,000 of cash already on hand. They are not outputs of the model. There is no timing reserve to refill between crosses. A reserve that waited from one fire to the next bought fewer coins than spending the same dollars as they arrived, in all four cycles (7% to 84% fewer). The table is in `docs/1-signal-quality.md`.

| Pile | What it is | Who sets the dollars |
| --- | --- | --- |
| Coins already held | Bitcoin the holder already owns | Sold only by Trim or Exit, under the rules below |
| Standing contribution | The small regular buy | Holder, in advance. Shape: about $5,000 a week or a month |
| Cash on hand | Extra cash already available | Holder. The boldest buy spends up to about $100,000 of it on the fire. It is not refilled in order to wait for the next cross. |
| Build tranche | One larger sum for a cheap spell | Holder, in advance. Shape: about $100,000, sliced weekly while under cost |

## The confidence contract

| Word | Meaning |
| --- | --- |
| Record | How the completed episodes turned out. The buy cross is 4 of 4. |
| Floor | The Wilson 90% lower bound on that record. For 4 of 4 the floor is about 60%. |
| Episodes | Independent tries. Overlapping weeks are not episodes. The 91 cheap weeks are four spells. |
| High confidence | Floor at or above 80%. That is 11 of 11, or 19 of 20, on this method. |

Until a rule clears 80%, the directive shows its record, its floor, and its episode count on the same line as the action. An open episode is labeled open and is not added to the record. If a future episode fails, the record changes and the action can lose its place.

The constants below are not refit to chase a better backtest. Changing −90, −20%, +55%, +40, or the 10% rollover is a new study. Replacing those fixed bands with volatility-scaled bands is also a new study.

The base rate the original signals had to beat: from 2012 through September 2025, 60% of weeks were already followed by a 50% year. The external check found 61.1% of entry weeks from 2012 to May 2025. The best constant instruction in the original study, always buy big, scored about 54% on the five-rung scale. The six-rung ladder was calendar-sensitive and usually one rung too timid. It stays off the decision.

## What is in

| Piece | Role | Why it is in |
| --- | --- | --- |
| Bitcoin power law | Map, one half of both events, and the lump-versus-spread switch | As a weekly buy/sell ladder it barely beat always owning Bitcoin (about 57% rung-credit, floor about 40%). The −20% and +55% lines are the tested event thresholds. A later check used those same lines as a lump-versus-52-week-spread switch. That switch is in the external-check section. It is not the rung ladder. |
| 52-week BTC/gold z-score | The other half of both events. Never its own call. | As a weekly ladder it scored about 25% and lost to always owning Bitcoin. The chart shows the Bitcoin leg and the gold leg separately. |
| Buy cross | Spends cash on hand | Power law and z-score together. 4 of 4 completed fires were followed by a year of +50% or better: +127%, +59%, +269%, +138%. Floor about 60%. The external check's 52-Friday results were +125%, +57%, +269%, +153%. The table in the quality write-up stays the record. |
| Sell roll | Can pause new cash | The same two inputs, opposite thresholds. 6 of 8 fires were followed by a flat or down year. Floor about 46%. Two fires were followed by +565% and +85%. The external check's down-year share was 26.9% through May 2025, rising toward 29% once later 2025 entries are included. Recall: silent through the 2019–20 decline and the 2025–26 decline, not armed since 2021, and usually late. |
| Realized-price ratio | Sets the pace of one tranche | One fact. A ratio below 1, NUPL below 0, and a negative MVRV z-score are the same week. While price was under that cost, 79% of those weeks were followed by a 50% year, across four spells, and 90 of the 91 weeks were positive. The first week of the break is not a lump sum (right in 2 of 4 spells). Pacing buys through the cheap spell is the use of "coins are cheap." The weekly schedule itself is untested. |
| Gap switch | Lump, spread, or either | From the external check. At least 20% under the trend, a lump sum beat a 52-week spread in 93% of 353 overlapping weeks. At least 55% over the trend, the spread won 65% of 130 weeks, and 85% since 2018. Between the lines, no edge (51% to 59%). |
| Macro-pressure blend | Thermometer | Non-voting. It sits near zero when the power law and gold disagree (about +4 on 25 September 2026, next to the desk's +7) and loses as an action (about 29% rung-credit). |
| Long-hold base rate | The 5-year and 10-year panel | Up in 99% or more of entry weeks at 3, 4, 5, and 10 years in the external check. Not a timing signal. Fewer than three non-overlapping 5-year windows exist since 2012. |

## What is combined

Only one combination earned a timing event, and it is the buy cross.

Use the power law and the gold z-score as a pair of events. The confirming half is the z-score crossing back above zero after a trough. Firing on the cross without the trough is the lift: 11 of 16, including the 2018, late-2021, and 2025 failures. The trough is what removed those years. That is the like-for-like comparison. The power law's 57% and the z-score's 25% are rung-credit scores, which are a different scale.

The blend stays on the chart and does not vote. The six-rung ladder stays off the decision. It was an optional weekly instruction, and one of four calendars lost to always buying.

The realized-price ratio does not join the buy cross. Requiring a prior break under the realized price would have dropped July 2020. Pairing the ratio with Puell did not raise the hit rate. It runs on its own track: the pace of one tranche.

All in and Build in the same week move two kinds of cash. That week is large because both are on. It is not a stronger signal, and it is not a higher probability. July 2020 fired without being under cost, and it was the best completed year.

## Two clocks

The dashboard can be opened on any day. Friday is on the page because it is the weekly sample the record was built on: one reading a week, and a Bitcoin-to-gold ratio that uses a gold close from the same market week. Gold is the market that shuts. Bitcoin trades every day. The study never compared weekdays. There is no result that Friday is a better day to act.

The official call is the posture from the last Friday close. Arming, firing, and a change of posture happen at that close only. The record, the floor, and the episode count belong to this call. Inside an open All-in window, cash available may be spent on a later day. The window is still bounded by Friday closes.

Friday close means the daily bar dated that Friday in UTC. The bar is complete at 00:00 UTC Saturday, and that is when the official call can change. The study's fire dates stay the record until they are rebuilt on the live feeds. Before go-live those feeds have to be named: a daily Bitcoin close, a daily realized cap, and a daily gold close with the futures roll written down if the gold series is a futures contract. A different print can move the fires. Coin Metrics community data, the study source, is not a live feed. The file used in the external checks ends 23 May 2026.

The latest print is the price, gold, and realized-price reading available when the page is opened. Spot can move between Fridays. The gap uses that spot against the trend fit from the last Friday. The fit is not redone until the next Friday close. The official z-score stays the last Friday's score. The page may also show a developing score that puts the latest Bitcoin and gold prints in place of the current week. That developing score does not arm or fire. The latest realized-price ratio is shown. Build starts or stops at the Friday close.

If the latest print would have armed or fired had it been a Friday close, the page says the condition is developing. The official call stays the last Friday's call until the next Friday close.

## How each input is obtained

The rules below are evaluated at the Friday close. That evaluation is the official call. Daily prices may draw the chart, and the latest print may fill the developing line. The latest print does not move the official call.

**Bitcoin price.** A daily USD close from 2010 onward, so the trend can be refit from scratch and the old fires can be reproduced. The study used the Coin Metrics community series `PriceUSD`. A replacement has to be a daily close. A last-trade print that moves the Friday close will move the fires.

**Gold.** A daily gold close, filled forward at most 10 days when the gold market is shut. The study used COMEX gold futures. A spot fix is acceptable only if a check shows the z-score still crosses zero on the same Fridays. The chart plots the Bitcoin leg and the gold leg of the ratio, and it flags an arm or a fire that gold drove.

**Power law, calculated.** Each Friday, fit

`log10(price) = a + b · log10(days since 3 January 2009)`

by ordinary least squares on every daily close from the first usable price through that Friday. No later data enters the fit. The trend price is `10` raised to `(a + b · log10(days))`. The gap is `price / trend − 1`. The map draws the trend, the line 20% under it, the line 55% over it, and the 200-week average as a map line only. The −20% and +55% lines are the tested thresholds. They do not scale the order.

An external check moved the fit's start year from 2010 to 2017 and found the 25 September 2026 gap running from −29% to −46%, with slopes from 4.95 to 5.98. The arm, 20% under the trend, held under every one of those fits. The chart may say that the level of the trend is sensitive to the start year. It does not publish a long-range price target from one fit. Cycle peaks over the trend ran +782%, +557%, +217%, and +27%. The +55% line has not been reached since 2021.

**Z-score, calculated.** Each Friday, Bitcoin's close divided by that day's gold close. Mean and sample standard deviation of the last 52 Friday ratios, including the current week. The score in the rules is 100 times that z-score. −100 means one standard deviation cheap versus gold over the past year. +40 means 0.4 standard deviations rich. The score is not an action and not a size. Between Fridays the official score stays at the last Friday. A developing score may replace the current week with the latest prints. Only the Friday score can arm or fire.

**Gold flag, calculated at the arm Friday only.** Take the most recent earlier Friday, inside the same 52 weeks, on which the Bitcoin-to-gold ratio was still at or above that week's 52-week mean. From there to the arm, split the log change of the ratio into the Bitcoin move and the gold move. Gold's share is the part of that cheapening that came from gold rising. Bitcoin falling is the rest. Flag when gold's share is above 15%.

That 15% cut is the round number in the only gap in the record. The rule can arm only once the z-score exists, so the first arm is 3 October 2014, not 2010. The four completed arms had a gold share of 0%. Gold was flat or down, and Bitcoin's decline was the whole cheapening. The open arm, 21 November 2025, had a gold share of 24.5%: from 12 September 2025, Bitcoin fell about 27% and gold rose about 11%. A cut of 50% would not flag that arm. A cut near 0% would not separate it from the completed arms. Fifteen percent flags this arm and none of the completed ones. The year-over-year figure of about 38% is a different window and is not the flag.

**Realized-price ratio, fetched.** One daily series: market value divided by realized value. The study's community source is Coin Metrics `CapMVRVCur`. The latest ratio may be shown any day. Under cost means the ratio is below 1. That state changes Build at the Friday close. Do not also fetch NUPL or the MVRV z-score to cast a second vote.

**Buy cross, calculated.**

- Arm on a Friday when the z-score is at or below −90 and the close is at least 20% under that week's trend.
- Stay armed on later Fridays even after those two conditions have cleared.
- Fire on the first later Friday when the z-score crosses from at or below zero to above zero.
- Then disarm. One fire per arming.

Completed fires: 24 July 2015, 3 May 2019, 31 July 2020, 17 March 2023. The open fire is 18 September 2026. July 2020 is the extra fire the desk list left out, and it was the strongest completed year.

**Sell roll, calculated.** This is the rule that was tested, not the four famous peak months. April 2013, December 2017, July 2019, and March 2021 are not what this rule prints.

- Arm while the Friday close is at least 55% above that week's trend and the z-score is at least +40.
- Track the highest Friday close during that spell.
- Fire on the first later Friday when the arming condition is no longer true and the close is at least 10% under that spell's peak.
- One fire per spell.

Fires: June 2013, April 2014, August 2014, September 2017, March 2018, May 2018, May 2021, December 2021.

## Postures

Each row is an instruction. Cash and coins are separate columns, so the spectrum can run from Exit to All in without pretending a cycle rule sold the coins.

| Posture | Cash | Coins held | Evidence |
| --- | --- | --- | --- |
| All in | Cash available to invest goes in on the fire Friday, up to about $100,000. The next two Fridays are grace if that check was missed. They are not planned slices. Build also runs if under cost. | Hold | 4 of 4, floor about 60%. Beat a 52-week spread in 4 of 4, +18% to +92% coins. This episode is open. |
| Lump in | While the gap is at least 20% under the trend and the cross is not armed, cash available is bought on the Friday it is available. | Hold | 6 of 6 finished regimes, floor 69%. One regime open since November 2025. |
| Build | One tranche, sliced on the Fridays the ratio is below 1. | Hold | 79% of 91 cheap weeks hit +50%, across four spells. 90 of 91 were positive. The schedule is untested. |
| Stay the course | Standing contribution. Between the −20% and +55% lines, a new lump sum has no measured edge either way. | Hold | The default. In the external check, holds of 3 years or more were up in 99% or more of entry weeks. |
| Slow in | While the gap is at least 55% over the trend, a new lump sum is spread over the next 12 months. The standing contribution continues. | Hold | 2 of 3 regimes, floor 25%. Lost in 2013–14. Weakest record on the page. |
| Stand down | Pause new money for up to 12 months, or until All in or Build turns on, whichever comes first. Paused cash waits in short-term Treasury bills. | Hold | 7 of 8 fires got more coins than weekly buying, floor about 59%, about six episodes. June 2013 got 67% fewer. Missed 2019–20 and 2025–26. |
| Trim | No new cash instruction. | Sell down from the ceiling to the target, highest-cost lots first. A sell-roll pause speeds that sale. | A policy, not a signal. No hit rate. |
| Exit | No new cash instruction. | Sell all, only after the holder dates a "Thesis broken" declaration. | Cannot be backtested. No floor is printed. |

**All in is the fire, spent once.** The historical entry was the fire Friday. The same cash beat a 52-week spread in 4 of 4 fires, by +18% to +92% coins, and beat a 26-week spread in 4 of 4, by +2% to +60% coins. Grace exists so a missed check still catches the fire. The official document dated the second grace Friday is already the next posture. If the gap is still at least 20% under the trend and the cross is not armed, that posture is Lump in, so unspent cash is bought rather than left sitting. The coins bought at the fire keep the 12-month holding note from the study: the worst dip in the year after the historical fires was −27%, −12%, −11%, and −9%, inside the published range of −9% to −27%. The note does not create a reserve.

**Do not refill cash to wait for the next cross.** Between episodes, new money follows Lump in, Slow in, Build, or Stay the course as it arrives. The years between fires are where a standing reserve lost.

**While the cross is armed, extra cash waits for the fire.** Lump in is off during that wait. The standing contribution continues unless Stand down is on. If price is also under cost, Build may slice. The unfinished z-score cross is still required before the extra cash moves. Buying "a little" because the setup looks close is how the dips of about −50% before the cross get bought. This wait, from arm to fire, has not been scored against buying at the arm. The chart says so. The loss in the reserve table is the multi-year wait between episodes, not this armed interval.

**Build is one tranche, and the schedule is untested.** Slices are spent only on Fridays under cost. The shape is the tranche spread across about 26 weeks. One twenty-sixth is a shape, not a studied fraction. The first Friday under cost is not a lump sum. The external check names the two first-week failures the original table counted inside "2 of 4": 31 October 2014 was −3% after one year and +105% after two; June 2022 was +29% after one year and +222% after two.

A cheap spell ends on the fifth consecutive Friday close at or above cost. The fifth Friday counts. Four do not end the spell. A replay found that 2022 had exactly four such Fridays, 22 July through 12 August, between stretches under cost. The holder set the count at five after seeing that boundary, so those four Fridays do not end the 2022 spell. A case of exactly five Fridays has not been observed.

One tranche stays open until its slices are finished. A leftover carries into the next spell. A new tranche is funded only after that one is fully sliced. "A choppy bear" is not a condition the page can compute. Under the funding rule, 2022 is still one tranche even where the spell definition separates it.

**Stand down does not sell coins.** The two flat-or-down failures were followed by +565% and +85%. A full exit on a cycle signal is the action those episodes punish. The pause lasts up to 12 months. Only All in and Build end it early. A cross to 20% under the trend does not end it. That earlier ending cut the 2022 coin gain from about +90% to about +43%. At 12 months, if neither All in nor Build has ended the pause, the paused cash becomes cash available that Friday and follows Lump in, Slow in, or Stay the course. The coin replay is 7 of 8, floor about 59%, about six episodes because the 2014 fires overlap each other and the 2018 fires overlap each other. June 2013 got 67% fewer coins. The line also carries the misses: not armed since 2021, silent through 2019–20 and 2025–26.

**Trim needs four inputs, or it stays off.** Coins held, investable net worth, a target share, and a ceiling share. Share is coins times the latest price, divided by investable net worth. Trim turns on when share is at or above the ceiling. It sells down to the target, highest-cost lots first, over about 12 months. It does not turn on again until share is back at the ceiling. While a stand-down pause is on and Trim is on, the sale is to be finished by the end of that pause. That is what "sped up" means. The page does not compute the tax. A taxable sale can create a tax bill. The rate is the holder's.

**Exit turns on only from a dated declaration.** In Settings the holder can record "Thesis broken" with a date. Until that declaration exists, region 2 cannot say Exit. The monitors sit on the long-horizon panel as reading, not as triggers: a lasting hash-rate collapse, a credible break of the signature scheme with no migration path, and prohibition across major markets. A power-law floor band is not defined, so it is listed as undefined and it is not drawn. Exit has no floor and no backtest.

## The rollup

One cash posture each Friday, plus one coin line. No vote count and no average.

Cash, in this order:

The order is All in, then Build, then Stand down, then Lump in, then Slow in, then Stay the course. Build ends a stand-down pause, and the standing contribution resumes. Lump in does not end a pause. A cross to 20% under the trend during a pause does not end it.

Every record line uses the same contract: wins of episodes, then the floor. A weekly percentage does not sit on that line.

1. **All in**, if this Friday is the fire Friday or the first grace Friday.
   Cash available goes in, up to about $100,000. Buy on the day the page is read, or by the second grace Friday's close. The standing contribution continues. If the ratio is below 1, the build slice also runs. The week is not a higher probability. The document dated the second grace Friday is the next posture. On 2 October 2026 that document is Lump in.
   If Stand down is also inside its pause, All in still wins. The sell is shown beside the call as a disagreement. The week is not cut to a half-size buy.
   The line reads: 4 of 4, floor about 60%. Beat a 52-week spread, 4 of 4, +18% to +92% coins. Open episode, if the year is unfinished. Not high confidence.
2. **Build**, if the ratio is below 1 and a tranche is still slicing, and All in is not on.
   Build ends a stand-down pause. The standing contribution resumes. The tranche slices. Paused cash joins cash available. It does not become a second pile.
   If the cross is armed, add the waiting sentence. Cash waiting on the cross still does not move.
   Build's own line: 79% of 91 cheap weeks, 4 spells. Schedule untested. It does not borrow the buy cross's 4 of 4.
3. **Stand down**, if a sell-roll fire is inside its 12-month pause and neither All in nor Build is on.
   Pause the standing contribution and any lump or spread. Hold the coins. The line is 7 of 8, floor about 59%, about six episodes, with the June 2013 loss and the misses named.
4. **Lump in**, if the gap is at least 20% under the trend, the cross is not armed, and none of the rows above are on.
   The line is 6 of 6 finished regimes, floor 69%, and one regime open since November 2025.
5. **Slow in**, if the gap is at least 55% over the trend and none of the rows above are on.
   The line is 2 of 3 regimes, floor 25%. It is the weakest record on the page.
6. **Stay the course**, otherwise.
   Standing contribution only. Between the two gap lines, say that a new lump sum has no measured edge.

Coin line, independent of the cash order:

1. **Exit**, if Settings contains a dated "Thesis broken" declaration. No floor.
2. **Trim**, if share is at or above the ceiling. Sell down to the target. Say "sped up" when a stand-down pause is also on.
3. **Hold**, otherwise.

### What the chart is

1. Price, the power-law trend, the −20% line, the +55% line, and the 200-week average as a map line.
2. The z-score, split into the Bitcoin leg and the gold leg. The gold flag uses the arm-Friday rule above. A year-over-year share is not the flag.
3. The macro-pressure thermometer, labeled non-voting.
4. A marker at each buy-cross fire and each sell-roll fire.
5. The cash posture and the coin line, in the words of the action. A spectrum strip marks where this week sits. Coins run Exit, Trim, Hold. Cash runs Stand down, Stay the course, Slow in, Build, Lump in, All in. It is not a confidence scale. One segment is active on each rail. Exit, and a missing Friday close, leave the cash rail with no active segment.
6. The record, the floor, and the episode count of whichever rule is in force. Open episodes stay open.
7. One realized-price sentence: under cost and slicing, or above cost.
8. On the sell roll, the recall sentence: not armed since 2021, missed 2019–20 and 2025–26.
9. A separate 5-year and 10-year panel with the long-hold base rate, the note that fewer than three independent 5-year windows exist since 2012, the thesis monitors, and the holder's declaration state. ETF flows and corporate treasury buying are named as a 2024 regime. No flow number is shown until a feed is chosen.
10. A one-line fit note when the gap depends on the start year. Not a price target.
11. The latest print, separate from the official Friday call. A developing cross is labeled developing and does not change the posture.
12. At the bottom, the share of each cycle's percentage gain for the buy cross, Build, and Lump in. The yardstick is a hold to the cycle high. The sell roll is not in that table, because it does not sell coins. The 2022 cycle is still open, because the drop from its high has not reached 70%. That block also shows progress at the latest print: the rise from the low so far, the share of the rise to the high that is still in the price, and each signal's gain to the latest print as a share of the rise from the low. The numbers are in `docs/1-signal-quality.md`.

Fear & Greed, reserve risk, VDD, Puell, netflow, funding, and the checklists stay off the chart. A visible dial will get used as a reason to change the pile. Those series lost to owning Bitcoin.

## What 26 September 2026 would say

The worked example is opened on 26 September 2026. The official call is the Friday close of 25 September 2026. The latest print in the example is that same daily close, spot $84,413, so the two clocks match. On a later day the levels can move while this call stays in force until a Friday close changes it. A mid-week cross would be marked developing. It would not be a new fire. The buy cross fired on 18 September 2026, near $81,000. The fire Friday has passed. The first grace Friday, 25 September, has also closed. The last grace Friday is 2 October 2026. The sell roll is quiet: it has not armed since 2021. The realized-price ratio is above 1. The June 2026 low near $60,000 stayed above a realized price near $53,000.

Cash posture: **All in.**

Action: buy now, or by the Friday 2 October 2026 close, up to $100,000 of cash available to invest. It is not split into three slices. It is not drawn from a reserve built to wait for this fire. After that close, the call is whatever that Friday says. If the gap is still about −41% and the cross is not armed, that call is Lump in. The standing contribution continues. Build stays off, because price is about 59% above a realized price near $53,000. Coins already held stay held. Trim is off. Exit is off.

The gap does not enlarge the buy. The missing break under cost does not shrink it. July 2020 was that shape, with a gap of about −18%, and the next year was +269%.

The line beside the action: 4 of 4, floor about 60%. Beat a 52-week spread, 4 of 4, +18% to +92% coins. Open episode. Not high confidence.

Two caveats the earlier four fires did not carry:

- The trend's level is disputed. Peaks over the trend have faded every cycle, and the gap on this date runs from about −29% to −46% depending on the fit's start year, against about −41% on the study's own fit (trend about $141,000, or $142,000 to $147,000 on the external check). The arm holds under every one of those fits. This is the first fire where the model level itself is in question.
- The gold flag is on. The arm was 21 November 2025. From the last week at the 52-week mean, 12 September 2025, Bitcoin fell about 27% and gold rose about 11%. Gold's share of that cheapening was 24.5%, above the 15% cut. The year-over-year figure of about 38% is a different window. The fire week was led by Bitcoin: Bitcoin rose 10.4% in the week to 25 September, and gold was nearly unchanged across September ($4,331 on the 1st, $4,360 on the 21st).

This is a research rule, not a personal instruction. A position of this size should be checked against the holder's full balance sheet by an adviser who has that sheet.

## Left out

| Signal | Why it is not a posture |
| --- | --- |
| Six-rung action | Optional in the quality write-up, and one calendar lost to always buying. Not a vote. |
| Confirmation lift | The cross without the trough. |
| NUPL and MVRV z-score | The same week as the realized-price ratio. |
| Puell Multiple | Weaker cheap-state than the realized price. Pairing them did not help. |
| Supply in profit | Same family. The further-drop claim was not stable. |
| Fear & Greed | Extreme Fear did worse than a random week. |
| Reserve Risk | The 0.002 zone is the usual state, not a timer. |
| VDD Multiple | Green-band weeks matched the base rate. |
| Exchange netflow | No edge. |
| Futures demand | No edge. Funding history starts in 2020. |
| Spot demand | No series good enough to test. |
| ETF flow and corporate treasury buying | From 2024. Context and a regime flag. Not a score. |
| Strategy purchases | From 2020. No tape was scored. |
| Galaxy checklist and Stage Two | Lit at past bottoms by construction. The versions we could compute did not beat holding. |
| Realized-price path | Not a sell. One of three breaks was followed by a down year. |
| Hash ribbons | 16 of 21, floor 59%, and the finished 2025 fires lost. Same floor as the buy cross, with a worse recent record. |
| Mayer multiple under 0.8 | 44% of weeks hit +50%. Weaker than the realized-price flag. |
| Trend exits | The payoff edge over holding is small, few exits bought back cheaper, and tax on long-held coins removes the edge. |
| Macro liquidity | Not tested here. A later test may use it only as a filter on Stand down. |
| Timing reserve | Lost coins against buying as cash arrived, in all four cycles. |
| How far under the trend | Already consumed by the cross and by the gap switch. Not a size knob. |
| Volatility-scaled bands | A new study. The fixed −20% and +55% lines stay until that study is done. |

## What would change this document

- A completed buy-cross year that fails the +50% test. All in has to be re-justified or removed.
- A record that reaches a Wilson 90% floor of at least 80%, which means 11 of 11 or 19 of 20 on the current method. Only then may All in be badged high confidence. The badge still does not change the dollars.
- The same floor for Stand down. It is further away. A pass would still not create a cycle exit. Exit stays on the thesis-break list.
- A replay of the five-Friday spell rule on the 2015 bear, and an arm-to-fire test in coins. Either result can retire the rule it tests. The 2022 case of four Fridays is already inside one spell.
- A new series that beats these postures on the same test, constants frozen first.

## Holder settings this document does not invent

Three numbers change Trim, Exit, and the after-tax score. They are the holder's, and they are not in the signal record.

- Where the coins are held: a taxable account, an IRA, or a fund. Trim and Exit are practical only where a sale is possible.
- Coins held, investable net worth, a target share, and a ceiling share. Until those four exist, Trim stays off. The page does not invent the numbers.
- Whether the holder has dated a "Thesis broken" declaration. Until that exists, Exit stays off.
- Whether "more Bitcoin" is scored as coins, as after-tax dollars, or as dollars with a drawdown limit. This strategy scores coins against steady buying. After-tax dollars wait on the account type. A drawdown limit is not adopted.

## Next tests

Constants stay frozen. The order is:

1. Arm to fire: buy at the arm, wait for the fire, or spread between them, scored in coins. This needs the gold series. It decides whether Lump in and the armed wait disagree.
2. The posture set against steady buying, in coins at 1, 2, and 4 years. After-tax dollars join when the account type is known.
3. The five-Friday spell rule on the 2015 bear. The 2022 boundary is already known: four Fridays do not end that spell.
4. A new arm, scored with the same 15% gold-share rule. The five arms already measured are not refit.
5. Macro liquidity as a filter on Stand down, with the lag-fitting check written down before the result is kept.
6. Volatility-scaled bands in place of the fixed −20% and +55%. That result does not enter this document until it is its own study.
