# BTC Friday Human-First Revision Spec

Sep 27, 2026 · @Riyad Kalla

This is a work order for an implementing session. The live app at btcfriday.app follows the Design B spec faithfully, but newcomers can't tell what it wants them to do. This revision adds a plain-language This week page as the home page, moves today's page to an Evidence page, fixes four bugs, and rewrites every state in everyday words. The signal engine and its rules do not change.

## Goal and the five-second test

The live page answers an analyst's question: which rule is on, and how strong is its record. The people it's for ask something simpler: what should I do with my money this week, and how sure are you? This revision puts that answer first, in words someone with no investing background can read, and keeps the analyst view one click away.

**The test.** Show the This week page for five seconds to someone who has never seen it. Hide it, then ask:

1. What does it say to do?
2. By when?
3. How sure is it?

A person passes when all three answers are right in their own words. For the current week, "buy Bitcoin", "by Friday" and "it worked every time before, but only four times" all pass. The revision is done when at least 4 of 5 newcomers pass. Early feedback suggests newcomers fail this test on the live page.

**What stays the same:** the engine, every rule and threshold, the Friday schedule, the data source, and every number the engine publishes. This is a presentation and copy change, plus a few extra fields in the engine's output.

**Not part of this work:** new signals, trading or broker links, tax calculations, sign-in, storing holdings on a server, and alerts.

## What the implementing session receives

Give the implementing session these files. Where two disagree, the higher row wins.

| Order | File | Use it for |
| --- | --- | --- |
| 1 | This spec | The work order, the copy and the acceptance tests |
| 2 | `this-week-reference.html` | The look, layout and behaviour of the new This week page. It opens in this week's state (Buy strongly), and a preview bar at the top switches between every state. Its copy is the copy deck below. |
| 3 | `design-b-spec.md` | Everything about the Evidence page and Settings that this spec doesn't change |
| 4 | `design-b-reference.html` and `design-b-settings.html` | Baseline markup for Evidence and Settings |
| 5 | The live repo | The code to change: the Python engine that writes the weekly JSON, and the Vite, TypeScript and Preact site |

**Check three assumptions against the repo before starting,** and stop to ask if any is wrong:

- The engine writes one JSON view model per Friday close, shaped like `DashboardVM` in the Design B spec.
- Pages are prerendered at build time and hydrate on load.
- Settings live only on the device (for example in `localStorage`) and are never sent to a server.

**Routes after this work:**

| Path | Page |
| --- | --- |
| `/` | This week (new) |
| `/evidence` | Today's dashboard, cleaned up |
| Settings | Keep its current path; relabel it |
| `/index.html` | Serves the same page as `/`, because that link has already been shared |

## Work order

Ship in this order. Each milestone is its own pull request and can go live on its own.

| Milestone | Work | Done when |
| --- | --- | --- |
| M0 | Fix four bugs and one line of copy on the live page | The M0 checks below pass |
| M1 | Add plain-language facts to the engine output | The schema test passes and no existing field changes |
| M2 | Build the This week page at `/` | Every state renders from fixtures, the banned-words check passes, and screenshots exist at 320, 390 and 1440 px |
| M3 | Move today's page to `/evidence` and clean it up | The rail is gone, the glossary is in place, and every number names its day |
| M4 | Relabel Settings and personalise amounts | Amounts the viewer has set appear on This week; blank amounts fall back to general wording |
| M5 | Retest with newcomers | At least 4 of 5 pass the five-second test |

M0 can ship right away. M1 has to land before M2. M3 and M4 can run in parallel once M2 is merged. If M5 fails, change the copy first (it lives in one file) and retest before touching layout.

## M0: bug fixes on the live page

These are wrong today whatever the redesign, so they ship first.

**1. The price line only joins the buy-signal dates.**

- Now: the line runs straight between the five signal markers, so it skips the 2022 low and the 2025 high. Bitcoin looks as if it only goes up, which is the most misleading thing a newcomer could take from the page.
- Fix: draw the line through every Friday close in `chart.weekly` (about 715 points since 2013). Draw the markers on top of it. If the path needs thinning for speed, keep each bucket's high and low; never thin it down to the marker dates.
- Check: the line reaches the lowest 2022 Friday close (about $16,500, on 25 Nov 2022) and the highest 2025 Friday close (about $122,300, on 3 Oct 2025).

**2. The 200-week average is in the legend but isn't drawn.**

- Fix: draw `chart.sma200w` as a thin line. It starts in May 2014, once 200 weeks of data exist. The legend must never list a line that isn't drawn; if the line can't ship yet, take it out of the legend.

**3. The side rail is out of order and looks clickable.**

- Now: "02 · Coins held" sits above "01 · Cash", and the items have hover styling.
- Fix for M0: put 01 above 02, and remove the hover style, the pointer cursor and any button role. M3 removes the rail entirely.

**4. One measure shows two values with no explanation.**

- Now: "Now −40%" appears next to the caveat's "−41%". One comes from the latest price and the other from Friday's close.
- Fix: every number that comes from a price names its day. Friday figures read "at Friday's close (Sep 25)". Live figures read "now (Sun, Sep 27, 2:14 pm)". Friday figures set the advice; live figures never change it.

**5. One awkward line.** "Use your cash available to invest" becomes "Invest the money you've set aside for Bitcoin." M4 replaces it again with the new Settings labels.

## The plain-language model

Newcomers see one five-step scale, from most cautious to most eager. Each engine state maps to exactly one step. The engine's names don't change; only the words on the This week page are new.

**The scale:** Pause · Go slow · Steady · Add · Buy strongly

