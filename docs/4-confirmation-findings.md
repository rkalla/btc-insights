# Confirmation findings

Reviewed `docs/goal.md`, `docs/1-signal-quality.md`, and `docs/2-signal-strategy.md` against `docs/3-confirmation-plan.md`. No source document was edited during this audit. No new backtest was run for this audit. The backtest notes were not used to supply a number the quality write-up lacked at the time.

The quoted clauses are from the goal and the strategy as they stood before the external review was merged on 26 September 2026. Those two files, and parts of the quality write-up, have since been rewritten. This file is the audit of the pre-merge text. It is not a grade of the rewritten files. Corrections inside the checks below are corrections of this audit. What was merged is `docs/6-external-review-disposition.md`. The external review itself is `docs/5-claude-design-review-findings.pdf`.

## Audit A

### A1

ID: A1
Verdict: Pass
Quote: "Buy cross | Releases the timing reserve | Power law and z-score together. 4 of 4 completed fires were followed by a year of +50% or better: +127%, +59%, +269%, +138%. The worst dip in the year after the fire was −27%, −12%, −11%, and −9%. Floor about 60%." And: "Completed fires: 24 July 2015, 3 May 2019, 31 July 2020, 17 March 2023. The open fire is 18 September 2026."
Evidence: "4/4 completed crosses. Next year +127%, +59%, +269%, +138%. Floor of the estimate 60%." And: "Completed fires: 24 Jul 2015, 3 May 2019, 31 Jul 2020, 17 Mar 2023. The open fire is 18 Sep 2026, near $81,000." And: "Cross drawdowns were −9% to −27%."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for the dates, the four next-year results, the floor, or the published dip range. The four-figure series −27%, −12%, −11%, and −9% is not itself the published range "−9% to −27%." −12% is not on the quality page. −11% is on that page only as a supply-in-profit further drop.

### A2

ID: A2
Verdict: Pass
Quote: "Sell roll | Pauses every new-money pile | The same two inputs, opposite thresholds. 6 of 8 fires were followed by a flat or down year. Floor about 46%. Two fires were followed by +565% and +85%." And: "Fires: June 2013, April 2014, August 2014, September 2017, March 2018, May 2018, May 2021, December 2021."
Evidence: "6/8 fires were followed by a flat or down year. Floor 46%. Two fires were followed by +565% and +85%." And: "fires in Jun 2013, Apr 2014, Aug 2014, Sep 2017, Mar 2018, May 2018, May 2021, and Dec 2021. It does not print Apr 2013, Dec 2017, Jul 2019, or Mar 2021."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for this check.

### A3

ID: A3
Verdict: Pass
Quote: "Firing on the z-score cross without the trough is the old confirmation lift: 11 of 16, including the 2018, late-2021, and 2025 failures. The trough is what removed those years."
Evidence: "11/16 crosses. Floor 48%. Includes the 2018, late-2021, and 2025 failures. | Confirmation lift | Lift | Do not use. Same cross as the buy rule, without the power-law trough. The trough is what removed the bad years."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for this check.

### A4

ID: A4
Verdict: Pass
Quote: "52-week BTC/gold z-score | The other half of both events. Never its own call." And: "Z-score | Any level | An input to the two events. Not a size."
Evidence: "Keep only as the input to the buy cross. The −90 and +40 levels are not a stand-alone ladder."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for this check.

### A5

ID: A5
Verdict: Pass
Quote: "The map draws the trend, the line 20% under it, and the line 55% over it. Those lines are the tested thresholds. They do not scale the order." And: "Power law | Any gap | Position on the map. Not a size."
Evidence: "Keep as the trend, the bands, and an input to the buy cross. Not as a weekly buy/sell ladder."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for this check.

### A6

