# Projection

Date: 1 October 2026.

This is the design for a new page, Projection. It is a holder-visible page. The implementation opens one GitHub issue before the code, and the pull request contains `Fixes #N`. This document does not change the site.

## What the holder sees

Projection is a tab in the header after Evidence. The tabs read This week, Evidence, Projection. Settings stays the gear. The address is `/projection/`. The footer link list gains Projection, placed after Evidence and before Settings.

The title is Projection. The open lead is these sentences, in this order:

> If the last five finished cycles repeated, this is about what your Bitcoin would be worth. It replays those cycles. It is not a promise.

> The shape is taken from five cycles, 2010 through 2022. Five is a small number.

Under that, one line states the inputs actually in use:

- Coins and a regular buy: `Starts from {coins} Bitcoin and adds {amount} every {week or month}.`
- Coins and no regular buy: `Starts from {coins} Bitcoin. No regular buy is set, so this adds no new Bitcoin.`
- Zero coins and a regular buy: `Starts from no Bitcoin and adds {amount} every {week or month}.`
- Zero coins and no regular buy: `This starts from no Bitcoin and adds none.` There is no chart in this case.

`{coins}` is the number the holder saved, trailing zeros removed, up to eight decimal places. The word stays Bitcoin. `{amount}` uses the existing whole-dollar format. The schedule word is `week` or `month`.

The chart is one line on a log scale. The line is the portfolio in dollars. Small marks sit on each projected high and each projected low. Those marks use the neutral ink, not the buy color and not the caution color. The legend reads Your Bitcoin, High, and Low. The caption is `Your Bitcoin, on a log scale, through {year}.` `{year}` is the calendar year of the last Friday in the window.

Under the chart, each high and each low is one sentence: `In {year}, at the high, about {dollars}.` and `In {year}, at the low, about {dollars}.` When the last Friday is not already one of those marks, it adds `In {year}, at the end of the 20 years, about {dollars}.` `{dollars}` uses the chart axis form (`$840`, `$12.4k`, `$1.2M`, `$3.4B`), and the axis gains the billion step. The word `about` is outside that form.

`Show the numbers` is closed. It holds today's price, today's long-run trend, how far that price sits from the trend, the five cycle spans with each high as a multiple of the trend, and, for each reading, that Friday's trend and the portfolio. The open page does not contain the words `power law`.

The head includes the same color-mode boot as the other pages, before the stylesheet. The header, the color control, and the existing disclaimer stay as they are. A late print is `live.stale` from the live document.

## The price path

The Friday job already fits the long-run trend on the daily history through that Friday. One fit is used for the whole shape and for every future week. The fit is not redone at each historical week. Trend on a date is `10 ** (a + b * log10(days since 2009-01-03))`, the function already in `src/job/powerlaw.ts`. The browser applies those published coefficients. It does not fit.

A finished cycle is found from the daily closes, in order:

- Start at the first close. Track a low and a high.
- A later close at or below the low moves the low forward and resets the high to that same day.
- Otherwise a close above the high moves the high forward.
- A cycle confirms when a later close is at or below 30% of the high, the high is at least four times the low, and that close is after the high.
- The scan for the next cycle starts the day after the high. That next low is this cycle's end date. Sample 203 falls on that end date, so the cycle's last sample is the next cycle's low. Sample 0 is this cycle's own low. The two averages differ, because the first low in the set is not also an end, and the last end is not also a finished start.
- The scan stops when the remaining closes never confirm. The low of that unfinished search, and the highest close after it, are the open cycle. The open cycle is stored and is not averaged.

On the committed history through 25 September 2026 this rule produces five finished cycles and one open cycle:

| Low | High | End, the next low |
| --- | --- | --- |
| 25 Jul 2010 | 8 Jun 2011 | 18 Nov 2011 |
| 18 Nov 2011 | 9 Apr 2013 | 6 Jul 2013 |
| 6 Jul 2013 | 4 Dec 2013 | 14 Jan 2015 |
| 14 Jan 2015 | 16 Dec 2017 | 15 Dec 2018 |
| 15 Dec 2018 | 8 Nov 2021 | 9 Nov 2022 |

The open cycle runs from 9 Nov 2022 to the high on 6 Oct 2025. It joins the average on the first Friday whose daily close is at or below 30% of that high.

The April 2013 high is its own cycle because the close fell by 70% within a week and the rise cleared four times. The site's cycle table leaves 2011 and 2013 unscored because the buy signal had not fired. This page is a price replay, so those runs are in the average.

The shape has 204 samples. Sample `i` of a cycle, from 0 through 203, is the daily close on the date `low + round((end - low) * i / 203 days)`. The ratio is that close divided by the trend on that date. If that date has no close, use the latest close within the previous four days. The template is the week-by-week mean of the five ratios. The high index is the sample with the greatest mean. The low index is the sample with the least mean. Ties take the later sample.

Measured on the fit through 25 September 2026, the template starts at 0.592, peaks at index 135 at 4.413, and ends at 0.616. The low index is 0. A test locks those three decimals and those two indexes.

## Where today sits

Today's ratio is the live spot divided by the trend on the spot's date. The match is the sample at or after the high index whose ratio is closest to today's ratio. A tie takes the later sample. Future Fridays then step one sample per week and wrap from 203 to 0.