| Engine cash state | Step | Headline | What it means, in plain words |
| --- | --- | --- | --- |
| `ALL_IN` | Buy strongly | A strong week to buy Bitcoin. | Our strongest buy signal has just turned on. |
| `LUMP_IN` | Add | A good time to add to Bitcoin. | Bitcoin is 20% or more below its trend, where putting money in at once has beaten spreading it out. |
| `BUILD` | Add | Bitcoin is cheap. Add a little each week. | Bitcoin trades below what the average holder paid. |
| `STAY` | Steady | A normal week. Keep your regular buys. | Nothing unusual is happening. |
| `SLOW_IN` | Go slow | Prices are stretched. Go slow with new money. | Bitcoin is more than 55% above its trend. |
| `STAND_DOWN` | Pause | Pause new buying for now. | Our caution signal turned on after a big run-up. |
| `NO_NEW_BUY` with coins `EXIT` | Pause | Stop buying, and sell your Bitcoin. | The viewer said in Settings that Bitcoin's long-term case is broken. |
| `NO_CALL` | None marked | No update this week. | The data didn't arrive or failed a check. |

| Engine coin state | Line under the headline |
| --- | --- |
| `HOLD` | Keep any Bitcoin you already own. |
| `TRIM` | Take some profit: sell part of your Bitcoin. |
| `EXIT` | You've told us Bitcoin's long-term case is broken. |

**Rules:**

- **The scale shows the cash step only.** The coin state is a sentence under the headline, never a second scale.
- **`LUMP_IN` and `BUILD` share the Add step.** Both mean "put in more than your regular buys". The difference is timing, carried by `addMode`: `AT_ONCE` for `LUMP_IN` and `WEEKLY` for `BUILD`.
- **Colour follows the step.** Pause and Go slow use the caution colour, Steady uses ink, and Add and Buy strongly use the buy colour. The step's name is always printed, so colour never carries meaning alone.
- **The scale is not a confidence meter.** A small line under it says "This shows what to do, not how sure we are." How sure lives in the Track record line and in Has this worked before?
- **"Sell" appears only when the viewer asked for it.** The page never tells anyone to sell because of a market signal. The caution signal pauses new money; it doesn't sell coins. That's why the copy calls it a caution signal, not a sell signal.
- **Where each state comes from.** The cash state and the gold, getting-close and replaces-a-pause flags come from the engine. Take some profit and Sell come from Settings and are worked out on the device, because holdings never leave it. While a Sell declaration is on, it replaces the engine's cash state on this page.

## Copy deck for the This week page

This is every word on the This week page. Keep it in one file (for example `src/copy/thisWeek.ts`) so wording can change without touching components. The engine supplies facts; the page fills the `{placeholders}`. The reference HTML renders every state below from this same text.

### Placeholders

| Placeholder | Source | Example | When blank |
| --- | --- | --- | --- |
| `{amount}` | Settings: Money set aside for Bitcoin | $10,000 | the money you've set aside |
| `{regularNote}` | Settings: Regular buy and how often | `  ($200 a week) `, with a leading space | empty |
| `{slice}` | The weekly add for cheap stretches (see open questions) | $2,500 | a small, fixed amount |
| `{deadline}` | `plain.deadlineUtc` in the viewer's time zone | Friday, Oct 2, 5:00 pm | not shown |
| `{daysLeft}` | Local calendar days from now to the deadline | 5 days left; 1 day left; Due today | not shown |
| `{nextUpdate}`, `{nextUpdateShort}` | `plain.nextUpdateUtc` in the viewer's time zone | Friday, Oct 2, 5:00 pm; Fri, Oct 2 | not shown |
| `{updated}`, `{updatedShort}` | `plain.updatedUtc` in the viewer's time zone | Friday, Sep 25, 5:00 pm; Friday, Sep 25 | not shown |
| `{gap}` | `plain.gapPctFriday`, whole number, no sign | 41 | not shown |
| `{gapWords}` | `plain.gapPctFriday` as words | about 8% below; about 12% above | not shown |
| `{fireDate}`, `{pauseDate}`, `{declaredDate}` | Dates from `plain`, month and day | Sep 18 | not shown |
| `{pauseEnds}` | `plain.pauseEndsDate`, with the year | Mar 6, 2027 | not shown |
| `{stretchStart}` | `plain.stretchStartDate`, month and year | November 2025 | drop the sentence |
| `{wins}`, `{total}` | `plain.record` for this state | 4, 4 | not shown |
| `{inTen}` | `round(plain.record.floorPct / 10)` | 6 | not shown |
| `{worstDip}` | `plain.worstDipAfterSignalPct`, no sign | 27 | not shown |
| `{fireYears}` | Years of past buy signals, from `plain.history` | 2015, 2019, 2020 and 2023 | not shown |
| `{weeksUp}`, `{weeks}`, `{stretches}` | `plain.record` for Add (each week) | 90, 91, 4 | not shown |
| `{target}`, `{ceiling}`, `{share}` | Settings, and the share worked out on the device | 10, 15, 18 | Take some profit is off |
| `{trimUsd}`, `{trimBtc}` | Worked out on the device (see the data contract) | $37,400; 0.44 | Take some profit is off |

**Rounding.** Percentages are whole numbers. Dollar amounts over $1,000 use three significant figures ($37,400). Bitcoin amounts use two decimals. Never print more precision than the evidence has.

**Hand-written history.** A few sentences name past years (June 2013, 2019–20, 2025–26). Keep a `COPY_WRITTEN_FOR` constant beside the copy with the record counts it was written against, and add a test that fails when the engine's `plain.record` for any state stops matching. That forces someone to reread the copy when a record changes.

### Parts that appear in every state

| Part | Copy |
| --- | --- |
| Update line (top) | This week's advice, set {updatedShort}. Next update {nextUpdate} your time. |
| Short disclaimer (top) | Research, not personal financial advice. Read more (links to the footer) |
| Under the scale | This shows what to do, not how sure we are. |
| Label before the track record line | Track record: |
| Timing chip, states without a deadline | Holds until {nextUpdateShort} |
| Personalise prompt (Buy strongly and Add only, while amounts are blank) | Want this in dollars? Add the amount you've set aside in Settings. It stays on this device. |
| Last line of What could go wrong (every state but Sell) | **Only use money you won't need for a few years.** |
| Bitcoin today | Bitcoin today {latest price} {day and time of that price} |
| Under Bitcoin today | Prices move every day. The advice only changes on Fridays. |
| Evidence link | See the evidence behind this. Subline: Charts, the rules, and every past signal. |
| Footer | BTC Friday is research, not personal financial advice. It looks at Bitcoin's price history, and history can be wrong about the future. It doesn't know your full situation, doesn't trade for you and doesn't calculate taxes. Before investing money you can't afford to lose, talk to a fee-only financial adviser. |