ID: A6
Verdict: Conflict
Quote: "Macro pressure (Blend) | Describes the disagreement between the power law and gold. Loses as an action." And: "Six-rung action | The attempt to grade buy-big against buy-small every week. Medium at best, and one calendar lost to always buying."
Evidence: "Keep as a thermometer. It sits near zero when the power law and gold disagree. It is not the action." And: "Optional weekly instruction. Direction is often close. Size is usually one rung timid, and the week you read it changes the grade." The realized-price sentence "That is why this series releases a tranche over months, and never the reserve" was considered against "not as a trigger" and is not part of this conflict. That schedule is A10.
What would have to change: `docs/2-signal-strategy.md` if the thermometer and the optional six-rung stay available as non-voting context, or `docs/1-signal-quality.md` if those two "keep / optional" lines are withdrawn. The conflict is those two rows. The realized-price use is not a second conflict here. "Not a trigger" in the quality write-up is the first-week lump sum, which was right in 2 of 4 spells. Pacing buys while coins are cheap is the plain reading of "coins are cheap." The untested 26-week schedule is A10.

Disposition of each quality row in the pre-merge strategy:

| Quality row | Quality instruction | Strategy |
| --- | --- | --- |
| Macro buy confirmation | Keep, power law and z-score together | Kept as Deploy |
| Macro sell confirmation | Keep as a rough sell, misses in view | Narrowed to a pause of new cash |
| Confirmation lift | Do not use | Dropped |
| Six-rung action | Optional weekly instruction | Dropped. Conflict |
| Bitcoin power law | Keep as trend, bands, and input | Kept as map and input |
| 52-week BTC/gold z-score | Keep only as input to the buy cross | Kept as input |
| Macro pressure | Keep as a thermometer, not the action | Dropped off the chart. Conflict |
| Realized-price ratio, NUPL, MVRV z-score | Coins are cheap across the spell; the first Friday is not a lump-sum trigger; not a veto | One series kept to pace buying while coins are cheap. The untested schedule is A10, not a second conflict on this row. |
| Puell Multiple | Weaker discount state; pairing did not help | Dropped |
| Supply in profit | A tell; the further-drop claim was not stable | Dropped |
| Fear & Greed | Do not use | Dropped |
| Reserve Risk | Context only; does not time entries | Dropped |
| VDD Multiple | Do not use as a buy or a sell | Dropped |
| Exchange netflow | Do not use | Dropped |
| Futures demand | Do not use yet | Dropped |
| One blended on-chain score | Do not build | Dropped |
| Galaxy bottom checklist | Do not feed the rung | Dropped |
| Stage Two composite | Do not feed the rung | Dropped |
| Realized-price path | Not a sell | Dropped |
| Episode strength and cycle capture | Not a signal; the buy-cross record is the test | Not a posture; the lesson is kept in prose |
| Structural map | The level to draw | Kept as the trend and the two lines |

### A7

ID: A7
Verdict: Pass
Quote: "Do not also fetch NUPL or the MVRV z-score. They repeat this series and would look like extra votes."
Evidence: "One flag, not three votes. Below 1, below 0, and a negative z-score are the same week (0 disagreements between the ratio and the z-score)."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for this check. A6 still records that the one remaining series is used as a cash trigger.

### A8

ID: A8
Verdict: Pass
Quote: "Do not delay Deploy until the ratio is below 1, and do not call the combined week high confidence." And: "The build tranche stays locked, because price is not under cost."
Evidence: "Requiring a prior break under the realized price would have dropped July 2020. That gate has not filtered out a loser. It is not part of the quality rule."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for this check.

### A9

ID: A9
Verdict: Extension
Quote: "At the July 2020 fire the gap was only about −18%, and that year was the best of the four (+269%)." And: "The worst dip in the year after the fire was −27%, −12%, −11%, and −9%." And: "It is a real edge over the 29% base rate of down years."
Evidence: "In the fast 2020 crash, waiting also meant paying about twice the trough price." And: "Cross drawdowns were −9% to −27%." And: "Further drop after the cross was −55%, −26%, −11%, and −7%." The published cross-dip wording is a range, not the four-figure series. −11% is on the quality page as one of those supply-in-profit further drops, not as a buy-cross dip. −12% is not on the quality page. The phrase "29% base rate of down years" is not the blend line "29% rung-credit," which is the only 29% in the quality write-up.
What would have to change: `docs/2-signal-strategy.md` if each claim below is removed or marked as outside the quality write-up, or `docs/1-signal-quality.md` if the study actually contains it. This audit did not recompute any of them.

A later external check reproduced the −18% July 2020 gap, the four dips −27%, −12%, −11%, and −9%, a flat-or-down share of 26.9% through May 2025 rising toward 29% once later 2025 entries are included, and Wilson 90% floors of 59.7%, 46.0%, and 48.2%. The numbers were right. They were still additions to the quality write-up when this audit was written, so the verdict stays Extension. The check is now recorded in `docs/1-signal-quality.md`.

