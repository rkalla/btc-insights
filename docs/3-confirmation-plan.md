# Confirmation plan

This plan is the checklist for an adversarial review. It is not the review. A later pass executes it and writes `docs/4-confirmation-findings.md`. That pass does not edit this file, `docs/goal.md`, `docs/1-signal-quality.md`, or `docs/2-signal-strategy.md`.

The author of the strategy does not get the last word. The review is there to fail claims, not to defend them.

## What is in scope

Read only these, in this order:

1. `docs/goal.md`
2. `docs/1-signal-quality.md`
3. `docs/2-signal-strategy.md`
4. This plan

A number that appears in the strategy and not in the quality write-up is unsupported by that write-up. The reviewer may check it against the backtest notes only if those notes are still on disk. If they are not, the verdict is Unverified. The reviewer does not run a new backtest, search for new signals, or browse the web.

Out of scope: building the dashboard, restyling the postures, refitting thresholds, and a deep-research pass. Outside attacks on the power law, the gold z-score, and the 5- and 10-year horizons wait until this internal review is done.

## Verdicts

Use only these words.

| Verdict | Use it when |
| --- | --- |
| Pass | The check is true on the page, and the evidence cited is the evidence the check names. |
| Fail | The check is false, or the strategy presents an untested rule as a tested result. |
| Extension | The strategy adds a rule the quality write-up does not contain. Reasonable is not a pass. |
| Conflict | Two of the source documents disagree, and no honest sentence makes both true. |
| Unverified | The claim needs a number that is not in the quality write-up and cannot be checked. |

A goal clause may also be marked **Refused**. That means the strategy declines the clause and points at a contrary result in the quality write-up. Refused is not Pass. The findings file counts Refused clauses separately from clauses the product actually meets.

## Rules the reviewer must not break

- Quote the sentence under review. A paraphrase that is easier to pass does not count.
- Do not call a goal clause met "in spirit."
- Do not treat Extension as Pass because the action shape is plausible.
- Do not blend the two audits into one grade.
- Do not add a signal, a posture, or a threshold to repair a failure.
- If a check can be read two ways, the verdict is Conflict.
- Do not update the strategy so that it passes.

## How to record each check

```
ID:
Verdict:
Quote:
Evidence:
What would have to change:
```

`Evidence` is a quote from `1-signal-quality.md` or `goal.md`, or the words "not in the quality write-up." `What would have to change` names which file would move, and does not draft the rewrite.

## Audit A — Does the strategy follow the quality write-up?

### A1. Record of the buy cross

Pass only if the strategy's dates, next-year results, dip range, and floor match the quality write-up: fires on 24 Jul 2015, 3 May 2019, 31 Jul 2020, 17 Mar 2023, and an open fire on 18 Sep 2026; next-year results +127%, +59%, +269%, +138%; dips from −9% to −27%; floor about 60%.

### A2. Record of the sell roll

Pass only if the strategy keeps 6 of 8, floor about 46%, the two failures at +565% and +85%, and the fire months June 2013, April 2014, August 2014, September 2017, March 2018, May 2018, May 2021, and December 2021. Fail if those fires are replaced by April 2013, December 2017, July 2019, or March 2021.

### A3. The lift stays out

Pass only if the strategy refuses the z-score cross that is not preceded by the power-law trough, and the reason is the 11 of 16 record including 2018, late 2021, and 2025.

### A4. The z-score is not its own action

Pass only if no posture keys off a z-score level alone. The quality write-up allows it only as an input to the buy cross.

### A5. The power law is not a weekly ladder

Pass only if the −20% and +55% lines do not by themselves release cash or pause cash. The quality write-up keeps them as the map and as inputs.

### A6. Every quality row has a disposition

Walk the quality table from buy cross through the structural map. For each row, say whether the strategy keeps it, narrows it, or drops it. A row the quality write-up marked "Keep" or "Optional" and that the strategy drops is a Conflict, not a quiet pass. The known cases to force:

- Macro pressure: the quality write-up says keep it as a thermometer and not as the action. The strategy leaves it off the chart.
- Six-rung action: the quality write-up says optional weekly instruction. The strategy does not use it.

### A7. One realized-price fact

Pass only if NUPL and the MVRV z-score cannot vote beside the realized-price ratio. The quality write-up says a ratio below 1, NUPL below 0, and a negative z-score are the same week.

### A8. The realized-price break is not a gate on the buy cross

Pass only if Deploy can fire when price has not traded under the realized price. The quality write-up says requiring that break would have dropped July 2020 and is not part of the rule.

### A9. Numbers that are only in the strategy

List every numeric claim in the strategy that is absent from the quality write-up. Each one is Extension or Unverified. Do not fill the gap with a new calculation. In particular, check the claim that the July 2020 fire was only about 18% under the trend. The quality write-up says waiting in 2020 meant paying about twice the trough price. It does not print −18%.

### A10. The 26-week build

The quality write-up says the cheap state is not a trigger and not a veto, that 79% of weeks under the realized price were followed by a 50% year across four spells, and that the first week of the break was right in 2 of 4 spells. It does not specify a 26-week slice, one tranche per spell, a stop after 26 weeks, or a leftover that returns to cash.

Verdict is Extension if the strategy presents that schedule as the measured action. It may stay Extension and still be a product proposal. It must not be Pass.

### A11. The three-Friday window

The quality write-up scores buying at the fire. It does not score the next two Fridays. Verdict is Extension if those two weeks are described as tested. Pass only if they are described as grace so a weekly viewer can see the fire.

### A12. Dollar shapes

Pass only if $5k, $50k, and $100k are the viewer's piles and not results of the study. Fail if any sentence treats those amounts as historically optimal.

### A13. Pause versus sell

