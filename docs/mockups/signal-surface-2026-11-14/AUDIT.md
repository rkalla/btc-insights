# Signal surface audit, 14 Nov 2026

Proposal only. The live site is unchanged. Open `index.html` in this folder for the three interactive mockups. Chart shapes in the mockups are schematics. The numbers are the Friday 13 Nov 2026 stamp and the Saturday 14 Nov 2026 live print.

## What the product is for

`docs/goal.md` asks for a page a holder can open any day, on a spectrum from Exit to All in, with the history behind the call. The official action is the Friday close, because that weekly sample is the clock the record was built on. Friday is not a finding that one weekday is better.

Two questions: what to do with new cash, and what to do with coins already held. The score that matters is more bitcoin than steady buying and holding.

## What the research actually kept

`docs/1-signal-quality.md` and `docs/2-signal-strategy.md` tested a wide set of models from 2012 onward. Most lost to always owning bitcoin, or to always buying big. The kept machine is small:

- Power law and the 52-week bitcoin-to-gold z-score, used together as the buy cross and the sell roll. Neither is a weekly ladder on its own.
- The power-law gap as a lump-versus-spread switch (−20% and +55%).
- Realized price as the pace of one tranche while coins are cheap. Not a second timing vote.
- A macro-pressure thermometer that does not vote.
- One cash posture per Friday, chosen by a fixed order. No average and no vote count.
- A bigger action is not a higher probability. High confidence means a Wilson 90% floor of at least 80%. Four wins in four tries sit near 60%.

The original hope of “up to five strong signals, rolled into one confident call” was tested. The blend lost. The six-rung weekly ladder was calendar-sensitive and stayed off the decision.

## What the live site shows

Home, https://btcfriday.app/, on 14 Nov 2026:

- Headline “A good time to add to Bitcoin.” Scale step Add. Coins stay held.
- Why is one sentence: about 55% under the long-run trend, and putting money in at once beat spreading it in 6 of 6 finished stretches.
- Price $65,590, labeled as moving every day while the Friday advice stays put.
- No chart, no z-score, no realized price, no buy-cross date, no gate list.

Evidence, `/evidence/`:

- Prose panels, one log-price chart with the trend, and “Show the numbers” disclosures.
- Context rows exist in `friday.json` (buy cross fired 18 Sep 2026, gold flag, thermometer about +4, sell roll quiet, realized price “no print”).
- They are not drawn as their own charts, and the home page does not link into a specific one.

`live.json` the same hour: spot $65,590, gap about −55%, Friday trend about $145,800, realized ratio 1.22 as of 13 Nov, gold about $3,880, developing z-score labeled as not an official fire. The Friday document’s realized row still says the cost print has not arrived.

## Where this drifts

1. The human-first revision (`docs/17-human-first-implementation-plan.md`, issue #18) made the home a 680px essay so a holder could see what to do in five seconds. That part works. It also made every supporting block look like the same kind of prose, so a computed gate, a standing warning, and a live price cannot be told apart.
2. Evidence never became the place you open the call. It is a second essay with one picture of the power law.
3. The reason this week is Add, and not Buy strongly, is invisible. Buy strongly is the fire Friday (18 Sep 2026) and the first grace Friday (25 Sep). That window is over. Price being 55% under the trend does not reopen it. The cross is not armed, so the −20% gate says Add.
4. Realized cost is above 1, so the weekly build slice is off. The Friday file and the live file disagree about whether that print exists.
5. The synthesis the early goal imagined, and the synthesis the study kept, are different. The page currently shows neither one clearly.
6. QQE weighted oscillator is not in the model. The 12 Nov 2026 post by James Easton shows LuxAlgo’s QQE on a two-week bitcoin chart and says “100% hit rate since 2012.” That is the same class of in-sample claim the study refused for other bottom checklists. It can be watched. It cannot vote until it is scored on the same 12-month, Wilson, episode, and coins-versus-steady tests.
7. Projection is unpublished on purpose. The copied cycle shape was rejected. A replacement anchored to signals that can actually be projected has not been chosen.

## Why the call is weekly

This is not a server limit. The record is one reading a week, because gold shuts and because overlapping daily samples would inflate the win rate. Arming, firing, and the official posture change at the Friday close only (00:00 UTC Saturday). The power-law fit is not redone until that close. A daily official call would be a new study: different fires, a different record, and the published floors would no longer apply.

What can already move between Fridays, and partly does: the spot, the gap against Friday’s trend, a developing z-score, and the realized ratio. `live.json` is rewritten about every 10 minutes. The page uses that for the price line and almost nothing else. A developing condition that would have fired, had today been Friday, is allowed to be labeled developing. It must not move the stamp.

## What blocks a change

- Locked sentences and the posture order in `docs/2-signal-strategy.md`, the Evidence wireframe, and the human-first decisions marked as settled.
- A holder-visible behavior change needs an issue, then a pull request, under `docs/12-tech-stack-approach.md`.
- The This-week bundle must stay under 51,200 gzipped bytes, with no market host and no chart library on that page.
- The browser does not call an exchange. It reads two JSON files. Settings stay on the device.
- Coin Metrics community data is not a live feed. The live gold quote must not arm or fire.
- Printing “confident” on four episodes would break the confidence contract.
- Averaging QQE in with the power law would repeat the chain-blend result: a smoother picture and a worse decision.

## Three pivots

Nothing here replaces the Friday stamp or adds a vote.

**A. The desk.** Home is the call beside the instruments that produced it, each badged Votes, Pair only, Sets pace, Closed, or Watched. Models is one chart at a time plus the gate stack. Smallest step from the current painter.

**B. Two clocks.** The top of the page refreshes on load and cannot change the stamp. The bottom is the Friday call, drawn as the gate order with one gate filled. Evidence is a model library. Clearest answer to “why isn’t this daily?”

**C. Atlas.** One shared time axis from 2012 to now. The posture is a ribbon. Each input is a lane. QQE is dashed until scored. Evidence is an opened lane at `/atlas/power-law` and the same for gold, realized, and QQE. This route is allowed to be heavier than 51 KB. The phone call page keeps the budget.

Recommended build, if one is chosen later: the desk’s badges and gate stack, the two-clock split on the home page, and the atlas as the model route. Keep the painter and the two JSON files. Add the missing series (z history, realized history, and later QQE) to the Friday file. Do not rebuild the site in a charting product, and do not let an unscored oscillator move the call.

## Routes worth having

- `/` the stamped call, with the live tape marked as live
- `/models/power-law`, `/models/gold`, `/models/realized`, `/models/buy-cross`, `/models/sell-roll`
- `/models/qqe` watched, no gate
- `/call/2026-11-13` a past stamp

## Not proposed

A daily official call without a new study. An average of five indicators. A confidence meter that grows because the gap is wide. QQE inside the rollup on the strength of the post. A TradingView-style terminal that hides the record, the floor, and the episode count.
