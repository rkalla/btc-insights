# Tech stack approach

Locked 26 September 2026.

This file is the implementation approach for the dashboard. Signal rules stay in `docs/2-signal-strategy.md`. The words on the page stay in `docs/7-friday-wireframe.md`. Look, layout, and states stay in `docs/9-claude-design-specification.pdf`, built to `docs/10-claude-design-reference.html` and `docs/11-claude-design-settings.html`. When those disagree, the wireframe's words win, then the design spec, then the reference HTML.

This file is the later decision on two points where the design spec offered a choice. The production page is a small static painter, not a React app. The levels that are allowed to move do so from a shared cache about every 10 minutes, not from a live exchange stream and not only when someone opens the page. The design spec's ban on motion still holds: numbers are replaced in place, and the cash and coins calls do not pulse.

## Two clocks

The official call changes at the Friday close, 00:00 UTC Saturday. That close sets the cash posture, the record, the floor, the episode count, the rails, arming, and firing. A print between Fridays that would have armed or fired is labeled developing and ends with "Not an official fire." It leaves the official call where it is.

These fields move with the latest cached print, using the last Friday's frozen fit and anchors:

- Spot, the gap against Friday's trend, and the chart tip.
- The developing z-score, with the latest Bitcoin and gold prices standing in for the current week only.
- The realized-price ratio, using the latest spot and the newest daily realized price.
- Current-cycle progress, using the latest spot against the frozen cycle low, high, and entries.

Finished cycle cards, the context block's Friday readings, the 5-year and 10-year panel, and the record do not move with that print. Each live series shows its own as-of time. A shut gold market shows the last close and is forward-filled for at most 10 days, which is the rule already in the strategy. A series older than 26 hours uses the design spec's stale-print state. The official call stays up.

## What the phone loads

The page is static files on the VM. A phone downloads the shell, `/data/friday.json`, and `/data/live.json`, then stops. It never calls a market API, and it never opens a websocket.

`/data/friday.json` is the official call, the record, the Friday context, the finished cycle cards, the weekly chart from 2013, and the frozen anchors the progress card needs. nginx sends `Cache-Control: public, max-age=86400`. Compact JSON for that chart is about 15 KB after compression.

`/data/live.json` is about 1 KB. It carries the Friday date the official document belongs to, spot, gap, trend, the developing sentence or null, the realized-price ratio and that cap's date, gold with its as-of time and whether the print is a fill, the chart tip, the current-cycle progress rows, and an as-of time for each series. nginx sends `Cache-Control: public, max-age=60`. The phone refetches it only while the tab is visible, and no more often than the job that writes it. When the Friday date in the live slice is not the date of the Friday document the page already has, the page fetches `friday.json` again and bypasses that long cache. A hidden tab does not poll.

First-load budget, compressed: the HTML, CSS, and JavaScript together under 50 KB, excluding fonts. The Friday document about 15 KB. The live slice about 1 KB. No third-party request on first paint. No image assets. The chart is SVG drawn with plain math on a log scale. A charting library is out, as the design spec already requires. `d3` is out as well, unless a later measurement shows the size budget still holds with one scale function imported.

Typeface is Geist and Geist Mono, the weights named in the design spec, self-hosted as a Latin `woff2` subset with `font-display: swap`. The reference files may link a font host. Production does not.

The painter starts from the two reference HTML files. It fills sentences from the documents. It does not fit the trend, score the official z, or choose the cash posture.

## Holder settings stay on the device

Coins held, investable net worth, the target share, the ceiling share, the thesis declaration and its date, the account type, and the dollar amounts for the three piles are stored in the browser. They are not in the public cache, and there is no login to host. The public repo stays free of secrets. `.gitignore` already ignores `.env` files. API keys live in the host's secret store.

The Friday document names piles and omits personal dollars. When an amount is saved on the device, the painter inserts that dollar clause. A blank amount removes the dollar clause. "Up to $100,000." becomes "Use your cash available to invest." The page invents no dollar figure.

The cash posture still comes only from the Friday document. Two holder rules are applied on the device, because their inputs never leave it:

- Trim turns on only when coins held, investable net worth, the target, and the ceiling are all present, and coins times the latest spot divided by investable net worth is at or above the ceiling. The sale is down to the target, as the strategy already specifies.
- Exit turns on only when a dated "Thesis broken" declaration is saved.

Otherwise the coin line stays Hold, with Trim off and Exit off. Account type is stored and does not produce a tax rate. Tax remains a line.

## The only job that calls APIs

One scheduled JavaScript function on a free worker tier is the only caller of upstream APIs. It writes the Friday document and the live slice. Phones, and any number of them, read those files. A hundred visitors do not multiply the API use.

The function holds the frozen Friday state: the trend price, the inputs for the developing z-score (the prior Friday ratios, with the current week replaceable), the latest realized price and its date, and the cycle anchors. On each poll it applies that state to the new prints. It does not refit the power law between Fridays.