### Buy strongly (`ALL_IN`)

| Part | Copy |
| --- | --- |
| Headline | A strong week to buy Bitcoin. |
| Line under headline | Keep any Bitcoin you already own. |
| Track record | Worked all {wins} times before, but {wins} is a small number. |
| Timing chip | {daysLeft} |
| What to do 1 | Put {amount} into Bitcoin by {deadline} your time. |
| What to do 2 | Keep your regular buys going{regularNote}. |
| After the list | After that, this page switches to the next week's advice. |
| Why 1 | On {fireDate}, our strongest buy signal turned on. Before this, it had turned on only {total} times: in {fireYears}. |
| Why 2 | Bitcoin is about {gap}% below its long-run trend. When it has been 20% or more below, it was higher a year later about 19 times in 20. |
| Has this worked before? | **Yes, all {wins} times.** That's too few to be sure. Allowing for that, a cautious estimate is that it works about {inTen} times in 10 or better. Treat it as a strong hint, not a promise. |
| Record tiles | One tile per past signal with its year and one-year change (2015 +127%, 2019 +59%, 2020 +269%, 2023 +138%), then the open signal (2026, In progress). Caption: Bitcoin's price one year after each signal. |
| What could go wrong | After past signals like this, Bitcoin still dropped as much as {worstDip}% below its signal-day price at some point in the next year. It has fallen 20% or more at some point in every year since 2012. |

### Add, at once (`LUMP_IN`)

| Part | Copy |
| --- | --- |
| Headline | A good time to add to Bitcoin. |
| Line under headline | Keep any Bitcoin you already own. |
| Track record | Worked in all {wins} past stretches like this. |
| Timing chip | Holds until {nextUpdateShort} |
| What to do 1 | Put {amount} into Bitcoin when you have it. There's no need to spread it out. |
| What to do 2 | Keep your regular buys going{regularNote}. |
| Why 1 | Bitcoin is about {gap}% below its long-run trend. When it has been 20% or more below, it was higher a year later about 19 times in 20. |
| Why 2 | In stretches like this, putting money in all at once beat spreading it over a year in all {wins} past cases. |
| Has this worked before? | **Yes, in all {wins} past stretches.** That's still a small number. Allowing for that, a cautious estimate is that it works about {inTen} times in 10 or better. This stretch began in {stretchStart} and hasn't finished yet. |
| What could go wrong | Bitcoin can keep falling after you buy. It has fallen 20% or more at some point in every year since 2012. |

### Add, each week (`BUILD`)

| Part | Copy |
| --- | --- |
| Headline | Bitcoin is cheap. Add a little each week. |
| Line under headline | Keep any Bitcoin you already own. |
| Track record | Bitcoin was higher a year later in {weeksUp} of {weeks} weeks like this. |
| Timing chip | Holds until {nextUpdateShort} |
| What to do 1 | Add {slice} to Bitcoin this week, and each week while it stays this cheap. |
| What to do 2 | Keep your regular buys going{regularNote}. |
| Why 1 | Bitcoin is trading below what the average holder paid for it. Before now, that had happened in only {stretches} stretches since 2012. |
| Why 2 | In those stretches, Bitcoin was higher a year later in {weeksUp} of {weeks} weeks. |
| Has this worked before? | **Yes, in {weeksUp} of {weeks} weeks.** Those weeks came from only {stretches} stretches, and weeks close together tend to move together. So think of it as {stretches} examples, not {weeks}. |
| What could go wrong | Cheap can get cheaper. In past stretches, the price sometimes kept falling for months before it turned. Adding a little each week spreads that risk out. |

### Steady (`STAY`)

| Part | Copy |
| --- | --- |
| Headline | A normal week. Keep your regular buys. |
| Line under headline | Keep any Bitcoin you already own. |
| Track record | None needed. This is the normal plan. |
| Timing chip | Holds until {nextUpdateShort} |
| What to do 1 | Keep your regular buys going{regularNote}. |
| What to do 2 | Have new money to invest? History shows no clear winner in weeks like this, so put it in now or spread it out, whichever you prefer. |
| Why 1 | Bitcoin is {gapWords} its long-run trend, which is within its normal range. |
| Why 2 | None of our buy or caution signals is on. |
| Has this worked before? | **Nothing to test this week.** There's no special signal, so there's no record to show. Regular buying is the default plan. |
| What could go wrong | Bitcoin can fall 20% or more at any time. It has, at some point, in every year since 2012. |

### Go slow (`SLOW_IN`)

| Part | Copy |
| --- | --- |
| Headline | Prices are stretched. Go slow with new money. |
| Line under headline | Keep any Bitcoin you already own. |
| Track record | Worked {wins} of {total} times, our weakest record. |
| Timing chip | Holds until {nextUpdateShort} |
| What to do 1 | Spread any new lump sum evenly over the next 12 months. |
| What to do 2 | Keep your regular buys going{regularNote}. |
| Why 1 | Bitcoin is more than 55% above its long-run trend. |
| Why 2 | At times like this, spreading new money out did better than investing it at once in {wins} of {total} cases. |
| Has this worked before? | **{wins} of {total} times.** With only {total} cases, we can't say it beats a coin flip. Treat it as a hint, not a rule. |
| What could go wrong | If prices keep rising, spreading out means paying more for some of your Bitcoin. |

### Pause (`STAND_DOWN`)