Each claim below is absent from the quality write-up except where the note says a different use of the same digits is on the page. No new backtest was run.

- Extension. Quote: "The low end of a 90% interval around that record." The 90% interval is not in the quality write-up. The quality write-up says "the low end of the estimate" and "Floor of the estimate 60%."
- Unverified. Quote: "At the July 2020 fire the gap was only about −18%." That gap is not in the quality write-up. The quality write-up says waiting in 2020 "meant paying about twice the trough price." This review did not recompute the gap.
- Extension. Quote: "The worst dip in the year after the fire was −27%, −12%, −11%, and −9%." That four-figure cross-dip series is not the published range "Cross drawdowns were −9% to −27%." −12% is not in the quality write-up. −11% is in the quality write-up only as a supply-in-profit further drop ("−55%, −26%, −11%, and −7%"), not as a buy-cross dip.
- Extension. Quote: "It is a real edge over the 29% base rate of down years." The 29% down-year base rate is not in the quality write-up. The only 29% there is "29% rung-credit" for macro pressure.
- Extension. Quote: "that action failed the entry test in 2014 and in June 2022." Naming 2014 and June 2022 as failed lump-sum entries is not in the quality write-up. The year 2014 does appear on the page, inside "four spells: 2012, 2014, 2018, 2022" and as the sell-roll fires "Apr 2014" and "Aug 2014." Neither of those uses names a failed lump-sum entry. June 2022 is not on the page. June 2026 is a different date.
- Extension. Quote: "its successes, two years out, were roughly flat rather than a harvested crash." That two-year remark is not in the quality write-up.
- Extension. Quote: "filled forward at most 10 days when the gold market is shut." The 10-day fill is not in the quality write-up. The quality write-up names "COMEX gold futures for the z-score" and does not state a fill rule.
- Extension. Quote: "log10(days since 3 January 2009)." The power-law epoch 3 January 2009 is not in the quality write-up.
- Extension. Quote: "It is not spread over six months, because the test was an entry at the fire." And: "The holding note may remain for 52 weeks: if the reserve was spent on the fire, the tested plan was to keep those coins for about a year." "Not spread over six months" and the 52-week note called "the tested plan" are not in the quality write-up. The quality write-up scores the next 12 months from the fire. It does not forbid a six-month spread, and it does not define a 52-week holding note.
- Extension. Quote: "The first slice is about one twenty-sixth of the tranche." One twenty-sixth is not in the quality write-up.
- Extension. Quote: "using the examples of a $5k standing buy, a $100k build, and a $50k reserve." Those amounts are not in the quality write-up. They are labeled as shapes, which is why the dollar-shape check passes, and they are still numeric claims the quality write-up does not contain.

Figures in the strategy that do match the quality write-up, and are not extensions: 60% of weeks followed by a 50% year, 54% for always-buy-big, 57% rung-credit and a floor of about 40% for the power law, 25% for the z-score ladder, 4 of 4, +127%, +59%, +269%, +138%, floor about 60%, 6 of 8, floor about 46%, +565%, +85%, 11 of 16, blend about +4 against the desk's +7, the blend's 29% rung-credit, 79% of weeks under cost, 2 of 4 first breaks, 91 weeks, trend about $141,000, about 41% under the trend, June 2026 low near $60,000, realized price near $53,000, open fire near $81,000, and cross drawdowns described only as −9% to −27%.

### A10

ID: A10
Verdict: Extension
Quote: "Build is the measured buy." And: "One tranche, sliced across about 26 weeks, and only while under cost." And: "Slicing one tranche across the spell is the action that matches both facts."
Evidence: "Use it as “coins are cheap,” not as a trigger and not as a veto." And: "While price is under the realized price, 79% of those weeks were followed by a 50% year (91 such weeks, four spells: 2012, 2014, 2018, 2022). The first week of the break was right in 2 of 4 bears." A 26-week slice, one tranche per spell, a stop after 26 weeks, and a leftover that returns to cash are not in the quality write-up.
What would have to change: `docs/2-signal-strategy.md` if Build is described only as an untested schedule, or `docs/1-signal-quality.md` if a 26-week rule is actually studied and written down. It cannot stay worded as the measured action.