On the 25 September 2026 history the spot's ratio is about 0.59, and the match is the last sample. The next Friday uses sample 0, which is the low of the shape, and the high is sample 135, about 135 weeks later. The page does not hardcode that sentence. A different spot picks a different sample. A test locks the match at index 203 for the history close on that day and for the page spot 84413, both against the fit through 25 September 2026.

The drawn line starts at today's spot. Each later Friday's price is that Friday's trend times the template sample for that step.

## The portfolio

The line starts at today's spot times the Bitcoin the holder owns. No buy happens on the spot date. After that, a weekly regular buy spends its dollars on every later Friday. A monthly regular buy spends them on the first Friday of each calendar month. Weekdays are computed in UTC. Coins bought that Friday are the dollars divided by that Friday's projected price. The value that Friday is the coins so far times that price. Cash not yet spent is off the chart.

A blank coin field draws nothing. Zero is a saved value and follows the sentences above. A blank amount or a blank schedule adds no coins.

The window runs from the spot date through the last Friday on or before the calendar date 20 years later.

These Settings fields are unused: cash available, the build amount, net worth, the target share, the upper limit, the thesis declaration, and the account.

## The document

The Friday job writes `/data/projection.json` next to the Friday document, by the same replace-in-place write it already uses for `friday.json`. This week, Evidence, and Settings do not fetch it. The Projection page fetches `/data/projection.json` and `/data/live.json`, and reads Settings from `localStorage` under `btc-insights.settings.v1`.

The document has this shape. `template` has 204 ratios, and `cycles` has five rows. The numbers below show the shape, not a second source of the locked decimals.

```json
{
  "schema": 1,
  "asOf": "2026-09-25",
  "fit": { "a": -16.359, "b": 5.644 },
  "genesis": "2009-01-03",
  "samples": 204,
  "template": [],
  "highIndex": 135,
  "lowIndex": 0,
  "cyclesUsed": 5,
  "cycles": [
    { "low": "2010-07-25", "high": "2011-06-08", "end": "2011-11-18", "highRatio": 15.16 }
  ],
  "open": { "low": "2022-11-09", "high": "2025-10-06", "highPrice": 124824 }
}
```

`highRatio` is that cycle's own peak sample, rounded to two decimals, for `Show the numbers`. `highPrice` is the fixture's high close, which the research rounds to $124,824. The file is a few kilobytes.

A site deploy does not upload `data/`. The public page can draw a chart only after the job has written this file on the server. The implementation does not deploy the job and does not run it on the server.

## When something is missing

- No saved Bitcoin amount: `Add the Bitcoin you own in Settings to draw this.` The sentence links to Settings. No dollar figure is invented.
- The live print is stale: the chart still draws, with `This price is late, so the projection is using an older price.` The word `print` is on This week's banned list, so the page says `older price`.
- The live print is missing, or the spot is not a positive number: `Today's price is not available, so this cannot start.`
- The projection file is missing, or its schema, fit, or template is unusable: `The replay is not available right now.`

## Voice and size

Open text, including the readings and the input line, follows This week's banned-word list and the 25-word sentence limit. `Show the numbers` may name the trend multiples. The page has its own CSS and its own script. This week's script does not grow. Gzip of the Projection HTML, its CSS, and its script stays under 50 KB, the existing budget. The chart is SVG drawn with plain math. No chart library.

The SVG is decorative. The readings in the HTML are the accessible figures. The figure is labelled by the page heading.

## Tests

- The cycle finder on `fixtures/history/btc-daily.json` returns the five date rows above and the open cycle from 9 Nov 2022 to 6 Oct 2025. It does not include the open cycle in the mean.
- The template has length 204. On the fit through 25 September 2026, index 0 is 0.592, index 135 is 4.413, index 203 is 0.616, the high index is 135, and the low index is 0.
- The phase match is 203 for that day's history close and for spot 84413.
- A known coin count plus a monthly amount produces a locked portfolio value on one future Friday. A blank regular buy leaves the coin count unchanged. A blank coin field produces no dollars.
- The shell has the Projection tab, the color-mode boot before the stylesheet, and no remote URL other than the repository link.
- The browser test covers a filled Settings sample, which shows a high reading and a low reading, and a blank Settings sample, which shows the Settings link and no dollar figure. Axe stays clean at desktop width and at 390 pixels.
- Open text fails on a banned word, a sentence over 25 words, a brace, `undefined`, `NaN`, or `null`.
- The budget check includes the new page. The Friday record check still passes, and the projection file does not change a fire, a cash word, or a cycle card.

## Files

- `src/job/projection.ts` builds the cycles, the template, and the document.
- `src/job/run.ts` writes `projection.json` when it writes the Friday document.
- `src/projection/portfolio.ts` is the pure phase, price, buy, and reading math.
- `src/painter/projection.ts` and `src/painter/projection.css` paint the page.
- `src/client/projection.ts` fetches the two documents, reads Settings, and fills the page.
- `src/painter/site-header.ts` gains the tab. `scripts/build.mjs` emits `/projection/`.
- `test/projection.test.ts` and `test/browser.spec.ts` cover the list above.