| Part | Copy |
| --- | --- |
| Headline | Pause new buying for now. |
| Line under headline | Keep any Bitcoin you already own. |
| Track record | Paid off {wins} of {total} times, with one costly miss. |
| Timing chip | Holds until {nextUpdateShort} |
| What to do 1 | Pause new buys, including your regular ones. |
| What to do 2 | Keep that money somewhere safe that pays interest, such as Treasury bills or a high-yield savings account. |
| What to do 3 | It goes back into Bitcoin when a buy signal returns, or on {pauseEnds}, whichever comes first. |
| Why 1 | On {pauseDate}, our caution signal turned on: after a big run-up above its long-run trend, Bitcoin fell 10% from its peak. |
| Why 2 | In the past, pausing and buying later got more Bitcoin for the same money in {wins} of {total} cases. |
| Has this worked before? | **{wins} of {total} times.** In June 2013, pausing missed a large rise. The signal also stayed off before two big drops, in 2019–20 and 2025–26. And a 12-month pause hasn't been tested on its own. |
| What could go wrong | Pausing can mean buying back at a higher price. In 2013, it meant missing a large rise. |

### Sell, the viewer's decision (`NO_NEW_BUY` with `EXIT`)

| Part | Copy |
| --- | --- |
| Scale step | Pause |
| Headline | Stop buying, and sell your Bitcoin. |
| Line under headline | You've told us Bitcoin's long-term case is broken. |
| Track record | None. This follows your decision, not a market signal. |
| Timing chip | None |
| What to do 1 | Sell the Bitcoin you hold. Selling can create a tax bill, so check with a tax adviser first. |
| What to do 2 | Stop new buys, including your regular ones. |
| Why 1 | On {declaredDate}, you said in Settings that you no longer believe in Bitcoin's long-term case. |
| Has this worked before? | **There's no record for this.** It's your decision, not a signal, so there's nothing to test. |
| What could go wrong | If you change your mind, you may buy back at a higher price. You can undo this in Settings. (No closing line in this state.) |

### No update (`NO_CALL`)

| Part | Copy |
| --- | --- |
| Scale | No step marked. The line under it reads: No step is marked this week. |
| Headline | No update this week. |
| Line under headline | Keep any Bitcoin you already own. |
| Track record | Not shown |
| Timing chip | None |
| What to do 1 | Keep your regular buys going{regularNote}. |
| What to do 2 | Check back later. We'll update as soon as the data comes through. |
| Why 1 | This week's price data didn't arrive, or it failed our checks. We won't guess. |
| Has this worked before? | Not shown |
| What could go wrong | Bitcoin can fall 20% or more at any time. It has, at some point, in every year since 2012. |

### Modifiers

Modifiers add or swap lines. They never change the scale step.

| Modifier | When | Copy |
| --- | --- | --- |
| Getting close | The engine reports the buy cross as armed but not fired, and the state is `LUMP_IN`, `BUILD` or `STAY` | After the What to do list, in a blue callout: Our strongest buy signal is getting close. Keep some extra cash ready for it. Extra Why bullet: Bitcoin has fallen far enough against gold, and below its trend, to set up our strongest buy signal. It turns on when Bitcoin's price in gold climbs back to its one-year average. |
| Gold flag | `goldAssisted` is true, in `ALL_IN` | Extra Why bullet with an amber dot: Part of this signal came from gold rising, not only Bitcoin falling, so it's a little weaker than usual. |
| Take some profit | Settings has coins, investments, a target and a limit, and Bitcoin's share is above the limit. Never with Sell or No update. | Line under headline: Take some profit: sell part of your Bitcoin. Extra What to do item: Sell about {trimUsd} of Bitcoin (about {trimBtc} bitcoin) to get back to {target}% of your investments. Sell the coins that cost you the most first. Selling can create a tax bill. During a Pause, add: Finish by {pauseEnds}. Extra Why bullet: Bitcoin has grown to {share}% of your investments, above the {ceiling}% limit you set. |
| Buy replaces a pause | `ALL_IN` or `BUILD` while a caution-signal pause is still running | Second line under headline: An earlier signal said to pause. This week's buy signal replaces it. Swap the regular-buys item for: Restart your regular buys{regularNote}. |
| Out of date | No new data six hours after `nextUpdateUtc`, or the engine sets `stale` | Banner above the headline: This page hasn't updated since {updated}. Don't act on it until it does. Hide the update line and the timing chip. |

## This week page: layout and components

One column, phone first, at most 680 px wide and centred. The order is the same at every width. `this-week-reference.html` is the source of truth for spacing; this section lists what's on the page and the behaviour the code needs.

**Order, top to bottom:** header, update line, verdict card, What to do, Why, Has this worked before?, What could go wrong, Bitcoin today, evidence link, footer.