### A11

ID: A11
Verdict: Extension
Quote: "Putting it in on the fire Friday, with two more Fridays of grace, matches the entry that was tested."
Evidence: "Tested against Bitcoin’s next 12 months." And: "The buy-cross record is the test." The quality write-up scores the fire. It does not score the next two Fridays. The strategy also says the window exists "so a weekly check still catches it," which is grace, and then says that grace "matches the entry that was tested," which treats the extra weeks as tested.
What would have to change: `docs/2-signal-strategy.md`. The two extra Fridays have to be grace only, or `docs/1-signal-quality.md` has to contain a test of buying on those later Fridays.

### A12

ID: A12
Verdict: Pass
Quote: "The dollars are chosen by the viewer, before any signal fires. The signal only names the pile and the speed. The figures below are shapes, using the examples of a $5k standing buy, a $100k build, and a $50k reserve. They are not outputs of the model."
Evidence: not in the quality write-up. The quality write-up contains no $5k, $50k, or $100k result. The strategy does not call those amounts historically optimal.
What would have to change: Nothing in `docs/2-signal-strategy.md` for this check. Audit B still asks whether those shapes meet the goal's $100,000 immediate buy.

### A13

ID: A13
Verdict: Extension
Quote: "The earned sell is a pause: standing buys stop, the build stops, the reserve stays locked." And: "The line carries the record, including the failures: 6 of 8, floor about 46%, and two fires were followed by +565% and +85%."
Evidence: "A sell call is counted right when that year was flat or down." The quality write-up does not score a pause in contributions and does not score a sale of coins. The two failure years are on the same line as the posture, so that part of the check holds. "Earned" still presents the pause as what the study produced.
What would have to change: `docs/2-signal-strategy.md` if the pause is labeled as a product choice rather than the tested sell, or `docs/1-signal-quality.md` if a pause-of-contributions test is added.

### A14

ID: A14
Verdict: Extension
Quote: "If a buy cross fires while a build tranche is still slicing, both run. The week is large because the reserve and a program slice move together." And: "July 2020 fired without being under cost, so that Deploy ran with the standing contribution only, and it was the best completed year."
Evidence: "July 2020 is an extra fire the list left out, and it was the strongest of the four completed years (+269%)." A portfolio that releases a reserve and continues a build is not in the quality write-up. The strategy does not call that combined week a tested hit rate, and it does keep the July 2020 finding. The rule that both piles move is still an added rule.
What would have to change: `docs/2-signal-strategy.md` if the combined week is removed or marked untested, or `docs/1-signal-quality.md` if that portfolio is studied.

### A15

ID: A15
Verdict: Extension
Quote: "High confidence still means a floor of at least 80% on at least eight finished episodes. No rule passes that gate."
Evidence: "Signal Quality uses the low end of the estimate, not the raw win rate. Four wins in four tries is a perfect list and still a Medium grade, because four tries cannot hold an 85% claim. On that standard, Very High and High are empty." The 80% cut and the eight-episode count are not in the quality write-up.
What would have to change: `docs/2-signal-strategy.md` if that gate is removed or labeled as a product rule rather than a study result, or `docs/1-signal-quality.md` if the study adopts that gate.

### A16

ID: A16
Verdict: Pass
Quote: "The base rate the signals had to beat: from 2012 through September 2025, 60% of weeks were already followed by a 50% year. The best constant policy, always buy big, scored about 54% on the five-rung scale."
Evidence: "From 2012 through September 2025, 60% of weeks were already followed by a 50% gain. The best constant instruction, “always buy big,” scores about 54% on the rung scale."
What would have to change: Nothing in `docs/2-signal-strategy.md` or `docs/1-signal-quality.md` for this check.

### A17

ID: A17
Verdict: Pass
Quote: "Of the 26 candidates tested from 2012 through September 2025, two measured inputs carry the timing."
Evidence: "Tested against Bitcoin’s next 12 months." And the quality file is titled against 2012–2026, with finished next-year results only where a year has elapsed. The strategy does not call the scored window "2010 through September 2026." The phrase "A daily USD close from 2010 onward" is about how far back the price series must go so the trend can be refit. It is not a claim that the test starts in 2010.
What would have to change: Nothing in `docs/2-signal-strategy.md` for this check. Audit B2 is the goal's different span.

