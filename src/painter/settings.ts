import { backIcon } from "./icons.ts";

export function paintSettings(): string {
  return `<main class="page" style="max-width:760px">
  <div class="topbar">
    <a class="back" href="index.html">${backIcon()}Back to dashboard</a>
    <span class="label">Settings</span>
  </div>
  <h1>Settings</h1>
  <p class="intro">These amounts personalise This week. They stay on this device and are never sent anywhere. BTC Friday never places orders.</p>

  <form class="panel" aria-labelledby="h-standing" onsubmit="return false">
    <h2 id="h-standing">Regular buy</h2>
    <p class="help" id="standing-help">The amount you put into Bitcoin on a schedule, whatever the market does.</p>
    <div class="fields-2">
      <div class="field"><label for="standing-amount">Amount</label><div class="input"><span class="affix">$</span><input id="standing-amount" inputmode="decimal" placeholder="Not set" aria-describedby="standing-help"></div></div>
      <div class="field"><span class="legend" id="every-label">Every</span>
        <div class="seg" role="radiogroup" aria-labelledby="every-label">
          <input type="radio" name="every" id="every-week" value="week"><label for="every-week">Week</label>
          <input type="radio" name="every" id="every-month" value="month"><label for="every-month">Month</label>
        </div>
      </div>
    </div>
  </form>

  <form class="panel" aria-labelledby="h-build" onsubmit="return false">
    <h2 id="h-build">Extra for cheap stretches</h2>
    <p class="help" id="build-help">Money you'd add a little at a time, each week, while Bitcoin trades below what the average holder paid.</p>
    <div class="field"><label for="build-amount">Amount</label><div class="input"><span class="affix">$</span><input id="build-amount" inputmode="decimal" placeholder="Not set" aria-describedby="build-help"></div></div>
  </form>

  <form class="panel" aria-labelledby="h-cash" onsubmit="return false">
    <h2 id="h-cash">Money set aside for Bitcoin</h2>
    <p class="help" id="cash-help">Money you'd put in when This week says Buy strongly or Add, or spread out when it says Go slow.</p>
    <div class="field"><label for="cash-amount">Amount</label><div class="input"><span class="affix">$</span><input id="cash-amount" inputmode="decimal" placeholder="Not set" aria-describedby="cash-help"></div></div>
  </form>

  <form class="panel" aria-labelledby="h-trim" onsubmit="return false">
    <h2 id="h-trim">Take profits</h2>
    <p class="help" id="trim-help">Tell us what you hold, and This week will say when Bitcoin has grown too big a part of your investments. Leave any field blank to turn this off.</p>
    <div class="fields-2">
      <div class="field"><label for="coins-held">Coins held</label><div class="input"><input id="coins-held" inputmode="decimal" placeholder="Not set"><span class="affix">BTC</span></div></div>
      <div class="field"><label for="net-worth">Investable net worth</label><div class="input"><span class="affix">$</span><input id="net-worth" inputmode="decimal" placeholder="Not set"></div></div>
      <div class="field"><label for="target-share">Target share</label><div class="input"><input id="target-share" inputmode="decimal" placeholder="Not set"><span class="affix">%</span></div></div>
      <div class="field"><label for="ceiling-share">Ceiling share</label><div class="input"><input id="ceiling-share" inputmode="decimal" placeholder="Not set" aria-describedby="ceiling-rule"><span class="affix">%</span></div><span class="hint" id="ceiling-rule">Must be above your target.</span></div>
    </div>
  </form>

  <form class="panel" aria-labelledby="h-thesis" onsubmit="return false">
    <h2 id="h-thesis">I've decided Bitcoin's long-term case is broken</h2>
    <p class="help" id="thesis-help">Turn this on only if you've decided to get out of Bitcoin for good. This week will then tell you to sell and stop buying. You can turn it off at any time.</p>
    <div class="switch-row">
      <div class="field"><span class="state" id="thesis-state">Not declared</span></div>
      <button type="button" class="switch" role="switch" aria-checked="false" aria-labelledby="h-thesis" aria-describedby="thesis-state"></button>
    </div>
    <div class="field"><label for="thesis-date">Date</label><div class="input"><input id="thesis-date" type="date" disabled aria-describedby="thesis-help"></div></div>
  </form>

  <form class="panel" aria-labelledby="h-account" onsubmit="return false">
    <h2 id="h-account">Account</h2>
    <fieldset class="radios" aria-labelledby="h-account">
      <div class="radio"><input type="radio" name="account" id="acct-taxable" value="taxable"><label for="acct-taxable">A regular (taxable) account</label></div>
      <div class="radio"><input type="radio" name="account" id="acct-ira" value="ira"><label for="acct-ira">A retirement account (IRA)</label></div>
      <div class="radio"><input type="radio" name="account" id="acct-fund" value="fund"><label for="acct-fund">A fund</label></div>
    </fieldset>
    <p class="help">BTC Friday doesn't calculate taxes. This only decides whether tax reminders appear.</p>
  </form>

  <div class="actions">
    <a class="btn btn--ghost" href="index.html" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Cancel</a>
    <button type="button" class="btn btn--primary">Save settings</button>
  </div>
</main>`;
}