| Component | Contents | Behaviour and details |
| --- | --- | --- |
| Header | Brand (BTC Friday, with a small blue mark), the tabs This week and Evidence, and a Settings gear | Under 600 px, brand and gear share the first row (56 px) and the tabs sit on a second row (44 px tall). From 600 px, one 64 px row, with the gear labelled Settings. The current tab has `aria-current="page"` and a 3 px ink underline. The gear keeps `aria-label="Settings"` while its label is hidden. |
| Update line | The update line, then the short disclaimer with a Read more link to the footer | 14 px, ink-3. The update line hides when the page is out of date. |
| Verdict card | The headline, the line under it, the scale, the note under the scale, and the track record line | The headline is the page's only `h1`: `clamp(30px, 7.4vw, 44px)`, weight 700, line height 1.1, `text-wrap: balance`. |
| Scale | Five equal columns over a 4 px track that fades from caution tint through neutral to buy tint | An `ol` with `aria-label="Advice scale, from most cautious to most eager"`. The current step has `aria-current="step"` and a visually hidden "(this week)". Other dots are 12 px, white, with a 2 px `--dot` ring. The current dot is 30 px in the step's colour, with a 10 px white centre and a 5 px tint halo; its label is 14.5 px (15 px from 600 px), weight 650, in the step's ink. Under 375 px, labels drop to 12 px (13 px current) and the scale extends 10 px into the card padding on each side, so Buy strongly wraps onto two lines without splitting a word. |
| Track record line | "Track record:" in bold ink, then the state's line | 16 px, ink-2, below a 1 px rule with 16 px above the text |
| What to do | `h2`, timing chip, numbered list, then the optional after-line, callout and personalise prompt | Numbers sit in 32 px circles in the step's tint and ink. The deadline chip has a clock icon on buy tint; the other chip is neutral. The amount, deadline, slice, pause end and trim amount are bold, and the deadline never breaks across lines. |
| Why | `h2` and one to four bullets | 7 px round bullets in ink-3; the gold-flag bullet is caution-coloured |
| Has this worked before? | `h2`, a bold one-line answer, optional tiles, then the body | Tiles are 3 columns under 520 px and 5 from 520 px. Each shows the year (13.5 px, ink-3) and the change (22 px bold, buy ink). The open signal's tile is dashed, on paper, and reads In progress. The caption describes the tile list (`aria-describedby`). |
| What could go wrong | Warning icon, `h2` in caution ink, body, and the bold closing line | Caution tint background with a caution-line border |
| Bitcoin today | Label, the latest price (26 px bold, tabular figures), the day and time of that price, and the note | Not a card. It shows the price only, with no gap percentage, so the page never shows two different gaps. |
| Evidence link | Title, subline and arrow | A full-width link styled as a card, at least 64 px tall |
| Footer | The full disclaimer and links to Evidence and Settings | `id="about"`, the target of Read more |

**Time formatting.**

- Format in the viewer's time zone (`Intl.DateTimeFormat` with no `timeZone`) and say "your time". Example: Friday, Oct 2, 5:00 pm. Use lower-case am and pm.
- A time of exactly 00:00 local shows as the day before "at midnight": Friday, Oct 2 at midnight. (A viewer on UTC sees this for every Friday close.)
- Days left counts local calendar days from today to the deadline, with a midnight deadline counting toward the day before. Zero reads Due today.
- Prerender with the site's default zone, America/Phoenix, and a visible zone name (5:00 pm Arizona time). Hydration replaces it with the viewer's local time and "your time".

**Edge states.**

- **First view:** the page is prerendered from the latest JSON, so there is no loading skeleton. If hydration fetches newer JSON, swap it in without layout shift.
- **Deadline passed, new data not yet in:** the chip reads Updating soon and the rest stays. Six hours after `nextUpdateUtc` with no new data, the Out of date modifier takes over.
- **No JavaScript:** the prerendered page is complete. Only local times and personal amounts need scripts.