| Series | Role | Interval | Upstream |
|---|---|---|---|
| Bitcoin spot | Now, gap, chart tip, progress, realized-price ratio | Every 10 minutes | Free Bitcoin price API. Planning figure: a CoinGecko demo key, about 10,000 credits a month and about a year of history. |
| Gold | Developing z-score only, until the cross check below | Every 10 minutes | `GOLD_QUOTE_URL`. When `GOLD_QUOTE_API_KEY` is set, the job sends it as `X-API-Key`. The XAUUSD snapshot last trade is the developing print. |
| Realized price | Denominator of the ratio | Once a day | Coin Metrics community. |
| New daily Bitcoin close | Friday fit and the official history | Once a day | Coin Metrics community `PriceUSD`. |
| History back to 2010 | The one-time backfill | Once | Coin Metrics community. |

A poll every 10 minutes is about 4,300 calls a month for Bitcoin. That fits a 10,000-credit key and leaves room for retries. Vendor pages disagree on the demo plan's per-minute cap, so the locked number is the interval, not a vendor slogan. If the key's monthly cap is tighter than 10,000, lengthen the Bitcoin interval until the month fits, and keep the retries inside the cap. The page already shows the as-of time, so a slower poll stays honest.

CoinGecko's short history is not the power-law source. The official daily close, the Friday refit, and the reproduced fires use Coin Metrics community daily bars. The community API allows 10 requests per 6 seconds per IP. One new row a day is the whole ongoing use.

That gold quote feeds the developing score. The operator's URL is the sifting.io commodities snapshot for XAUUSD, and the snapshot requires gzip. It does not replace the official Friday z-score until a check shows the z-score still crosses zero on the same Fridays. Until that check, the official gold series remains the study series, COMEX filled forward at most 10 days, and the study fire dates stay the record.

On a rate-limit response or any other upstream failure, the job keeps the last good print, backs off, and does not retry in a loop. The page continues to show that print and its as-of time.

The Friday function runs at 00:05 UTC Saturday and retries until that Friday's daily bar is present. It publishes the new official document only when the bar is present. The previous official call stays up during the retries. If the bar is still absent at 06:00 UTC Saturday, the page uses the design spec's missing-close state. That deadline is an operational timeout. It is not a new signal rule. A daily append through the week updates history and the realized price. It does not change the official call.

## Hosting

The site is hosted on the exe.dev VM `btcfriday.exe.xyz`. nginx serves `/var/www/html` on port 8000, and exe.dev terminates HTTPS. Every deploy follows `docs/deploy.md`: the tree stays owned by `exedev`, directories are mode `2750`, files are mode `640`, and the nginx worker (`www-data`) can read the site and cannot write it. The scheduled function runs on that VM as `exedev`, with `umask 027`, and writes `/var/www/html/data/friday.json` and `/var/www/html/data/live.json`. No process stays connected to an exchange. That connected process is the piece that would start to cost money.

Python stays in the repository and runs in CI. It does not run in production. CI checks the production Friday function against the published record: the completed buy-cross fires and their next-year results, the open 18 September 2026 fire, the gold-share results already measured (completed arms at 0%, the 21 November 2025 arm at 24.5% against the 15% cut), and the cycle-capture shares in `docs/1-signal-quality.md`. A second fixture sends a new spot through the live slice and checks that the gap, the chart tip, and the progress rows move, and that the cash word, the rails, and the record do not.

The public cache holds market data and the official call. It does not hold holdings, net worth, settings, API keys, or the live working set of the job.

## Work log

Work on this repo is recorded at <https://github.com/rkalla/btc-insights/issues>. The issue list is the log of slices that shipped and of later changes. The specs stay in `docs/`. An issue records that a slice happened. It does not replace a locked document.

One issue covers one reviewable slice. During the dashboard build, that slice is one pull request in `docs/13-implementation-plan.md`. Open the issue when that pull request starts, before the code. The title is the plan id and the pull request title, for example `PR 3: Add device settings and holder rules`. The body links that pull request's section in the plan and states the acceptance in a few sentences. Search open issues for that title first, and reuse the match if the slice is retried.

The pull request body contains `Fixes #N`. Merging to `main` closes the issue. Review comments, extra tests, and files inside the slice stay on that same issue.

Later changes use the same unit. Open an issue when the change alters a locked rule, a sentence on the page, the stack, a signal, a vendor, or behavior a holder can see. A wording fix that leaves behavior and locked sentences alone can ship on a pull request with no new issue. The six studies under "Next tests" in `docs/2-signal-strategy.md` get an issue when a study starts.

The human-first revision is the exception recorded in advance. It is issue [#18](https://github.com/rkalla/btc-insights/issues/18) and `docs/17-human-first-implementation-plan.md`. Pull requests for that plan do not open a second issue. They contain `Refs #18` until the pull request that makes This week the public home page, which contains `Fixes #18`.

Issues are public. They carry no API keys, no `.env` values, no holdings, and no net worth. No project board and no extra labels are required.

A finished change lands without a separate prompt to commit, push, open a pull request, or merge. Commit it, push the branch, open the pull request into `main`, and merge it. The pull request body contains `Fixes #N` when an issue should close. Tests for that change pass before the merge. `.env` files and other secrets stay uncommitted. An unfinished attempt, a question, or a throwaway experiment does not get a pull request. Do not force-push.

## Left for later

A free exchange quote stream may replace the Bitcoin poll. The live slice remains the contract the phone reads, so the page does not change.

A store that syncs settings across devices is a later decision. Those fields stay out of the public cache.

A posture-change alert is still phase 2, as the design spec left it. It is not part of this lock.