## Audit B

### B1

ID: B1
Verdict: Refused
Quote: "providing a proven 80%+ confidence indicator of action to take with Bitcoin investment."
Evidence: "Four wins in four tries is a perfect list and still a Medium grade, because four tries cannot hold an 85% claim. On that standard, Very High and High are empty." And the strategy: "The dashboard must not print “80%,”" and "4 of 4 completed fires, floor about 60%. This episode is not counted until its year is finished. Not a high-confidence badge."
What would have to change: `docs/goal.md`. The plan's rule for this clause is specific: Refused if the strategy shows the action and prints a lower floor. The pre-merge strategy did that. That rule beats the general two-way rule, which would have called the same facts a Conflict. The fix sits in the goal, which has to stop calling the action a proven 80%. Badging the 4-of-4 record as 80% would contradict the quality write-up.

### B2

ID: B2
Verdict: Conflict
Quote: "high-value, atomic signals that have stood the test of time since 2010 through Sep 2026"
Evidence: The quality write-up scores finished 12-month results from 2012 through the weeks that still have a finished year, and it leaves "The open fire is 18 Sep 2026" unscored. The strategy's acted-on rule uses that open fire: "The buy cross fired on 18 September 2026, near $81,000, so the issuance window is still open." And "Posture: **Deploy.**"
What would have to change: `docs/goal.md` if the span is the scored window rather than 2010 through September 2026, or `docs/2-signal-strategy.md` if Deploy is withheld until the September 2026 year finishes. Data back to 2010 is not a test that starts in 2010.

### B3

ID: B3
Verdict: Fail
Quote: "proven guidance on times to buy/sell/hold Bitcoin."
Evidence: "A buy call is counted right when that year gained at least 50%. A sell call is counted right when that year was flat or down." The quality write-up does not score a sale of coins and does not score "stay the course" as a signal.
What would have to change: `docs/1-signal-quality.md` if sell-coins and hold are tested and pass, or `docs/goal.md` if "proven" buy, sell, and hold is narrowed to the buy-cross record. `docs/2-signal-strategy.md` cannot pass this clause by renaming a pause or a leftover state.

Buy, sell, and hold, judged separately:

- Buy: Fail as proven guidance. The buy cross has a 4-of-4 next-year record and a floor of about 60%. The quality write-up calls that Medium and says four tries cannot hold an 85% claim. Very High and High are empty.
- Sell: Fail. The study scored whether the next year was flat or down. It did not test selling Bitcoin. Stand down holds "Coins already held."
- Hold: Fail. "Stay the course" is the state left when no event window is open and price is at or above cost. The strategy says it "is not a signal the indicators voted for."

### B4

ID: B4
Verdict: Pass
Quote: "Where appropriate, the Dashboard should assemble higher-value Signal by assembling or synthesizing the atomic signals together to convey a stronger signal."
Evidence: "Keep. This is the power law and the gold z-score used together." The like-for-like comparison is the lift: "11/16 crosses" without the trough, against "4/4 completed crosses" with it. "The trough is what removed the bad years." The z-score's "25% rung-credit" and the power law's "57% rung-credit" are a different scale, so they are not the comparison that passes or fails this clause. "Pairing it with the realized-price flag does not raise the hit rate." And "Do not build" for the blended on-chain score.
What would have to change: Nothing for the buy cross. The plan fails a combination that did not beat its parts and is still used as a stronger signal. Build is one series. Deploy together with Build moves two piles in one week. The pre-merge strategy called that week larger, and it said the week is not a higher probability. It did not claim a stronger signal, so that week does not fail the clause.

### B5

ID: B5
Verdict: Conflict
Quote: "a high level guidance, based on the overall interpretation of all the Signals in the Dashboard"
Evidence: "Do not use" on the confirmation lift, Fear & Greed, and VDD. "Do not build" on the blended score. "Do not feed the rung" on Galaxy and Stage Two. The strategy: "Everything else is left out, because putting it on the chart would pull the viewer off the only rules that beat “just own Bitcoin.”"
What would have to change: `docs/goal.md` if "all the Signals" means only the signals the chart is allowed to act on, or `docs/2-signal-strategy.md` if every tested signal stays on the chart and is interpreted into the directive. The quality write-up's "do not use" lines make the second reading harmful. The documents do not say the same thing.