The quality write-up scores whether the next year was flat or down. It does not score a pause in contributions, and it does not score a sale of coins. Verdict is Extension if "stand down" is described as what the study tested. The two failure years are still required on the same line as the posture.

### A14. Deploy plus Build in the same week

The quality write-up does not score a portfolio that releases a reserve and continues a build. Verdict is Extension if the strategy calls that combined week a tested maximum. The strategy must also keep the finding that July 2020, a deploy without the cheap state, was the strongest completed year.

### A15. The 80% badge rule inside the strategy

The quality write-up uses 85% for Very High, 70–84% for High, and finds both empty. The strategy's gate is a floor of 80% and at least eight episodes. Verdict is Extension. Those eight episodes and that 80% cut were not a result of the study.

### A16. Base rates

Pass only if the strategy's hurdles match the quality write-up: about 60% of weeks were followed by a 50% year, and always-buy-big scores about 54% on the rung scale.

### A17. Sample window

The quality write-up evaluates 2012 through September 2025 for finished 12-month results. Pass only if the strategy does not call that window "2010 through September 2026." Data existing back to 2010 is not the same claim as a test that starts in 2010.

## Audit B — Does the strategy meet the goal?

Quote each clause from `goal.md`. Judge the strategy against that sentence.

### B1. Proven 80%+ confidence

Clause: "a proven 80%+ confidence indicator of action."

Pass only if some posture the viewer can act on has a floor of at least 80% on the study's own terms. Refused if the strategy shows the action and prints a lower floor. Fail if the strategy prints 80% or a meter that implies it. Conflict if the only way to satisfy the clause is to badge a 4-of-4 record whose floor is about 60%.

### B2. Signals since 2010 through September 2026

Clause: "stood the test of time since 2010 through Sep 2026."

Pass only if the acted-on rules were scored on that whole span. Conflict if the scored span is 2012 through September 2025 and the September 2026 fire is still open. An open fire is not a finished test through September 2026.

### B3. Proven buy, sell, and hold

Clause: "proven guidance on times to buy/sell/hold."

Score buy, sell, and hold separately. A pass on buy does not pass sell or hold. Sell passes only if the study tested selling coins. Hold passes only if "stay the course" was itself a tested signal rather than the leftover state.

### B4. Stronger signals by combining atomic signals

Clause: "assemble higher-value Signal by assembling or synthesizing the atomic signals together to convey a stronger signal."

Pass only where a combination beat its parts on the study. The buy cross is the candidate. Fail the clause for any combination that did not beat its parts and is still used to move cash. The build tranche is not a combination. It is one series.

### B5. Guidance from all the signals

Clause: "based on the overall interpretation of all the Signals in the Dashboard."

Pass only if the directive is a reading of every signal the dashboard shows. Conflict if the dashboard's job is to leave most signals off so they cannot be interpreted into the call.

### B6. Spectrum from sell-all to go-all-in

Clause: "a spectrum of clear action ranging from 'Sell all Bitcoin' to 'Go All In'."

List the postures and mark which end of that spectrum, if either, exists. Stand down passes as "Sell all Bitcoin" only if coins are sold. Deploy passes as "Go All In" only if the boldest action matches the next clause.

### B7. $100,000 immediate buy

Clause: "Use $100,000 as the rough size of a 'Go All In' immediate-buy for the boldest action."

Pass only if the boldest buy is on the order of $100,000 and is immediate. A $50,000 reserve split across three Fridays is not that clause. Extension on the dollar figures in Audit A does not satisfy this.

### B8. Steps down, including steps out

Clause: "a spectrum of variations stepping down from that to indication more incremental steps into or out of Bitcoin."

Pass only if the postures include incremental steps in and incremental steps out. A pause of new buying is a step out of cash flows. It is not a step out of Bitcoin already held. Say which one the strategy has.

### B9. Dollar-cost averaging in and out

Clause: "switching to a dollar-cost-average in/out strategy if incremental steps make more sense."

Score averaging in and averaging out separately. Build is a candidate for averaging in. Nothing in the strategy averages out of coins already held.

### B10. Horizons of 1, 5, and 10 years

Clause: "maximize investment in Bitcoin over 1, 5 and 10 year time horizons."

Pass a horizon only if the quality write-up reports that horizon for the posture. The study's primary score is 12 months. A 24-month remark is not a 5-year result and not a 10-year result. An untested horizon is Missed, unless the findings show the strategy explicitly refusing it. The current goal text does not include a 20-year horizon. Do not add one.

### B11. The 26 September 2026 action

The strategy's worked example says Deploy on an open fire. Judge that example against B1 and B2. Acting on an unfinished episode can still be the product rule. It cannot be called proven through September 2026.

## What the findings file must decide

`docs/4-confirmation-findings.md` ends with four rulings. Each ruling picks one of: strategy yields, goal yields, or the user has to split the product. The reviewer recommends one and does not apply it.

1. **80%.** Can the product claim a proven 80% action, or does the quality write-up make that claim false?
2. **Ends of the spectrum.** Can one product contain "Sell all Bitcoin" and "Go All In" at about $100,000 immediate, and also respect the sell-roll failures and the untested dollar amounts?
3. **Horizons.** Which of 1, 5, and 10 years has evidence, and which are hopes?
4. **What "all the signals" means.** Does the goal require the dropped signals to remain on the chart, or may the chart show only the rules that beat owning Bitcoin outright?

Then a count: Pass, Fail, Extension, Conflict, Unverified, Refused. No overall grade that averages them away.

## After the findings exist

The user decides. The next goal, if any, is to amend `goal.md` or `2-signal-strategy.md` in the direction of that decision. It is not a goal to build the dashboard, and it is not a goal to rerun the signal search.
