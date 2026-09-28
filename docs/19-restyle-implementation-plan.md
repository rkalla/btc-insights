# Restyle plan

> **For agentic workers:** Execute this file with `/execute-plan docs/19-restyle-implementation-plan.md`. The `## PR Plan` at the end is the DAG that skill parses. Implement one pull request at a time, from the sections named in that pull request. Do not implement the pages in the same change that adds this file. This revision is tracked by one issue, [#28](https://github.com/rkalla/btc-insights/issues/28). Do not open another issue. Pull requests 1 through 3 contain `Refs #28`. Pull request 4 contains `Fixes #28`. Review fixes stay on #28.

**Status:** Ready to execute. 28 September 2026.

**Goal:** This week, Evidence, and Settings should look like one site, and Evidence should be readable without a glossary in the reader's lap. The signal rules do not change.

**Audit:** `docs/18-claude-restyle-audit-refinement-findings.pdf` is the 28 September 2026 review. This plan keeps its real findings and rejects the ones named under Corrections. This plan wins wherever the PDF disagrees.

## Authority

`docs/17-human-first-implementation-plan.md` stays the authority for This week's copy deck, the records, and the home-page swap, except the two This week edits in PR 1. This plan overrides only two decisions in docs/17: Evidence no longer stays on the dark dashboard theme, and Evidence no longer keeps the engine's sentences in the open page. Postures and records still come from `docs/2-signal-strategy.md`. Deploys follow `docs/deploy.md`.

## What the audit got right

- Evidence and Settings still use `dashboard.css`. This week uses `this-week.css`. The column widths are 680 px, a 1440 px grid, and 760 px. Settings has no site header, and its tab title is still `Bitcoin dashboard · Settings`.
- Evidence still leads with engine sentences (`Rule: All in, from the buy cross`, Wilson floors, z-score, fires). The glossary sits below the footer.
- Settings still says Coins held, Investable net worth, Ceiling share, Every, Account, and Not declared. Inputs use a monospace face.
- An official Friday close is stored as `2026-09-25T00:00:00Z`. In America/Phoenix that instant is Thursday, Sep 24, 5:00 pm. The Friday bar is complete at 00:00 UTC on Saturday, which is Friday, Sep 25, 5:00 pm in Phoenix.
- The chart's screen-reader note is `position: absolute` without a positioned ancestor, so it is placed against the page.
- `dashboard.css` has no `text-size-adjust`. This week does.
- "A cautious reading is about 6 times in 10 or better" is in the Why block and again in Has this worked before?

## Corrections

These are rejections of the audit. Do not implement them.

1. **Leave the price note's verb alone.** The sentence is `Prices move every day. The Friday advice stays put. Selling some Bitcoin can turn on during the week if your share crosses the limit you set.` The copy deck kept `crosses` on purpose. `test/this-week.test.ts` already expects that one hit and no others. Do not change the sentence to "goes over". Do not treat the test as broken.

2. **Do not move the stored Friday timestamp forward a day.** `chartTip.date` is `spotAsOf.slice(0, 10)`. Stamping `2026-09-26T00:00:00Z` would plot Friday's close on Saturday. Keep `spotAsOf` as `${friday}T00:00:00Z` for an official close. Shift only the label and the stale clock, and only when `isOfficialClose` is true and the stamp is `T00:00:00Z`. A later live quote keeps its real `spotAsOf` for both the label and the chart tip.

3. **Do not invent statistics.** The Friday file does not have a per-signal biggest drop or a per-signal at-once-versus-spread result. The published spread record is the range already in This week (+18% to +92% coins, 4 of 4), and the published worst dip is 27%. Do not add columns, job fields, or sentences for numbers that are not already in `fixtures/friday-2026-09-25.json` or `presentation`.

4. **Do not add `overflow-x: clip`.** It hides overflow. Fix the element that sticks out. The Pixel probe is for after deploy. It is not a reason to clip.

5. **Do not hardcode this week's All-in story into every state.** The Sep 18 signal, the $84,413 close, and the 41% gap are the current fixture's facts. Other fixtures (stand down, no call, sell, stale, build) must not claim them. Fill leads from the view model.

6. **Do not rewrite a published meaning into a new one.** `Missed 2019–20 and 2025–26` does not become "stayed off before those drops." The long-view line stays "99% or more of entry weeks," not a new rate. The monitor line stays the three items already published: hash-rate collapse, a signature break with no migration, and prohibition across major markets.

7. **Keep the GitHub footer link** added in `d06bd15`: the mark plus the word GitHub, href `https://github.com/rkalla/btc-insights`, on every page that has the site footer.

## Decisions

- One light theme, taken from This week's tokens (`--paper` `#F7F6F2`, `--buy` `#1F5ED6`, `--caution` `#A5520E`). No dark page remains.
- One content width, `--page-max: 680px`, on the header inner, the page, and the footer inner. Side padding, card gap, and card padding match This week: 16/20/20 px under 600 px, and 24/20/28 px from 600 px. The Evidence chart fills that column. It does not break out on desktop.
- Geist only. Figures use `font-variant-numeric: tabular-nums`. No Geist Mono, no `monospace`, no `text-transform: uppercase`.
- Chart on paper, each stroke at least 3:1 against white: price `--ink` 1.5 px solid, trend `--ink-2` 1.5 px solid, 20% below `--buy` 1 px dashed, 55% above `--caution` 1 px dashed, the band `--neutral-tint`, the 200-week average `--ink-3` 1 px dotted, buy marks `--buy`, caution marks `--caution`.
- Settings uses the same header. The gear has `aria-current="page"` there. The back link and the small SETTINGS label go away because the header replaces them. After Save, the browser still returns to This week (`index.html`). No toast.
- Evidence's open text follows This week's banned-word list. Technical lines live in `<details>` whose summary is `Show the numbers`, or in the glossary. The glossary moves above the footer.
- The layout probe and the two-reader check are not CI gates.

## Global constraints

- Do not change a cash posture, a fire date, a record, a Wilson floor, the gold flag, or the holder math.
- Do not deploy as root. `./scripts/deploy-site.sh` must print `locked`. Do not replace `/var/www/html/data/friday.json` or `live.json`.
- The page bundle still has no market host. The one allowed remote URL is `https://github.com/rkalla/btc-insights`.
- Each page stays under 51200 gzipped bytes, fonts excluded.
- Phone pages do not call market APIs. A later poll failure still must not wipe a loaded page.
- `npm test` and `npm run typecheck` pass before the pull request is ready. Node is 24. The test command is `node --test "test/**/*.test.ts"`.

## PR 1: Say the Friday close on Friday, and say the cautious reading once

The official-close label uses the end of that UTC day. For `spotAsOf` `2026-09-25T00:00:00Z` and `isOfficialClose` true, America/Phoenix reads `Friday, Sep 25, 5:00 pm`. America/New_York reads `Friday, Sep 25, 8:00 pm`. Europe/London reads `Saturday, Sep 26, 1:00 am`. UTC reads midnight at the end of Friday, 26 Sep 2026, using the existing midnight wording. A live quote whose `isOfficialClose` is false is formatted from its own timestamp with no 24-hour shift.

The stale clock uses that same end-of-day instant when the print is an official close stamped at `T00:00:00Z`. A page opened at `2026-09-26T02:00:00Z` is not stale. A page opened at `2026-09-27T02:00:00Z` is stale. The chart tip date for that close stays `2026-09-25`.

In the Buy strongly Why block, delete only the trailing sentence `A cautious reading is about 6 times in 10 or better.` The record section keeps `A cautious reading is about 6 times in 10 or better. Treat it as a strong hint, not a promise.` No other This week sentence changes. The `crosses` sentence stays, and its test stays.

Do not deploy this pull request by itself if the only visible change is the fixture clock. The live file's quote time is independent. No `friday.json` rewrite.

## PR 2: Share one light shell and keep the page inside the screen

Split CSS. `src/painter/site.css` holds the tokens, the Geist faces, the reset, `text-size-adjust`, body, header, tabs, gear, footer, `.page`, `.card`, headings, links, focus, `.sr-only`, and chips. `this-week.css` keeps only This week's pieces. New `src/painter/evidence.css` keeps the chart, the readings, the record table, the disclosures, and the glossary. New `src/painter/settings.css` keeps fields, the segmented control, the switch, the radios, and the actions. Delete `dashboard.css` and the dark tokens. Stop shipping Geist Mono once nothing references it.

`siteHeader` accepts `week`, `evidence`, and `settings`. Settings gets the header, with the gear current. Add one footer helper used by all three pages: the same disclaimer, Evidence, Settings, and the GitHub link. Titles: `This week · BTC Friday`, `Evidence · BTC Friday`, `Settings · BTC Friday`.

Evidence and Settings become light and 680 px wide in this pull request. Evidence's sentences stay as they are until PR 4, except the chart colors move to the paper palette above so lines stay visible. Settings labels stay as they are until PR 3. Remove the inline `max-width: 760px` from the settings page.

Layout hardening, all of it in this pull request:

- The chart figure is `position: relative`. The screen-reader note uses `.sr-only` and drops the inline absolute style.
- `svg, img, table { max-width: 100% }`. Grid tracks use `minmax(0, 1fr)`.
- `html` sets `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%`.
- Price rows and chips may wrap with `overflow-wrap: anywhere`.

`?debug=layout` paints a small fixed panel and red outlines, and is absent from the DOM without that query. The panel shows `innerWidth`, `documentElement.clientWidth`, `scrollWidth`, `visualViewport.width`, `visualViewport.scale`, `devicePixelRatio`, and the computed font size of a 16 px span. It outlines elements whose right edge passes `clientWidth` and names the first five. It writes nothing to storage or the network. Do not add `overflow-x: clip`.

Playwright, at 390 and 1440, checks that all three pages share the paper background, the header height, a content width of at most 680 px plus the page padding, the card radius, and the Geist family. At 320, 390, and 412, with text at 100% and at 130%, no page scrolls sideways. axe stays clean. The build fails if a page links `dashboard.css`, if a CSS file contains `#0C0F14`, `Geist Mono`, `monospace`, or `text-transform:uppercase`, or if a page omits `site.css`.

Deploy with `scripts/deploy-site.sh`. Do not touch `data/`.

## PR 3: Finish the Settings words

On the shared shell from PR 2, change only these labels and the matching help where the old noun would otherwise remain:

| Now | Becomes |
| --- | --- |
| Every | How often |
| Coins held | Bitcoin you own |
| Investable net worth | All your investments, including Bitcoin |
| Target share | Target share of your investments |
| Ceiling share | Upper limit |
| Not declared | Off |
| Date | The date you decided |
| Account | Where you hold it |

The switch's on state can stay a plain on-state. Do not rename the storage key, the input ids, or `settings.html`. IRA still omits the tax sentence. Blank, taxable, and fund still say a sale can create a tax bill. Placeholders stay `Not set`. The ceiling hint stays `Must be above your target.`

Fields are 44 px tall, white, 1 px `--line-strong`, 12 px radius. Focus is a 2 px `--buy` ring. Text is 17 px Geist with tabular figures. Affixes use `--ink-3`. Week and Month are two 44 px segments. The selected segment is `--ink` on white with a 1.5 px `--ink` border. The switch is `--buy` when on. On a phone, Save is a full-width `--buy` button and Cancel is a text link.

Deploy `settings.html` with the site script. Do not touch `data/`.

## PR 4: Rewrite Evidence in plain language

Evidence becomes the explanation of this week's advice. The h1 is `Why this week says {step}`, using the same step name This week uses for that posture (`Buy strongly`, `Add`, `Steady`, `Go slow`, `Pause`, `No update`). The lead is `Here's the reasoning behind this week's advice, in plain words. Tap Show the numbers under any section for the exact figures.`

Order, every state:

1. **The short version.** Up to three bullets drawn from this state's view model: what turned on or what the step is, where the Friday price sits against the trend, and the record sentence already published for this posture. No bullet may cite the All-in record unless this state is All in.
2. **Where Bitcoin is now.** One plain sentence, then the chart. Under 768 px the marker control says `Show past signals` and keeps the current sheet behavior. `Show the numbers` holds the fit-range sentence and the 200-week note, reworded only as far as the published words allow.
3. **The signal that turned on**, or **No signal turned on** when this state has no open or completed fire to explain. A short timeline of the dates the document already has (arm, fire, last grace). `Show the numbers` holds the z-score and gold-flag lines that already exist.
4. **What happened the last times.** A table of the published history rows only: year, the fire price when the cycle data already has it, and the one-year percent. Then the cautious sentence already used on This week for this posture. No new drawdown column and no new spread column.
5. **What else we check.** Three rows from the existing context: caution signal, realized price, and the blend. Each row is a plain name, a short status, and one sentence. The numbers panel keeps the published note, including `Missed 2019–20 and 2025–26` when that note is the source.
6. **Your Bitcoin.** One sentence from the holder state: keep, trim, or exit, including the blank-settings case. Settings is a link. No Trim or Exit chips in the open page.
7. **The long view.** The published statement and caveat, in plain words, with `99% or more` unchanged. Then the three monitors, in plain words, labeled as watched rather than triggers.
8. **How early each signal was.** A `<details>` closed by default. The summary is that heading. The existing cards follow. Row names on the cards become `Buy strongly signal`, `Add each week`, and `Add at once`. The detail lines stay in the panel.
9. **What the terms mean.** The current glossary, above the footer. Drop a term only if it no longer appears anywhere on the page, including inside `Show the numbers`.

Delete from the open page: the official-call clock line, the posture badge, the cash window bars, the duplicate action line (`Use your cash available to invest` and the standing-contribution sentence), and `Selected marker: detail only`. The action lives on This week. Evidence links back to `/`.

`Show the numbers` is the summary text on every disclosure except the cycle section, whose summary is the section heading. Each summary says what it opens. Banned-word hits outside `details` and the glossary fail the test. Every fixture state paints with one h1, no `{`, and no `undefined`. The glossary precedes the footer in the DOM.

Deploy with `scripts/deploy-site.sh`. Do not touch `data/`. On https://btcfriday.app and https://btcfriday.exe.xyz, `/` still shows `A strong week to buy Bitcoin.` and does not show `19 times in 20`. `/evidence/` shows `Why this week says Buy strongly` and does not show `Wilson` in the open page. Settings shows `Bitcoin you own` and `Settings · BTC Friday`.

## After deploy, not in CI

- On a Pixel, open `/`, `/evidence/`, and `/settings.html` with `?debug=layout` in portrait. The pass is `scrollWidth` equal to `clientWidth`, a visual-viewport scale of 1, and no red outlines. Send the three screenshots if any outline remains. The next change fixes the named element. It does not add `overflow-x: clip` first.
- Two people who don't invest read Evidence for a minute and say why the page says Buy strongly and what could go wrong, without asking what a term means. On a failure, change the Evidence lead copy and retest. Do not change a record.

## Work log

Issue [#28](https://github.com/rkalla/btc-insights/issues/28) is the log for this whole restyle. Do not open another issue. Pull requests 1 through 3 contain `Refs #28`. Pull request 4 contains `Fixes #28`.

## PR Plan

### PR 1: Say the Friday close on Friday, and say the cautious reading once

- **Description:** When `isOfficialClose` is true and `spotAsOf` is `T00:00:00Z`, format the This week price label and the stale age from the following UTC midnight. Do not change the stored stamp or the chart tip date. The 25 Sep 2026 close reads `Friday, Sep 25, 5:00 pm` in America/Phoenix, `Friday, Sep 25, 8:00 pm` in America/New_York, `Saturday, Sep 26, 1:00 am` in Europe/London, and midnight on 26 Sep 2026 in UTC. A non-official quote is not shifted. Opened at `2026-09-26T02:00:00Z` the official close is not stale. Opened at `2026-09-27T02:00:00Z` it is stale. In the Buy strongly Why block, remove only the second copy of `A cautious reading is about 6 times in 10 or better.` Leave that sentence in Has this worked before? Do not change the `crosses` price note, and do not weaken the test that allows only that hit. No deploy. Read PR 1. Refs #28. Do not open a new issue.
- **Files/components affected:** src/compose/plain.ts, src/compose/view-model.ts, src/copy/thisWeek.ts, test/this-week.test.ts, test/this-week-page.test.ts
- **Dependencies:** None

### PR 2: Share one light shell and keep the page inside the screen

- **Description:** Add `src/painter/site.css`, `src/painter/evidence.css`, and `src/painter/settings.css`. Move the shared shell out of `this-week.css`. Delete `dashboard.css`, the dark tokens, and Geist Mono once nothing references them. Every page uses the light tokens, the site header, the shared footer including the GitHub link, and a 680 px column. Settings gets the header and `aria-current` on the gear. Its tab title becomes `Settings · BTC Friday`. Evidence keeps its current sentences and becomes light, with the paper chart colors in the Decisions section. Chart figure is `position: relative` and the screen-reader note uses `.sr-only`. Add `svg, img, table { max-width: 100% }`, `minmax(0, 1fr)` tracks, `text-size-adjust: 100%`, and wrapping on price rows and chips. `?debug=layout` shows the probe and is absent otherwise. Do not add `overflow-x: clip`. Playwright checks the shared shell at 390 and 1440 and no sideways scroll at 320, 390, and 412 at 100% and 130% text. The build fails on `dashboard.css`, `#0C0F14`, `Geist Mono`, `monospace`, or `text-transform:uppercase`. Deploy with `scripts/deploy-site.sh` and do not touch `data/`. Read PR 2. Refs #28. Do not open a new issue.
- **Files/components affected:** src/painter/site.css, src/painter/this-week.css, src/painter/evidence.css, src/painter/settings.css, src/painter/site-header.ts, src/painter/dashboard.ts, src/painter/settings.ts, src/painter/chart.ts, scripts/build.mjs, scripts/check-budget.mjs, test/browser.spec.ts, test/css.test.ts
- **Dependencies:** PR 1

### PR 3: Finish the Settings words

- **Description:** Relabel Settings to the table in PR 3: How often, Bitcoin you own, All your investments including Bitcoin, Target share of your investments, Upper limit, Off, The date you decided, and Where you hold it. Keep ids, `settings.html`, and `btc-insights.settings.v1`. Keep the IRA tax rule, `Not set`, and `Must be above your target.` Apply the 44 px fields, the segment control, the switch, and the full-width Save button from PR 3. Deploy with `scripts/deploy-site.sh` and do not touch `data/`. Read PR 3. Refs #28. Do not open a new issue.
- **Files/components affected:** src/painter/settings.ts, src/painter/settings.css, test/paint.test.ts, test/browser.spec.ts
- **Dependencies:** PR 2

### PR 4: Rewrite Evidence in plain language

- **Description:** Rebuild the Evidence page to the nine sections in PR 4. The h1 is `Why this week says {step}` from the same step names as This week. Open text has a plain lead and no banned word outside `details` and the glossary. `Show the numbers` holds the existing technical lines. Do not add per-signal drawdowns or per-signal spread figures. Do not change `99% or more` or rewrite `Missed 2019–20 and 2025–26` into a new claim. The cycle block is a closed `details`. The glossary sits above the footer. Every fixture state paints. Delete the official-call line, the window bars, and the duplicate cash instruction. Deploy with `scripts/deploy-site.sh` and do not touch `data/`. Verify both hosts: `/` still shows `A strong week to buy Bitcoin.` and not `19 times in 20`; `/evidence/` shows `Why this week says Buy strongly` and the open page does not show `Wilson`; Settings shows `Bitcoin you own`. Fixes #28. Do not open a new issue.
- **Files/components affected:** src/painter/dashboard.ts, src/painter/evidence.css, src/compose/view-model.ts, test/paint.test.ts, test/browser.spec.ts, test/this-week-page.test.ts
- **Dependencies:** PR 3