### B6

ID: B6
Verdict: Fail
Quote: "guiding the viewer towards a spectrum of clear action ranging from “Sell all Bitcoin” to “Go All In”."
Evidence: "There is no fifth posture for liquidating the coin pile." And: "Stand down does not sell coins." And: "The reserve is spent at the fire, spread only across the three Fridays of the issuance window." The quality write-up's sell record is "6/8 fires were followed by a flat or down year" with failures " +565% and +85%." It never tests selling all coins.
What would have to change: `docs/2-signal-strategy.md` if a coin-selling posture and an all-in posture are added, or `docs/goal.md` if the spectrum is redefined as pause-through-deploy. Neither end of the quoted spectrum exists.

Postures against the two ends:

- Stand down: not "Sell all Bitcoin." Coins already held stay held. New cash pauses.
- Stay the course: standing contribution only. Not an end of the spectrum.
- Build: a sliced tranche. Incremental money in. Not "Go All In."
- Deploy: the timing reserve across three Fridays. Not "Go All In" under B7.

### B7

ID: B7
Verdict: Fail
Quote: "Use $100,000 as the rough size of a “Go All In” immediate-buy for the boldest action"
Evidence: not in the quality write-up. The strategy's boldest buy is "a $50k reserve" "Released in three equal slices: the fire Friday and the next two Fridays."
What would have to change: `docs/2-signal-strategy.md` if the boldest buy becomes about $100,000 on the fire, or `docs/goal.md` if that size and the word immediate are dropped. A12's pass on the dollar figures as viewer-chosen shapes does not meet this clause.

### B8

ID: B8
Verdict: Fail
Quote: "a spectrum of variations stepping down from that to indication more incremental steps into or out of Bitcoin"
Evidence: not in the quality write-up. The strategy's steps into Bitcoin are the standing contribution and the build tranche. "The earned sell is a pause." No posture sells down coins already held.
What would have to change: `docs/2-signal-strategy.md` if an incremental sale of coins is added, or `docs/goal.md` if "out of Bitcoin" is redefined as a pause of new buying.

Steps in, judged separately: present. Standing pace, then Build, then Deploy.

Steps out of Bitcoin already held, judged separately: absent. Stand down stops new cash only.

### B9

ID: B9
Verdict: Fail
Quote: "switching to a dollar-cost-average in/out strategy if incremental steps make more sense given what the Signals say."
Evidence: not in the quality write-up. The 79% cheap-state figure is a 12-month hit rate for weeks under the realized price, not a test of a dollar-cost-average schedule.
What would have to change: `docs/1-signal-quality.md` if averaging in and averaging out are tested, or `docs/goal.md` if averaging out is dropped and averaging in is allowed to stay an untested shape. `docs/2-signal-strategy.md` would have to add an averaging-out rule to meet the clause as written.

Averaging in, judged separately: the Build posture is that shape. A10 marks the 26-week schedule as Extension, so this is not a tested average-in.

Averaging out, judged separately: absent. No posture sells coins on a schedule.

### B10

ID: B10
Verdict: Fail
Quote: "maximize investment in Bitcoin over 1, 5 and 10 year time horizons."
Evidence: "Tested against Bitcoin’s next 12 months." The quality write-up does not report a 5-year result or a 10-year result for any posture. The strategy's two-year remark, "its successes, two years out, were roughly flat rather than a harvested crash," is not in the quality write-up. That remark is not a 5-year result and not a 10-year result. A 24-month remark would not be either, even if the quality write-up contained one. The strategy does not refuse the 5-year or 10-year sentence; it never addresses it.
What would have to change: `docs/1-signal-quality.md` if 5-year and 10-year results are produced for the postures, or `docs/goal.md` if those horizons are removed or labeled as hopes. The confirmation plan's word for an untested horizon is recorded here as Fail, because that word is not an allowed verdict.

Horizons, judged separately:

- 1 year: Fail for the postures. The buy cross has next-12-month results (+127%, +59%, +269%, +138%). Deploy, Build, Stand down, and Stay the course do not have their own 1-year tests. Twelve months of the underlying event is not a 1-year test of the cash posture.
- 5 years: Fail. Not in the quality write-up. The two-year remark is not a 5-year result. Not refused in the strategy.
- 10 years: Fail. Not in the quality write-up. The two-year remark is not a 10-year result. Not refused in the strategy.

### B11

ID: B11
Verdict: Conflict
Quote: "The buy cross fired on 18 September 2026, near $81,000, so the issuance window is still open." And: "Posture: **Deploy.**" And: "The line beside the action: 4 of 4 completed fires, floor about 60%. This fire is not part of the 4 until the year finishes. Not a high-confidence badge."
Evidence: "The open fire is 18 Sep 2026, near $81,000." And: "Four wins in four tries is a perfect list and still a Medium grade, because four tries cannot hold an 85% claim."
What would have to change: `docs/2-signal-strategy.md` if the worked example withholds Deploy until the year finishes, or `docs/goal.md` if an open fire may direct cash without being called proven through September 2026. The example does not print 80% and does not add this fire to the 4. It still directs Deploy. Against B1 and B2, that action is not a finished test through September 2026.

## Rulings

These recommend. They do not amend the documents.

### 1. 80%

Recommendation: goal yields.

The quality write-up makes a proven 80% action false. The buy cross is 4 of 4 with a floor of about 60%, and Very High and High are empty. The pre-merge strategy already refuses to print 80% and already shows the lower floor. B1 is Refused. The sentence that has to move is the goal's. Badging the 4-of-4 record to satisfy the goal would falsify the quality write-up.

### 2. Ends of the spectrum

Recommendation: the user has to split the product.

One tested panel cannot contain "Sell all Bitcoin" and a roughly $100,000 immediate "Go All In" and also respect the sell-roll failures at +565% and +85% and the untested dollar amounts. The tested panel is the four postures: pause new cash, standing contribution, sliced build, and a short reserve release. A second panel can show sell-all and a $100,000 immediate buy only if every line on it says the study did not test it. Putting those words on the tested directive would make the goal true by discarding the quality write-up.

### 3. Horizons

Recommendation: the user has to split the product.

The evidence is the next 12 months on the buy cross, plus the quality write-up's note that cross drawdowns inside that year were −9% to −27%. The strategy's remark that sell-roll successes were roughly flat two years out is not in the quality write-up, and it is not a five-year or ten-year result. Five years and ten years have no result. The strategy never refuses them, and the goal requires all three. A tested 12-month line can stay. The 5-year and 10-year purpose can stay only as a hope with no indicator attached. Claiming those horizons from the 12-month record would make the goal true without evidence.

### 4. What "all the signals" means

Recommendation: goal yields.

The goal's phrase "all the Signals in the Dashboard" cannot mean every candidate that was tested. The quality write-up tells the product not to use the lift, Fear & Greed, VDD, the blended on-chain score, or the checklists as inputs to the call, and it says most of the rest lose to owning Bitcoin. The sentence that has to move is the goal's, narrowing "all the Signals" to the decision set. The chart may show the power law, the z-score as an input, the buy cross, the sell roll, and the one realized-price series. The dropped rows stay in the quality write-up. They do not stay on the decision chart.

The remaining strategy concession is A6. The quality write-up said to keep the macro-pressure blend as a non-action thermometer and called the six-rung optional, and the pre-merge strategy dropped both. That concession does not put the "do not use" rows back on the chart. The later merge restores the thermometer as non-voting context and keeps the six-rung off the decision.

## Count

Pass: 11
Fail: 6
Extension: 6
Conflict: 4
Unverified: 0
Refused: 1

Pass is A1, A2, A3, A4, A5, A7, A8, A12, A16, A17, B4. Fail is B3, B6, B7, B8, B9, B10. Extension is A9, A10, A11, A13, A14, A15. Conflict is A6, B2, B5, B11. Refused is B1. No single grade is assigned from this count.

This count is the corrected audit of the pre-merge documents. B1 moved from Conflict to Refused. B4 moved from Conflict to Pass. A6 stays Conflict, and that conflict is the thermometer and the six-rung only. A9 stays Extension after the external check reproduced its numbers. The inner A9 note that once marked the −18% gap Unverified is a note inside an Extension, not a sixth check verdict, so Unverified stays 0.