**Not on this page:** charts, tooltips (they don't work on phones), animation or count-ups, live tickers, and any button that looks like it places an order.

## This week page: visual style

Light and calm, like a letter rather than a trading screen. Every text pair below meets WCAG AA; ratios were measured, not estimated. The page ships light only in this work; the tokens are named so a dark set can be added later.

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| `--paper` | `#F7F6F2` | Page background | — |
| `--card` | `#FFFFFF` | Cards | — |
| `--ink` | `#15171C` | Headlines and body text | 17.93:1 on card, 16.58:1 on paper |
| `--ink-2` | `#4A505C` | Secondary text; the Steady dot | 8.10:1 on card, 7.49:1 on paper |
| `--ink-3` | `#5F6570` | Meta text, captions, bullets | 5.86:1 on card, 5.42:1 on paper |
| `--line` | `#E4E2DC` | Card borders | Decorative |
| `--line-strong` | `#D6D3CB` | Dashed rules, the open tile | Decorative |
| `--dot` | `#8A909B` | Rings of the other scale dots | 3.21:1 on card (graphic, 3:1 needed) |
| `--buy` | `#1F5ED6` | Current dot for Add and Buy strongly; focus ring | 5.78:1 on card |
| `--buy-ink` | `#1B4FB8` | Text in the buy colour (tile figures, chip, links) | 7.35:1 on card, 6.47:1 on buy tint |
| `--buy-tint` | `#EAF1FD` | Deadline chip, step numbers, callout | Ink on it is 15.79:1 |
| `--buy-line` | `#C9DAF8` | Callout border | Decorative |
| `--caution` | `#A5520E` | Current dot for Pause and Go slow; warning icon; gold-flag bullet | 5.51:1 on card, 4.94:1 on caution tint |
| `--caution-ink` | `#8C4509` | Text in the caution colour | 7.07:1 on card, 6.34:1 on caution tint |
| `--caution-tint` | `#FBF1E6` | What could go wrong, the out-of-date banner | Ink on it is 16.07:1 |
| `--caution-line` | `#F0DCC4` | Border of the risk card | Decorative |
| `--neutral-tint` | `#EFEEEA` | Neutral chip, hover backgrounds | Ink-2 on it is 6.98:1 |

**Type.** Self-host Geist as a variable font (weights 400 to 700). No monospace and no all-caps labels on this page.

| Role | Size and line height | Weight |
| --- | --- | --- |
| Headline | `clamp(30px, 7.4vw, 44px)` / 1.1, letter spacing −0.025em | 700 |
| Line under headline | 18 / 1.45 | 400 |
| Card heading | 20 / 1.3, letter spacing −0.01em | 650 |
| Body, list items, bullets | 17 / 1.55 | 400; bold values 650 |
| Track record, record body | 16 / 1.5 | 400 |
| Tile figure | 22 / 1.2 | 700 |
| Meta, captions, footer | 13.5–14 / 1.5 | 400 |

**Spacing and shape.** Page sides 16 px under 600 px and 24 px from 600 px. Card padding 20 px, then 28 px from 600 px. Gap between cards 16 px, then 20 px. Card radius 16 px, inner wells 12 px, chips fully round. Hit targets are at least 44 px.

**Colour rule.** Blue means buy and amber means caution, on this page and on Evidence. Never use red or green: newcomers read them as profit and loss, and the page makes no such claim.

## Data contract additions (M1)

The engine adds one block, `plain`, to the weekly view model. No existing field changes, so the Evidence page keeps working untouched. The Design B contract had the engine send finished sentences; This week works the other way: the engine sends facts and the site owns the words, so copy can change without a Python release. Evidence keeps its engine-worded sentences.

```ts
// Added to DashboardVM. Existing fields are unchanged.
interface DashboardVM {
  // ...existing fields...
  plain: PlainFacts;
}

type Step = 'PAUSE' | 'GO_SLOW' | 'STEADY' | 'ADD' | 'BUY_STRONGLY';

interface PlainFacts {
  schema: 1;
  cashState: CashPosture;            // same value as cash.posture
  step: Step | null;                 // from the mapping table; null only for NO_CALL
  addMode: 'AT_ONCE' | 'WEEKLY' | null; // LUMP_IN -> AT_ONCE, BUILD -> WEEKLY
  armed: boolean;                    // buy cross set up but not on
  goldAssisted: boolean;             // gold flag on the open buy signal
  replacesPause: boolean;            // ALL_IN or BUILD while a stand-down pause is running
  stale: boolean;

  updatedUtc: string;                // the close that set this call
  nextUpdateUtc: string;             // the next Friday close
  deadlineUtc: string | null;        // ALL_IN only: the last grace close
  fireDate: ISODate | null;          // date of the open buy signal
  pauseStartDate: ISODate | null;    // STAND_DOWN only
  pauseEndsDate: ISODate | null;     // pause start plus 12 months
  stretchStartDate: ISODate | null;  // LUMP_IN or BUILD: start of the current stretch

  fridayCloseUsd: number;            // price at updatedUtc
  gapPctFriday: number;              // signed, one decimal
  latestPriceUsd: number;            // refreshed with each new daily price
  latestPriceUtc: string;

  record: {                          // for the current state; null for STAY and NO_CALL
    wins?: number; total?: number; floorPct?: number;      // ALL_IN, LUMP_IN, SLOW_IN, STAND_DOWN
    weeksUp?: number; weeks?: number; stretches?: number;  // BUILD
  } | null;
  history: { year: number; fireDate: ISODate; oneYearPct: number | null }[]; // buy signals; null = still open
  worstDipAfterSignalPct: number;    // worst drop below the signal-day price within a year, finished signals
  below20YearLaterUpPct: number;     // share of weeks 20%+ under trend that were higher 52 weeks later
  everyYearDrop20: { fromYear: number; toYear: number; holds: boolean };
}
```

**This week's values.** Everything below is known except the two Friday-close figures, which must come from the engine; the sample uses the Design B spec's figures.

```json
"plain": {
  "schema": 1,
  "cashState": "ALL_IN", "step": "BUY_STRONGLY", "addMode": null,
  "armed": false, "goldAssisted": true, "replacesPause": false, "stale": false,
  "updatedUtc": "2026-09-26T00:00:00Z",
  "nextUpdateUtc": "2026-10-03T00:00:00Z",
  "deadlineUtc": "2026-10-03T00:00:00Z",
  "fireDate": "2026-09-18",
  "pauseStartDate": null, "pauseEndsDate": null, "stretchStartDate": null,
  "fridayCloseUsd": 84413, "gapPctFriday": -41.0,
  "latestPriceUsd": 84207, "latestPriceUtc": "2026-09-27T21:14:00Z",
  "record": { "wins": 4, "total": 4, "floorPct": 59.6 },
  "history": [
    { "year": 2015, "fireDate": "2015-07-24", "oneYearPct": 127 },
    { "year": 2019, "fireDate": "2019-05-03", "oneYearPct": 59 },
    { "year": 2020, "fireDate": "2020-07-31", "oneYearPct": 269 },
    { "year": 2023, "fireDate": "2023-03-17", "oneYearPct": 138 },
    { "year": 2026, "fireDate": "2026-09-18", "oneYearPct": null }
  ],
  "worstDipAfterSignalPct": -27,
  "below20YearLaterUpPct": 95.5,
  "everyYearDrop20": { "fromYear": 2012, "toYear": 2025, "holds": true }
}
```

**Two claims the engine must keep checking.** The copy says Bitcoin fell 20% or more at some point in every year since 2012. On daily closes that holds, but 2023 only just made it (−20.0%). If `everyYearDrop20.holds` is ever false, the copy switches to "in almost every year since 2012". Likewise, "about 19 times in 20" is `below20YearLaterUpPct` rounded to twentieths (95.5% today); the snapshot test in the copy deck catches drift.

**Worked out on the device, never sent anywhere.** Holdings stay on the device, so the engine can't compute these:

- `share = coinsHeld × fridayCloseUsd ÷ investableNetWorth`, where investable net worth includes the Bitcoin.
- Take some profit is on when all four Trim settings are filled in and `share` is above the upper limit.
- `trimUsd = coinsHeld × fridayCloseUsd − target × investableNetWorth`, and `trimBtc = trimUsd ÷ fridayCloseUsd`.
- Use the Friday close, not the latest price, so the advice doesn't drift during the week.
- Sell is on while the "long-term case is broken" switch is on with a date. If the repo already has Trim or Exit logic, reuse it and make these rules match it.

**Validation.** Parse `plain` with a schema (for example Zod) at build time and fail the build if it's missing or invalid, or if `step` doesn't match the mapping table for `cashState`.

**Fixtures.** Add one JSON fixture per case under `fixtures/plain/`: all-in (this week's real values), all-in-replaces-pause, lump-in, lump-in-armed, build, build-armed, stay, stay-armed, slow-in, stand-down, no-call and stale. Take some profit and Sell are tested with Settings fixtures layered on top.

## Evidence page changes (M3)

Today's dashboard moves to `/evidence` and keeps the Design B layout, with the changes below. It's for people who want to check the reasoning, so technical terms may stay, as long as each one is explained.

1. **Title and intro.** The `h1` becomes "The evidence behind this week's advice". Under it: "This page shows the rules and history behind This week. It uses some technical terms, and each one is explained at the bottom." Then a link, "What the terms mean", to the glossary.
2. **Same header as This week,** with Evidence as the current tab. The brand is no longer the `h1`.
3. **Remove the rail** and its off chips.
4. **Plain names first.** The large cash word shows the step (Buy strongly), with the rule underneath in small text: "Rule: All in, from the buy cross". The coins word shows Keep, with "Rule: Hold" underneath.
5. **Plain region labels,** without the 01–08 numbers: Cash becomes New money; Coins becomes Bitcoin you own; Caveats becomes Things to know; Context becomes The readings behind the call; Five and ten years becomes The long view; Cycle capture becomes How early each signal was.
6. **Every price-based number names its day** (from M0).
7. **Chart legend in plain words:** Bitcoin price (Friday closes), Long-run trend, 20% below trend, 55% above trend, 200-week average, Buy signal, Caution signal. The M0 chart fixes carry over.
8. **Terms link to the glossary.** The first use of each glossary term links to its entry with a dotted underline. No hover tooltips.
9. **Theme.** Keep the dark Design B theme in M3; it's the lowest-risk change. Moving Evidence to the light tokens is an open question.
10. **Same footer as This week.**

### Glossary

Add this at the bottom of Evidence as `h2` "What the terms mean", marked up as a `dl`.

| Term | Plain meaning |
| --- | --- |
| Long-run trend (power law) | The smooth curve Bitcoin's price has followed since 2010, fitted on a log scale. We compare today's price with it. |
| Gap | How far the price is above or below the trend, in percent. −41% means 41% below. |
| 20% below and 55% above lines | The edges of the normal range. Between them, nothing unusual is happening. |
| Buy cross (our strongest buy signal) | Sets up when Bitcoin is cheap against gold and at least 20% below its trend. Turns on when Bitcoin's price in gold climbs back to its one-year average. |
| Armed | The buy cross has set up but hasn't turned on yet. |
| Z-score | How unusual Bitcoin's price in gold is compared with the past 52 weeks. Zero is average; negative means cheap against gold. |
| Gold flag | A warning that a signal came partly from gold rising, not only Bitcoin falling. |
| Sell roll (caution signal) | Turns on when Bitcoin has run more than 55% above its trend and then falls 10% from its peak. It pauses new money; it doesn't sell coins. |
| Realized price | Roughly what the average holder paid, based on the price when each coin last moved. Below it, the average holder is at a loss. |
| Thermometer | A combined hot-or-cold reading from several inputs. It's shown for context and doesn't change the advice. |
| 200-week average | The average of the last 200 Friday prices, about four years. A slow-moving reference line. |
| Floor | A cautious estimate of how often a signal works, allowing for how few times it has happened. Technically, the lower end of a 90% Wilson interval. |
| Episode, regime, spell, stretch | One continuous period when a signal or condition was on. |
| Friday close | The price at 00:00 UTC on Saturday, which is 5:00 pm Friday in Arizona. The advice changes only then. |
| Grace window | After the buy cross turns on, two more Friday closes to act before the advice moves on. |
| Cycle capture | How much of a cycle's rise, from its low to its high, a buyer caught by buying when a signal turned on and holding to the high. It shows timing, not odds. |
| Rule names | All in = Buy strongly. Lump in = Add, at once. Build = Add, each week. Stay the course = Steady. Slow in = Go slow. Stand down = Pause. Exit = Sell, your decision. |

## Settings wording changes (M4)

The fields and storage stay as they are; only labels, help text and the intro change. Settings live on the device and are never sent anywhere.

**Intro,** replacing "The dashboard reads these amounts. It does not place an order.": "These amounts personalise This week. They stay on this device and are never sent anywhere. BTC Friday never places orders."

| Today | New label | Fields | Help text |
| --- | --- | --- | --- |
| Standing contribution | Regular buy | Amount ($); How often (Week or Month) | The amount you put into Bitcoin on a schedule, whatever the market does. |
| Build tranche | Extra for cheap stretches | Amount ($) | Money you'd add a little at a time, each week, while Bitcoin trades below what the average holder paid. |
| Cash available to invest | Money set aside for Bitcoin | Amount ($) | Money you'd put in when This week says Buy strongly or Add, or spread out when it says Go slow. |
| Trim | Take profits | Bitcoin you own (BTC); All your investments, including Bitcoin ($); Target share (%); Upper limit (%) | Tell us what you hold, and This week will say when Bitcoin has grown too big a part of your investments. Leave any field blank to turn this off. Under Upper limit: Must be above your target. |
| Thesis: Thesis broken, with a date | I've decided Bitcoin's long-term case is broken (switch), plus the date you decided | — | Turn this on only if you've decided to get out of Bitcoin for good. This week will then tell you to sell and stop buying. You can turn it off at any time. |
| Account: Taxable, IRA, Fund | Where you hold it | A regular (taxable) account; A retirement account (IRA); A fund | BTC Friday doesn't calculate taxes. This only decides whether tax reminders appear. |

**Remove the "Shape, if you have not chosen" hints** (about $5,000, about $100,000). Suggesting amounts reads as personal advice, and newcomers take them as recommendations. Blank fields show "Not set".

**Tax reminders.** "Selling can create a tax bill" shows unless Where you hold it is a retirement account.

**Save.** After saving, go back to This week and show the amounts in place. Show nothing like "Saved to the cloud".

## Writing rules and banned terms

These apply to anything added to This week later, not just the copy deck.

1. **Say what to do first, then why.** Headlines are instructions or plain statements, never labels.
2. **One idea per sentence,** and no sentence longer than 25 words. The longest in the deck today is 23.
3. **Everyday words.** If a term needs the glossary, it doesn't belong on This week.
4. **Round numbers and say "about".** Use "19 times in 20" for odds and percentages for price moves.
5. **Dates in words and local time:** "Friday, Oct 2, 5:00 pm your time". Never UTC.
6. **Every success claim carries its sample size** ("all 4 times, but 4 is a small number").
7. **Never promise.** No "guaranteed", "will rise", "can't lose", "safe bet", "risk-free" or "certain".
8. **"Caution signal", never "sell signal".** The only time the page says sell is when the viewer asked for it, or for Take some profit, which uses their own target.
9. **Contractions are fine.** "It's" and "don't" read more like a person.
10. **Use the page names as written:** This week, Evidence, Settings.

### Banned on This week

Run this on the rendered text of every fixture state (header, main and footer). Match case-insensitively, as whole words. Any hit fails the build.

```ts
export const BANNED_THIS_WEEK = [
  'z-?score', 'floor', 'wilson', 'episodes?', 'regimes?', 'postures?', 'tranches?',
  'arm(ed|s)?', 'fire[sd]?', 'firing', 'cross(es|ed)?', 'roll', 'reali[sz]ed',
  'thermometer', 'gap switch', 'official close', 'prints?', 'utc', 'trend band',
  'cycle capture', 'all[ -]in', 'lump in', 'slow in', 'stand[ -]down',
  'stay the course', 'mvrv', 'power law', 'sigma', 'standard deviation', 'dca',
  'hodl', 'basis points?', 'grace',
  'guaranteed?', 'risk-free', "can'?t lose", 'safe bet', 'will rise',
];
const rx = new RegExp(`\\b(${BANNED_THIS_WEEK.join('|')})\\b`, 'i');
```

"All in" is banned even as ordinary English, so write "at once" instead. The reference HTML passes this list in every state and modifier combination (256 renders, 0 hits).

**Allowed:** trend, long-run trend, signal, buy signal, caution signal, lump sum, Treasury bills, high-yield savings account, tax bill, bitcoin (for amounts).

## Acceptance criteria and test plan

### Automated, in CI

- [ ] **State gallery.** A development-only page (for example `/dev/states`, excluded from the production build) renders `/` from every fixture, with and without amounts, Take some profit and Sell. Playwright screenshots each at 320, 390 and 1440 px.
- [ ] **Banned terms.** Zero hits for `BANNED_THIS_WEEK` across every gallery render.
- [ ] **No leftovers.** No `{`, `undefined`, `NaN` or `null` in rendered text.
- [ ] **Sentence length.** No copy-deck sentence is longer than 25 words.
- [ ] **No sideways scroll.** `scrollWidth` equals `clientWidth` at 320 px in every state, and no scale label splits mid-word.
- [ ] **Accessibility.** axe-core reports 0 violations (WCAG 2.1 AA and best practice) in every state. There is one `h1`, and the scale's current step carries `aria-current="step"`.
- [ ] **Mapping.** `step` and `addMode` follow the mapping table for every `cashState`.
- [ ] **Time.** A deadline of `2026-10-03T00:00:00Z` renders as Friday, Oct 2, 5:00 pm in America/Phoenix; Friday, Oct 2, 8:00 pm in America/New\_York; Saturday, Oct 3, 1:00 am in Europe/London; and Friday, Oct 2 at midnight in UTC. From Sun, Sep 27, 2:14 pm in Phoenix, the chip reads 5 days left.
- [ ] **Copy snapshot.** `COPY_WRITTEN_FOR` matches every fixture's `plain.record`, `below20YearLaterUpPct` rounds to 19 in 20, and `everyYearDrop20.holds` is true (or the fallback wording shows).
- [ ] **Take some profit math.** 1.0 BTC, $470,000 of investments, a $84,413 Friday close, a 10% target and a 15% limit give an 18% share and "Sell about $37,400 of Bitcoin (about 0.44 bitcoin)".
- [ ] **Privacy.** After filling in every Settings field, no network request carries any of the values.
- [ ] **Chart (M0).** The weekly path has at least 700 points; the lowest 2022 point is at or under $17,000; the highest 2025 point is at or over $120,000; and the 200-week line is drawn whenever the legend lists it.
- [ ] **Performance.** Lighthouse mobile on `/`: Performance 95 or more, Accessibility 100, LCP under 1.5 s, and under 100 KB transferred before fonts.
- [ ] **Disclaimers.** The short disclaimer and the full footer appear in every state.

### By people

- [ ] **Five-second test (M5).** Five people who don't invest, one at a time, on a phone. Show `/` for five seconds, hide it, and ask the three questions from the goal. Write down their exact words. Pass: at least 4 of 5 get all three right. Then show it again with no time limit and ask: "Was there any word you didn't understand?" Every word named goes to the copy deck for review.
- [ ] **Owner read-through** of every state's 390 px screenshot.
- [ ] **Real devices:** a small phone (320–375 px), a large phone, and a desktop browser.

### Definition of done

M0 to M4 merged, every automated check green, the M5 test passed, and the old URL `/index.html` still showing This week.

## Open questions

The implementing session can start without these answers; each has a default.

| Question | Default until answered |
| --- | --- |
| Brand name. "BTC Friday" comes from the domain. Keep it? | Keep BTC Friday |
| How does Extra for cheap stretches become a weekly amount (`{slice}`)? | Use the repo's existing slicing rule; if there isn't one, show the general wording ("a small, fixed amount") and ask |
| Should Evidence move to the light theme so the site looks like one product? | Keep Evidence dark in M3 |
| Legal review if the site is shared beyond family and friends. A page that says "Put $10,000 into Bitcoin by Friday" can read as personal advice in some places, whatever the disclaimer says. | Share only with people the owner knows until reviewed |
| Which time zone to prerender in | America/Phoenix, the owner's zone |
| Should Buy strongly get a louder verdict card (for example, a blue background)? | No. The calm card is deliberate: urgency is carried by the deadline, not by colour. |
| Alerts when the advice changes | Later, not in this work |
