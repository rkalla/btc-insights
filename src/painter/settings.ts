import { backIcon } from "./icons.ts";

export function paintSettings(): string {
  return `<main class="page" style="max-width:760px">
  <div class="topbar">
    <a class="back" href="index.html">${backIcon()}Back to dashboard</a>
    <span class="label">Settings</span>
  </div>
  <h1>Settings</h1>
  <p class="intro">The dashboard reads these amounts. It does not place an order.</p>

  <form class="panel" aria-labelledby="h-standing" onsubmit="return false">
    <h2 id="h-standing">Standing contribution</h2>
    <div class="fields-2">
      <div class="field"><label for="standing-amount">Amount</label><div class="input"><span class="affix">$</span><input id="standing-amount" inputmode="decimal" placeholder="Not set" aria-describedby="standing-hint"></div><span class="hint" id="standing-hint">Shape, if you have not chosen: about $5,000.</span></div>
      <div class="field"><span class="legend" id="every-label">Every</span>
        <div class="seg" role="radiogroup" aria-labelledby="every-label">
          <input type="radio" name="every" id="every-week" value="week"><label for="every-week">Week</label>
          <input type="radio" name="every" id="every-month" value="month"><label for="every-month">Month</label>
        </div>
      </div>
    </div>
  </form>

  <form class="panel" aria-labelledby="h-build" onsubmit="return false">
    <h2 id="h-build">Build tranche</h2>
    <div class="field"><label for="build-amount">Amount</label><div class="input"><span class="affix">$</span><input id="build-amount" inputmode="decimal" placeholder="Not set" aria-describedby="build-hint"></div><span class="hint" id="build-hint">Shape, if you have not chosen: about $100,000, sliced on cheap Fridays.</span></div>
  </form>

  <form class="panel" aria-labelledby="h-cash" onsubmit="return false">
    <h2 id="h-cash">Cash available to invest</h2>
    <p class="help">Used by All in, Lump in, and Slow in. This amount is not refilled in order to wait for the next cross.</p>
    <div class="field"><label for="cash-amount">Amount</label><div class="input"><span class="affix">$</span><input id="cash-amount" inputmode="decimal" placeholder="Not set" aria-describedby="cash-hint"></div><span class="hint" id="cash-hint">Shape, if you have not chosen: up to $100,000 on an All-in fire.</span></div>
  </form>

  <form class="panel" aria-labelledby="h-trim" onsubmit="return false">
    <h2 id="h-trim">Trim</h2>
    <p class="help">Any blank means Trim stays off.</p>
    <div class="fields-2">
      <div class="field"><label for="coins-held">Coins held</label><div class="input"><input id="coins-held" inputmode="decimal" placeholder="Not set"><span class="affix">BTC</span></div></div>
      <div class="field"><label for="net-worth">Investable net worth</label><div class="input"><span class="affix">$</span><input id="net-worth" inputmode="decimal" placeholder="Not set"></div></div>
      <div class="field"><label for="target-share">Target share</label><div class="input"><input id="target-share" inputmode="decimal" placeholder="Not set"><span class="affix">%</span></div></div>
      <div class="field"><label for="ceiling-share">Ceiling share</label><div class="input"><input id="ceiling-share" inputmode="decimal" placeholder="Not set" aria-describedby="ceiling-rule"><span class="affix">%</span></div><span class="hint" id="ceiling-rule">Must be above the target share.</span></div>
    </div>
  </form>

  <form class="panel" aria-labelledby="h-thesis" onsubmit="return false">
    <h2 id="h-thesis">Thesis</h2>
    <div class="switch-row">
      <div class="field"><span class="legend" id="thesis-label">Thesis broken</span><span class="state" id="thesis-state">Not declared</span></div>
      <button type="button" class="switch" role="switch" aria-checked="false" aria-labelledby="thesis-label" aria-describedby="thesis-state"></button>
    </div>
    <div class="field"><label for="thesis-date">Date</label><div class="input"><input id="thesis-date" type="date" disabled aria-describedby="thesis-help"></div></div>
    <p class="help" id="thesis-help">Not declared means Exit stays off. This is a holder record, not a signal override.</p>
  </form>

  <form class="panel" aria-labelledby="h-account" onsubmit="return false">
    <h2 id="h-account">Account</h2>
    <fieldset class="radios" aria-labelledby="h-account">
      <div class="radio"><input type="radio" name="account" id="acct-taxable" value="taxable"><label for="acct-taxable">Taxable</label></div>
      <div class="radio"><input type="radio" name="account" id="acct-ira" value="ira"><label for="acct-ira">IRA</label></div>
      <div class="radio"><input type="radio" name="account" id="acct-fund" value="fund"><label for="acct-fund">Fund</label></div>
    </fieldset>
    <p class="help">Blank means the page does not compute tax. After-tax dollars are not a score until this is set.</p>
  </form>

  <div class="actions">
    <a class="btn btn--ghost" href="index.html" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Cancel</a>
    <button type="button" class="btn btn--primary">Save settings</button>
  </div>
</main>`;
}
