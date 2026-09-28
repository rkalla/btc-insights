# Human-first revision plan

> **For agentic workers:** Execute this file with `/execute-plan docs/17-human-first-implementation-plan.md`. The `## PR Plan` at the end is the DAG that skill parses. Implement one pull request at a time, from the sections named in that pull request. Do not implement the pages in the same change that adds this file. This revision is tracked by one issue, [#18](https://github.com/rkalla/btc-insights/issues/18). Do not open another issue for these pull requests. Earlier pull requests contain `Refs #18`. The pull request that makes This week the public home page contains `Fixes #18`. Review fixes stay on #18.

**Status:** Shipped. 27 September 2026. A later restyle overrides the dark Evidence theme and the Evidence wording rule. That work is `docs/19-restyle-implementation-plan.md` and issue [#28](https://github.com/rkalla/btc-insights/issues/28).

**Goal:** Make `btcfriday.app` answer three questions in five seconds: what to do, by when, and how sure. Today's dashboard stays one click away, and the signal rules stay as they are.

**Spec:** Layout, type, and color for the new page are `docs/16-claude-human-first-revision-design-spec.html`. The work order and the glossary are `docs/15-claude-human-first-revision-spec.md`. This plan wins wherever those two disagree with a decision below. Evidence keeps the dashboard from `docs/13-implementation-plan.md`, amended only where this plan says so. Postures and records come from `docs/2-signal-strategy.md`. Deploys follow `docs/deploy.md`.

## Authority

When sources disagree, use this order:

1. This plan, for the This week sentences, the five decisions, and the real stack.
2. `docs/16-claude-human-first-revision-design-spec.html`, for spacing, type, color, and the order of regions on This week. Do not ship its preview bar. Do not ship its Google Fonts link.
3. `docs/15-claude-human-first-revision-spec.md`, for the Evidence glossary, the Settings label table, and the banned-word list, except where a sentence in this plan replaces one.
4. `docs/2-signal-strategy.md` and `docs/7-friday-wireframe.md`, for any record or posture rule this plan does not restate. Evidence keeps that wireframe except for the label changes in PR 5.
5. `docs/12-tech-stack-approach.md`, for the stack: a static painter, two JSON files, no React, self-hosted fonts, a 10-minute cache, and a JavaScript job.

`docs/15` tells the implementer to stop if the engine is not Python, the site is not Vite and Preact, or the pages are not prerendered. Those three guesses are wrong. Do not stop, and do not rebuild the stack. The weekly file is written by the Node job. The site is the esbuild painter. `index.html` is a shell that fetches JSON and paints. Settings stay in `localStorage` under `btc-insights.settings.v1`.

## Decisions

These were settled on 27 September 2026. Do not reopen them in code.

| Topic | Decision |
| --- | --- |
| Home page | This week, light, one column, max 680 px. `/` and `/index.html` both serve it once PR 5 deploys. |
| Evidence | Today's dashboard, still dark, at `/evidence/`. Plainer labels, a glossary, and the chart fixes. The spectrum rails stay in their current order until PR 5 removes them. |
| Buy strongly | The set-aside money went in at once and beat spreading it over a year, all 4 times. 4 is a small number (about 6 times in 10). The tiles stay: +127%, +59%, +269%, +138%, and 2026 in progress. "19 times in 20" is not on This week. |
| Add each week | About 79% of 91 weeks were up at least 50% a year later, across 4 stretches. The weekly pace was not tested. "90 of 91" is not on This week. |
| Take-profit price | The latest price, the same share math as today. It can change during the week. The sale still spreads over about 12 months, or by the pause end if a pause is on. |
| Settings hints | Remove "about $5,000" and both "about $100,000" lines. A blank field says Not set. |
| Public site | When the checks pass, This week becomes the home page on `btcfriday.app`. The five-person test happens after deploy. A failure changes copy before layout. |
| Pause ending | The pause ends on Buy strongly or Add each week, or on the end date. The end date does not promise a purchase. That money follows whatever the page says that day. |
| Gold flag | "Part of this move was gold rising, not only Bitcoin falling. The instruction stays the same." Do not say "weaker." |
| Getting close | Extra cash waits. The wait is labeled untested. |
| Stand down count | 7 of 8, about six stretches, because the fires overlap. |
| Brand, alerts, louder card | Keep BTC Friday. No alerts. The verdict card stays calm. |
| Clock display | Format in the viewer's zone and say "your time." Do not prerender Phoenix. Unit tests still cover America/Phoenix, America/New_York, Europe/London, and UTC. |

## Goals and non-goals

**In this plan**

- The full Friday price path and a drawn 200-week line on the chart the site already has.
- Day names on the Friday gap and the live gap.
- A This week page whose words are the copy deck below.
- Evidence at `/evidence/`, with the glossary and the plainer labels.
- Settings labels, with the shape hints gone, and amounts from this device shown on This week.
- A deploy of the chart fix first, then a deploy that makes This week the public home page.

**Not in this plan**

- New signals, a new gold series, re-dated fires, or a new Friday document past 25 Sep 2026.
- Vite, Preact, React, a charting library, a Python publisher, Google Fonts, or prerendered HTML.
- Alerts, login, server-side holdings, a broker, or a tax rate.
- The six studies under "Next tests" in `docs/2-signal-strategy.md`.
- Rewriting `docs/goal.md`, `docs/1-signal-quality.md`, `docs/2-signal-strategy.md`, or `docs/13-implementation-plan.md`.

## Stack and routes

Keep `src/painter`, `src/client`, `src/job`, `friday.json`, and `live.json`. Add `src/copy/thisWeek.ts` for the words and `src/compose/plain.ts` for the facts the words fill in. The painter does not fit a power law and does not choose the posture.

| Path | Page | When |
| --- | --- | --- |
| `/this-week/` | This week, for review | PR 3. Not linked from the public home yet. |
| `/`, `/index.html` | This week | PR 5 deploy |
| `/evidence/` | Today's dashboard | PR 5 |
| `settings.html` | Settings | Path stays. Labels change in PR 4. |

`scripts/build.mjs` emits `dist/this-week/index.html` in PR 3 and, in PR 5, emits `dist/index.html` as This week and `dist/evidence/index.html` as the dashboard. nginx already serves `index.html` for a directory. No new rewrite rule.

The phone still never calls a market API. The visible tab still refetches `live.json` no more often than every 10 minutes. A hidden tab does not poll. Official cash posture, record, and rails still change only when `friday.json` changes. Take-profit is the exception: it uses `live.spotUsd` and may change between Fridays.

Geist stays the self-hosted files already in `public/fonts` (weights 400, 500, 600, 700). Where the reference asks for weight 650, use 600. This week does not use the monospace face. Each HTML page's gzipped HTML+CSS+JS, excluding fonts, stays under 51200 bytes. `friday.json` gzip stays under 20480 bytes.

## Chart fix

The live `friday.json` chart has 15 weekly points, the fires plus 4 Jan 2013 and 25 Sep 2026. The price line therefore skips the 2022 low and the 2025 high. `sma200w` is one point, so the legend's 200-week line does not draw. `buildFriday` already keeps every Friday and samples the trend every four weeks. The shipped fixture was hand-thinned, and the Friday job will not replace it while the published record stays on 2026-09-25.

PR 1 commits a fixture that matches what `buildFriday` would emit, with these pins:

- Every Friday from 2013-01-04 through 2026-09-25 is in `chart.weekly`.
- The 2026-09-25 close in that series stays 84413, the locked page spot. The history file's print that day is about 84062. Do not "correct" the page spot.
- The 2026-09-25 trend value stays 141000, lower 112800, upper 218550.
- Earlier trend, lower, and upper points are the fit sampled at least every four weeks, plus the last Friday.
- `sma200w` is the 200-week mean at each Friday once 200 Fridays exist. It starts in 2014 and has more than one point. The mean may use the history close on 2026-09-25. Do not pin that mean to the fixture's old 64000.
- Cash word, record rows, fires, cycle cards, and the official close date stay as they are.

Checks: at least 700 weekly points; the 25 Nov 2022 close is under $17,000; the 3 Oct 2025 close is over $120,000; the 200-week path has more than one point; `friday.json` gzip is under 20480 bytes.

On the current page, the Now gap label reads "Now, against Friday's trend". The fit caveat begins "At Friday's close (25 Sep 2026), gap about −41%". Do not reorder the spectrum. Do not change "Use your cash available to invest" in this pull request. This week replaces that sentence later.

Deploy this fixture to `/var/www/html/data/friday.json` with mode 640 and group `www-data`. `scripts/deploy-site.sh` excludes `data/`, so copy that file on purpose. Do not delete `live.json`. Do not let the Friday job regenerate the document.

## Presentation facts

Add `presentation` to the Friday document. Existing fields keep their meaning. The client reads `presentation` and does not scrape numbers out of sentences.

```ts
interface PresentationFacts {
  schema: 1;
  buyStrongly: { wins: 4; total: 4; tenths: 6; worstDipPct: 27 };
  lumpIn: { wins: 6; total: 6; tenths: 7; openSinceLabel: "November 2025" };
  build: { up50Pct: 79; weeks: 91; stretches: 4 };
  slowIn: { wins: 2; total: 3 };
  standDown: { wins: 7; total: 8; stretchesAbout: 6 };
  history: { year: number; fireDate: string; oneYearPct: number | null }[];
}
```

`history` is the five buy crosses already on the page: 2015-07-24 / 127, 2019-05-03 / 59, 2020-07-31 / 269, 2023-03-17 / 138, and 2026-09-18 / null. `src/copy/thisWeek.ts` exports `COPY_WRITTEN_FOR` equal to those counts. A test fails when `presentation` changes and the constant does not.

`plain.ts` builds the view for one state:

- Step from the cash posture: `ALL_IN` Buy strongly, `LUMP_IN` and `BUILD` Add, `STAY` Steady, `SLOW_IN` Go slow, `STAND_DOWN` Pause, `NO_NEW_BUY` Pause, missing close no step.
- `addMode` is `AT_ONCE` for `LUMP_IN` and `WEEKLY` for `BUILD`, otherwise null.
- Gold flag is on when a caveat has kind `gold`.
- Getting close is on when `armedWait` is true and the posture is `LUMP_IN`, `BUILD`, or `STAY`.
- Replaces-pause is on when `standDownPause` is true and the posture is `ALL_IN` or `BUILD`.
- Deadline is `cash.window.lastGraceCloseUtc` for `ALL_IN` only.
- Pause end is twelve calendar months after the stand-down fire date when that date is on the document. The current week has no stand-down, so the field is null there. A stand-down fixture supplies `2026-03-06` and the end date `2027-03-06`.
- Latest price and its time come from `live.json`. Share and the trim amount use that price, not Friday's close.
- Out of date is on when `missingClose` is true, or when the clock is more than six hours past `nextClose` and the loaded Friday is still the previous one. The Evidence 26-hour stale print stays a separate state.

Slice: when the build amount is set, `{slice}` is that amount divided by 26. Over $1,000, show three significant figures. Otherwise show the nearest dollar. When it is blank, the words are "a small, fixed amount". The page already says the pace was not tested.

Trim, with the latest spot `S`, coins `C`, investments `W`, target percent `T`: share is `C * S / W`, amount to sell is `C * S - (T / 100) * W`, coins to sell is that amount divided by `S`. The 1e-6 tolerance stays. At `S = 84413`, `C = 1`, `W = 470000`, `T = 10`, ceiling 15, the share is 18% and the sale is about $37,400 (about 0.44 bitcoin). At `S = 100000` the share is 21% and the sale is about $53,000. Ceiling comparison still uses the latest price.

## Copy deck

`src/copy/thisWeek.ts` owns every word below. Components fill `{placeholders}` and do not invent sentences. Percentages are whole numbers. Say "about" where the deck says about.

### On every state

| Part | Words |
| --- | --- |
| Update line | This week's advice, set {updatedShort}. Next update {nextUpdate} your time. |
| Short disclaimer | Research, not personal financial advice. |
| Under the scale | This shows what to do, not how sure we are. |
| Track label | Track record: |
| Chip when there is no deadline | Holds until {nextUpdateShort} |
| Prompt when the amount that state uses is blank | Want this in dollars? Add your amount in Settings. It stays on this device. |
| Last risk line, except Sell | Only use money you won't need for a few years. |
| Under the price | Prices move every day. The Friday advice stays put. Selling some Bitcoin can turn on during the week if your share crosses the limit you set. |
| Evidence link | See the evidence behind this. |
| Evidence subline | Charts, the rules, and every past signal. |
| Footer | BTC Friday is research, not personal financial advice. It looks at Bitcoin's price history, and history can be wrong about the future. It doesn't know your full situation, doesn't trade for you and doesn't calculate taxes. Before investing money you can't afford to lose, talk to a fee-only financial adviser. |

Blank cash reads "the money you've set aside". A set regular buy adds ` ($200 a week) ` or ` ($200 a month) ` with the leading space, using the saved amount. Times use the viewer's zone, lower-case am and pm. A local time of 00:00 shows as the day before "at midnight". Days left are local calendar days. Zero reads "Due today". After the deadline and before the out-of-date banner, the chip reads "Updating soon".

A deadline of `2026-10-03T00:00:00Z` is Friday, Oct 2, 5:00 pm in America/Phoenix; Friday, Oct 2, 8:00 pm in America/New_York; Saturday, Oct 3, 1:00 am in Europe/London; and Friday, Oct 2 at midnight in UTC. From Sun, Sep 27, 2:14 pm in Phoenix the chip reads "5 days left".

### Buy strongly

| Part | Words |
| --- | --- |
| Headline | A strong week to buy Bitcoin. |
| Under the headline | Keep any Bitcoin you already own. |
| Track record | The set-aside money went in at once and beat spreading it over a year, all 4 times. 4 is a small number. |
| Chip | {daysLeft} |
| What to do | Put {amount} into Bitcoin by {deadline} your time. Keep your regular buys going{regularNote}. |
| After the list | After that, this page switches to the next week's advice. |
| Why | On {fireDate}, our strongest buy signal turned on. Before this, it had turned on only 4 times: in 2015, 2019, 2020 and 2023. Those 4 times, putting the money in at once beat spreading it over the next year. A cautious reading is about 6 times in 10 or better. |
| Has this worked | Yes, all 4 times, against spreading the same money over a year. That's too few to be sure. A cautious reading is about 6 times in 10 or better. Treat it as a strong hint, not a promise. |
| Tiles | 2015 +127%, 2019 +59%, 2020 +269%, 2023 +138%, 2026 In progress. Caption: Bitcoin's price one year after each signal. |
| What could go wrong | After past signals like this, Bitcoin still dropped as much as 27% below its signal-day price at some point in the next year. It has fallen 20% or more at some point in every year since 2012. |

### Add, at once

| Part | Words |
| --- | --- |
| Headline | A good time to add to Bitcoin. |
| Under the headline | Keep any Bitcoin you already own. |
| Track record | Putting the money in at once beat spreading it over a year in all 6 finished stretches. One stretch is still open. |
| What to do | Put {amount} into Bitcoin when you have it. There's no need to spread it out. Keep your regular buys going{regularNote}. |
| Why | Bitcoin is about {gap}% below its long-run trend. In stretches like this, putting money in at once beat spreading it over a year in all 6 finished cases. A cautious reading is about 7 times in 10 or better. |
| Has this worked | Yes, in all 6 finished stretches. That's still a small number. A cautious reading is about 7 times in 10 or better. This stretch began in November 2025 and hasn't finished yet. |
| What could go wrong | Bitcoin can keep falling after you buy. It has fallen 20% or more at some point in every year since 2012. |

### Add, each week

| Part | Words |
| --- | --- |
| Headline | Bitcoin is cheap. Add a little each week. |
| Under the headline | Keep any Bitcoin you already own. |
| Track record | Bitcoin was up at least 50% a year later in about 79% of 91 weeks like this, across 4 stretches. The weekly pace was not tested. |
| What to do | Add {slice} to Bitcoin this week, and each week while it stays this cheap. Keep your regular buys going{regularNote}. |
| Why | Bitcoin is trading below what the average holder paid for it. That has happened in 4 stretches since 2012. In those stretches, Bitcoin was up at least 50% a year later in about 79% of 91 weeks. |
| Has this worked | Yes, on that 50% test. The 91 weeks come from 4 stretches, and weeks close together move together. The weekly pace was not tested. |
| What could go wrong | Cheap can get cheaper. In past stretches, the price sometimes kept falling for months before it turned. Adding a little each week spreads that risk out. |

### Steady

| Part | Words |
| --- | --- |
| Headline | A normal week. Keep your regular buys. |
| Under the headline | Keep any Bitcoin you already own. |
| Track record | None needed. This is the normal plan. |
| What to do | Keep your regular buys going{regularNote}. Have new money to invest? History shows no clear winner in weeks like this, so put it in now or spread it out, whichever you prefer. |
| Why | Bitcoin is {gapWords} its long-run trend, which is within its normal range. None of our buy or caution signals is on. |
| Has this worked | Nothing to test this week. There's no special signal, so there's no record to show. Regular buying is the default plan. |
| What could go wrong | Bitcoin can fall 20% or more at any time. It has, at some point, in every year since 2012. |

### Go slow

| Part | Words |
| --- | --- |
| Headline | Prices are stretched. Go slow with new money. |
| Under the headline | Keep any Bitcoin you already own. |
| Track record | Worked 2 of 3 times, our weakest record. |
| What to do | Spread any new lump sum evenly over the next 12 months. Keep your regular buys going{regularNote}. |
| Why | Bitcoin is more than 55% above its long-run trend. At times like this, spreading new money out did better than investing it at once in 2 of 3 cases. |
| Has this worked | 2 of 3 times. With only 3 cases, we can't say it beats a coin flip. Treat it as a hint, not a rule. |
| What could go wrong | If prices keep rising, spreading out means paying more for some of your Bitcoin. |

### Pause

| Part | Words |
| --- | --- |
| Headline | Pause new buying for now. |
| Under the headline | Keep any Bitcoin you already own. |
| Track record | Pausing got more Bitcoin for the same money 7 of 8 times. Those overlap, so count about six stretches. June 2013 was the miss. |
| What to do | Pause new buys, including your regular ones. Keep that money somewhere safe that pays interest, such as Treasury bills or a high-yield savings account. This pause ends when the page says Buy strongly or Add each week. If neither has happened by {pauseEnds}, that money is available again and follows the advice that day. |
| Why | On {pauseDate}, our caution signal turned on: after a big run-up above its long-run trend, Bitcoin fell 10% from its peak. Pausing and buying later got more Bitcoin for the same money in 7 of 8 cases, about six stretches. |
| Has this worked | 7 of 8 times, about six stretches. In June 2013, pausing missed a large rise. The signal also stayed off before two big drops, in 2019–20 and 2025–26. A 12-month pause has not been tested on its own. |
| What could go wrong | Pausing can mean buying back at a higher price. In 2013, it meant missing a large rise. |

### Sell, the viewer's decision

| Part | Words |
| --- | --- |
| Headline | Stop buying, and sell your Bitcoin. |
| Under the headline | You've told us Bitcoin's long-term case is broken. |
| Track record | None. This follows your decision, not a market signal. |
| What to do | Sell the Bitcoin you hold. Selling can create a tax bill, so check with a tax adviser first. Stop new buys, including your regular ones. |
| Why | On {declaredDate}, you said in Settings that you no longer believe in Bitcoin's long-term case. |
| Has this worked | There's no record for this. It's your decision, not a signal, so there's nothing to test. |
| What could go wrong | If you change your mind, you may buy back at a higher price. You can undo this in Settings. |

No "Only use money you won't need for a few years" line on Sell. An IRA account drops the tax-bill sentence.

### No update

| Part | Words |
| --- | --- |
| Scale | No step marked. Under it: No step is marked this week. |
| Headline | No update this week. |
| Under the headline | Keep any Bitcoin you already own. |
| What to do | Keep your regular buys going{regularNote}. Check back later. We'll update as soon as the data comes through. |
| Why | This week's price data didn't arrive, or it failed our checks. We won't guess. |
| What could go wrong | Bitcoin can fall 20% or more at any time. It has, at some point, in every year since 2012. |

Track record and "Has this worked before?" are omitted.

### Modifiers

| Modifier | When | Words |
| --- | --- | --- |
| Getting close | Armed, and the state is Add at once, Add each week, or Steady | Callout: Our strongest buy signal is set up and has not turned on. Extra cash waits. This wait has not been tested. Extra why: Bitcoin has fallen far enough against gold, and below its trend, to set up our strongest buy signal. It turns on when Bitcoin's price in gold climbs back to its one-year average. |
| Gold | Gold caveat present, on Buy strongly | Extra why: Part of this move was gold rising, not only Bitcoin falling. The instruction stays the same. |
| Take some profit | All four trim inputs are set and the latest-price share is at or above the ceiling. Never with Sell or No update. | Under the headline: Take some profit: sell part of your Bitcoin. Extra what to do: Sell about {trimUsd} of Bitcoin (about {trimBtc} bitcoin) to get back to {target}% of your investments. Sell the coins that cost you the most first, over about 12 months. Selling can create a tax bill. During a pause, add: Finish by {pauseEnds}. Extra why: Bitcoin has grown to {share}% of your investments, above the {ceiling}% limit you set. This uses the latest price, so it can change before Friday. |
| Buy replaces a pause | Buy strongly or Add each week while a pause is still running | Second line: An earlier signal said to pause. This week's buy signal replaces it. The regular-buy line becomes: Restart your regular buys{regularNote}. |
| Out of date | The out-of-date rule above | Banner: This page hasn't updated since {updated}. Don't act on it until it does. Hide the update line and the timing chip. |

## This week page

One column, phone first, at most 680 px, same order at every width: header, update line, verdict, What to do, Why, Has this worked before?, What could go wrong, Bitcoin today, evidence link, footer. `docs/16-claude-human-first-revision-design-spec.html` is the spacing and color source. Use its tokens (`--paper` `#F7F6F2`, `--buy` `#1F5ED6`, `--caution` `#A5520E`, and the rest of that table). Blue means buy. Amber means caution. Do not use red or green.

The headline is the only `h1`. The scale is an `ol` labeled "Advice scale, from most cautious to most eager", with `aria-current="step"` on the current step. The current step's name is printed. Color does not carry the meaning alone. The line under the scale says the scale is not a confidence meter.

Bitcoin today shows the latest price and the day and time of that price. It does not show a gap percent.

Loading is the header plus the sentence "Loading this week's advice." No posture word, no fake price, no shimmer. A failed first load says "The advice could not load. Nothing here is a call." and offers Try again. A later poll failure keeps the last page. No toasts. No order button. No chart. No tooltip.

Without JavaScript, the shell reads "This week needs JavaScript to show the advice."

Banned words, whole word, case-insensitive, fail the test if any rendered state contains one:

```ts
export const BANNED_THIS_WEEK = [
  "z-?score", "floor", "wilson", "episodes?", "regimes?", "postures?", "tranches?",
  "arm(ed|s)?", "fire[sd]?", "firing", "cross(es|ed)?", "roll", "reali[sz]ed",
  "thermometer", "gap switch", "official close", "prints?", "utc", "trend band",
  "cycle capture", "all[ -]in", "lump in", "slow in", "stand[ -]down",
  "stay the course", "mvrv", "power law", "sigma", "standard deviation", "dca",
  "hodl", "basis points?", "grace",
  "guaranteed?", "risk-free", "can'?t lose", "safe bet", "will rise",
  "19 times in 20", "90 of 91",
];
```

Also fail if rendered text contains `{`, `undefined`, `NaN`, or `null`, or if a copy-deck sentence is longer than 25 words. "All in" is banned as ordinary English too. Write "at once".

## Evidence

PR 5 moves the current painter to `/evidence/` and changes these labels. The dark theme stays. The numbers stay.

- `h1`: The evidence behind this week's advice. Under it: This page shows the rules and history behind This week. It uses some technical terms, and each one is explained at the bottom.
- Header structure matches This week: BTC Friday, tabs, Settings. The bar uses the dark tokens.
- The spectrum rails are removed.
- The large cash word is the step name from the mapping in Presentation facts. Under it, small text names the rule: "Rule: All in, from the buy cross", "Rule: Lump in", "Rule: Build", "Rule: Stay the course", "Rule: Slow in", or "Rule: Stand down". A missing close shows "No update" with "Rule: No call" under it. Coins shows Keep, with "Rule: Hold" under it. Exit and Trim keep their own sentences.
- Region labels, without the numbers: New money, Bitcoin you own, Things to know, The readings behind the call, The long view, How early each signal was.
- Chart legend: Bitcoin price (Friday closes), Long-run trend, 20% below trend, 55% above trend, 200-week average, Buy signal, Caution signal.
- The first use of each glossary term links to its entry. No hover tooltips.
- Footer matches This week.
- The glossary is the table in `docs/15-claude-human-first-revision-spec.md` under "Glossary", as a `dl` headed "What the terms mean".

The Friday gap and the live gap keep the day names from PR 1.

## Settings

Fields and the storage key stay. Change labels, help, and the intro only.

Intro: These amounts personalise This week. They stay on this device and are never sent anywhere. BTC Friday never places orders.

| Current heading | New heading | Help |
| --- | --- | --- |
| Standing contribution | Regular buy | The amount you put into Bitcoin on a schedule, whatever the market does. |
| Build tranche | Extra for cheap stretches | Money you'd add a little at a time, each week, while Bitcoin trades below what the average holder paid. |
| Cash available to invest | Money set aside for Bitcoin | Money you'd put in when This week says Buy strongly or Add, or spread out when it says Go slow. |
| Trim | Take profits | Tell us what you hold, and This week will say when Bitcoin has grown too big a part of your investments. Leave any field blank to turn this off. |
| Thesis broken | I've decided Bitcoin's long-term case is broken | Turn this on only if you've decided to get out of Bitcoin for good. This week will then tell you to sell and stop buying. You can turn it off at any time. |
| Taxable, IRA, Fund | A regular (taxable) account; A retirement account (IRA); A fund | BTC Friday doesn't calculate taxes. This only decides whether tax reminders appear. |

Delete the three "Shape, if you have not chosen" hints. Placeholders stay "Not set". The ceiling hint stays "Must be above your target." The back link reads "Back to This week" and goes to `index.html` after PR 5. Until then it still returns to the dashboard. Save does not say the settings were stored on a server.

## Tests

- Fixture: weekly length, the 2022 low, the 2025 high, the 200-week series, the pinned 84413 close, the pinned 141000 trend, gzip under 20480, cash word still All in.
- `COPY_WRITTEN_FOR` matches `presentation`.
- One render per state and per modifier. Exact strings from the copy deck. Banned words, leftover braces, and the 25-word limit.
- Trim math at spot 84413 and spot 100000. A blank trim field leaves the line off.
- Time formats for the four zones and the Phoenix "5 days left" case.
- Step mapping for every cash posture.
- Playwright at 320, 390, and 1440 for This week in the current All-in state, and at 390 and 1440 for Evidence. No horizontal scroll at 320. axe-core reports no violations. One `h1`. The scale's current step has `aria-current="step"`.
- After filling Settings, no request URL or body contains the amounts.
- The page bundle still contains no `coingecko`, `coinmetrics`, `api_key`, or `fonts.googleapis.com`.
- Budget script stays under 51200 gzipped bytes per page, fonts excluded.

The five-person test is not a CI gate. After the home page deploys, five people who don't invest, one at a time, on a phone: show `/` for five seconds, hide it, ask what to do, by when, and how sure. Pass is at least 4 of 5. Write down their words on #18. On a failure, change `src/copy/thisWeek.ts` and retest before moving layout.

## Work log

Issue [#18](https://github.com/rkalla/btc-insights/issues/18) is the log for this whole revision. Search open issues before opening a new one, and reuse #18. Pull requests 1 through 4 contain `Refs #18`. Pull request 5 contains `Fixes #18` because that is the deploy that makes This week the public home. Do not open PR 2 through PR 5's issues in advance.

## PR Plan

### PR 1: Draw every Friday and name the two gaps

- **Description:** Rebuild `fixtures/friday-2026-09-25.json` so `chart.weekly` is every Friday from 2013-01-04 through 2026-09-25, with the 2026-09-25 close pinned at 84413 and the 2026-09-25 trend pinned at 141000 (lower 112800, upper 218550). Sample earlier trend, lower, and upper points at least every four weeks. Replace the one-point `sma200w` with the 200-week mean series beginning in 2014. Update the tests that assumed 15 weekly points and one sma point. The lowest 2022 Friday close is under $17,000 and the highest 2025 Friday close is over $120,000. Gzip of the fixture stays under 20480 bytes. Cash word, fires, and cycle cards stay. On the current painter, the Now gap label is "Now, against Friday's trend" and the fit caveat begins "At Friday's close (25 Sep 2026), gap about −41%". Do not reorder the spectrum and do not change the blank-amount sentence. Deploy `dist/` with `scripts/deploy-site.sh`, then copy the new `friday.json` to `/var/www/html/data/friday.json` as exedev, mode 640, group www-data. Do not replace `live.json` and do not delete `data/`. Acceptance: the public `friday.json` has at least 700 weekly points and the page still shows All in. Read Chart fix. Refs #18. Do not open a new issue.
- **Files/components affected:** fixtures/friday-2026-09-25.json, src/painter/dashboard.ts, test/fixtures.test.ts, test/paint.test.ts, test/chart.test.ts
- **Dependencies:** None

### PR 2: Add the This week copy and the presentation facts

- **Description:** Add `presentation` to the Friday type and to `fixtures/friday-2026-09-25.json` using the Presentation facts section. Add stand-down, lump-in, build, slow-in, stay, no-call, and stale fixture variants under `fixtures/states/` that change only the posture fields needed to render each state. Add `src/copy/thisWeek.ts` and `src/compose/plain.ts`. The copy deck in this plan is the exact text. `COPY_WRITTEN_FOR` matches `presentation`. `test/this-week.test.ts` renders every state and modifier, fails on a banned word, a brace, or a sentence over 25 words, checks the four time zones, and checks trim math at spot 84413 and spot 100000. No route change and no deploy. Read Presentation facts and Copy deck. Refs #18. Do not open a new issue.
- **Files/components affected:** src/contract/types.ts, src/copy/thisWeek.ts, src/compose/plain.ts, fixtures/friday-2026-09-25.json, fixtures/states, test/this-week.test.ts
- **Dependencies:** None

### PR 3: Paint This week at /this-week/

- **Description:** Add `src/painter/this-week.ts` and `src/painter/this-week.css` from the This week page section and from `docs/16-claude-human-first-revision-design-spec.html`. Add `src/client/this-week.ts`. `scripts/build.mjs` emits `dist/this-week/index.html` and does not replace `dist/index.html`. The dev server serves it. Playwright covers 320, 390, and 1440 for the current All-in week, axe is clean, there is one h1, and the scale step has `aria-current="step"`. The bundle has no Google Fonts link and no market hostname. The page budget stays under 51200 gzipped bytes excluding fonts. Do not deploy this path to the public host. Read This week page. Refs #18. Do not open a new issue.
- **Files/components affected:** src/painter/this-week.ts, src/painter/this-week.css, src/client/this-week.ts, scripts/build.mjs, scripts/serve.mjs, test/browser.spec.ts, scripts/check-budget.mjs
- **Dependencies:** PR 2

### PR 4: Relabel Settings and drop the shape hints

- **Description:** Change `src/painter/settings.ts` labels, help, and intro to the Settings section. Remove the three shape hints. Keep ids and `btc-insights.settings.v1`. IRA suppresses the tax-bill sentence; a blank account and a taxable account still show it. The back link still returns to the dashboard until PR 5. `test/paint.test.ts` expects "Not set", expects the new headings, and does not expect "about $5,000" or "about $100,000". Deploy is allowed for `settings.html` only, because the public home is still the dashboard. Read Settings. Refs #18. Do not open a new issue.
- **Files/components affected:** src/painter/settings.ts, src/settings/holder.ts, test/paint.test.ts, test/holder.test.ts
- **Dependencies:** None

### PR 5: Make This week the home page and move the dashboard to Evidence

- **Description:** `dist/index.html` becomes This week. The current dashboard moves to `dist/evidence/index.html`. Shared header: brand BTC Friday, tabs This week and Evidence, Settings gear. Evidence gets the label, glossary, legend, and footer changes in the Evidence section, keeps the dark theme, and drops the spectrum. Settings' back link reads "Back to This week". Deploy `dist/` with `scripts/deploy-site.sh`, preserving `data/`. Verify on https://btcfriday.app and https://btcfriday.exe.xyz: `/` shows "A strong week to buy Bitcoin.", the 4-of-4 spread sentence, and no "19 times in 20"; `/evidence/` shows the dashboard, All in, and a weekly series of at least 700 points; Settings has no shape hints. Check a 390 px viewport and a desktop viewport. A poll failure must not wipe a loaded page. Fixes #18. Do not open a new issue.
- **Files/components affected:** scripts/build.mjs, src/painter/dashboard.ts, src/painter/this-week.ts, src/painter/settings.ts, src/client/dashboard.ts, src/client/this-week.ts, test/browser.spec.ts, test/paint.test.ts
- **Dependencies:** PR 1, PR 3, PR 4
