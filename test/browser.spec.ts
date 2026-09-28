import { readFileSync } from "node:fs";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function overflows(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
}

test("bundles do not name a market client", () => {
  const js = ["dist/assets/dashboard.js", "dist/assets/settings.js", "dist/assets/this-week.js"]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const word of ["coingecko", "coinmetrics", "api_key", "GOLD_QUOTE", "wss://", "WebSocket"]) {
    expect(js.includes(word), word).toBe(false);
  }
});

for (const width of [1440, 1100, 390]) {
  test(`dashboard at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/evidence/");
    await expect(page.getByRole("heading", { name: "Buy strongly" })).toBeVisible();
    await expect(page.locator("body")).toContainText("Rule: All in, from the buy cross");
    await expect(page.locator("header.site a[aria-current='page']")).toHaveText("Evidence");
    await expect(page.locator(".spectrum")).toHaveCount(0);
    await expect(page.locator(".disagreement")).toHaveCount(0);
    await expect(page.locator("body")).toContainText("Use your cash available to invest.");
    await expect(page.locator("body")).not.toContainText("$100,000");
    const show = page.locator(".show-fires");
    if (width < 768) {
      await expect(show).toBeVisible();
      await expect(page.locator(".marker")).toHaveCount(0);
    } else {
      await expect(show).toBeHidden();
      await expect(page.locator(".marker").first()).toBeAttached();
    }
    expect(await overflows(page)).toBe(false);
  });
}

for (const width of [1440, 390]) {
  test(`settings at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/settings.html");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(page.getByLabel("Amount").first()).toBeVisible();
    expect(await overflows(page)).toBe(false);
  });
}

test("no horizontal scroll at 320", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/evidence/");
  await expect(page.getByRole("heading", { name: "Buy strongly" })).toBeVisible();
  expect(await overflows(page)).toBe(false);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
  expect(await overflows(page)).toBe(false);
  await page.goto("/settings.html");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  expect(await overflows(page)).toBe(false);
});

test("axe is clean on the dashboard and settings", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/evidence/");
    await expect(page.getByRole("heading", { name: "Buy strongly" })).toBeVisible();
    const dashboard = await new AxeBuilder({ page }).analyze();
    expect(dashboard.violations, `${width} ${JSON.stringify(dashboard.violations, null, 2)}`).toEqual([]);
  }
  await page.goto("/settings.html");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  const settings = await new AxeBuilder({ page }).analyze();
  expect(settings.violations, JSON.stringify(settings.violations, null, 2)).toEqual([]);
});

test("a desktop marker opens one popover and escape returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/evidence/");
  await expect(page.getByRole("heading", { name: "Buy strongly" })).toBeVisible();
  const marker = page.locator('.marker[data-date="2023-03-17"]');
  const pop = page.locator(".fire-popover");
  await marker.click();
  await expect(pop).toContainText("Buy cross · 17 Mar 2023");
  await expect(pop).toContainText("Finished year: +138%");
  await expect(page.locator(".fire-popover")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  await expect(marker).toBeFocused();
  await marker.click();
  await expect(pop).toBeVisible();
  await marker.click();
  await expect(pop).toBeHidden();
  await marker.click();
  await page.locator("h1").click();
  await expect(pop).toBeHidden();
});

test("show fires lists newest first under 768", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/evidence/");
  await expect(page.getByRole("heading", { name: "Buy strongly" })).toBeVisible();
  await page.getByRole("button", { name: "Show fires" }).click();
  const dialog = page.getByRole("dialog", { name: "Fires" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".fire-row").first()).toContainText("Open. Not in the completed count.");
  await expect(dialog.locator(".fire-row").last()).toContainText("Jun 2013");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Show fires" })).toBeFocused();
});

test("save writes the device settings and returns to the dashboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/settings.html");
  await page.fill("#cash-amount", "2500");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.waitForURL(/index\.html$/);
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
  await expect(page.locator("body")).toContainText("$2,500");
  const saved = await page.evaluate(() => localStorage.getItem("btc-insights.settings.v1"));
  expect(saved).toContain("2500");
});

test("this week bundle has no font host or market host", () => {
  const html = readFileSync("dist/this-week/index.html", "utf8");
  const css = readFileSync("dist/assets/this-week.css", "utf8");
  const js = readFileSync("dist/assets/this-week.js", "utf8");
  const blob = `${html}\n${css}\n${js}`.toLowerCase();
  for (const word of ["fonts.googleapis.com", "fonts.gstatic.com", "coingecko", "coinmetrics", "api_key", "wss://", "websocket"]) {
    expect(blob.includes(word), word).toBe(false);
  }
  expect(blob.includes("https://") || blob.includes("http://"), "remote url").toBe(false);
  expect(html).toContain('rel="icon" href="/favicon.ico" sizes="48x48"');
  expect(html).toContain('rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32"');
  expect(html).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
  expect(html).not.toContain("devbar");
  const index = readFileSync("dist/index.html", "utf8");
  expect(index).toContain("Loading this week's advice.");
  expect(index).toContain("/assets/this-week.js");
  expect(index).toContain('rel="icon" href="/favicon.ico" sizes="48x48"');
  expect(index).not.toContain("Bitcoin dashboard");
  const evidence = readFileSync("dist/evidence/index.html", "utf8");
  expect(evidence).toContain('aria-current="page">Evidence');
  expect(evidence).toContain("/assets/dashboard.js");
  expect(evidence).toContain('rel="icon" href="/favicon.ico" sizes="48x48"');
  expect(evidence).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
  expect(evidence).not.toContain("spectrum");
});

for (const width of [320, 390, 1440]) {
  test(`this week at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const current = page.locator('ol.scale li[aria-current="step"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText("Buy strongly");
    await expect(page.getByRole("list", { name: "Advice scale, from most cautious to most eager" })).toBeVisible();
    await expect(page.getByRole("link", { name: "This week" })).toHaveAttribute("aria-current", "page");
    const order = await page.locator("body").evaluate(() => {
      return [...document.querySelectorAll("header.site, #week > *, footer.foot")].map((node) => {
        return `${node.tagName}.${node.getAttribute("class") ?? ""}`;
      });
    });
    expect(order).toEqual([
      "HEADER.site",
      "P.meta",
      "SECTION.card verdict tone-buy",
      "SECTION.card todo tone-buy",
      "SECTION.card why",
      "SECTION.card record",
      "SECTION.card risk",
      "SECTION.price",
      "A.evidence",
      "FOOTER.foot",
    ]);
    const today = page.getByRole("region", { name: "Bitcoin today" });
    await expect(today).toContainText("Bitcoin today");
    await expect(today).not.toContainText("%");
    await expect(page.getByRole("link", { name: /See the evidence behind this/ })).toHaveAttribute("href", "/evidence/");
    await expect(page.locator("body")).toContainText("beat spreading it over a year, all 4 times");
    await expect(page.locator("body")).not.toContainText("19 times in 20");
    await expect(page.getByText("Loading this week's advice.", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button")).toHaveCount(0);
    await expect(page.locator("figure, canvas")).toHaveCount(0);
    expect(await overflows(page)).toBe(false);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
  });
}

test("loading is the header and one sentence", async ({ page }) => {
  await page.route("**/data/friday.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Loading this week's advice.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "BTC Friday" })).toBeVisible();
  await expect(page.locator("#week")).not.toContainText("$");
  await expect(page.locator(".loading-bar")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
});

test("this week shell without javascript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await expect(page.getByText("This week needs JavaScript to show the advice.", { exact: true })).toBeVisible();
    await expect(page.getByText("Loading this week's advice.", { exact: true })).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("a failed first load offers try again", async ({ page }) => {
  await page.route("**/data/friday.json", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText("The advice could not load. Nothing here is a call.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  await expect(page.locator("#week")).not.toContainText("$");
  await page.unroute("**/data/friday.json");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
});

test("a later poll failure keeps the last page", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-27T18:00:00-07:00") });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
  await page.route("**/data/live.json", (route) => route.abort());
  const failed = page.waitForRequest("**/data/live.json");
  await page.clock.fastForward(10 * 60 * 1000);
  await failed;
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
  await expect(page.getByText("The advice could not load. Nothing here is a call.")).toHaveCount(0);
});

test("this week does not call a market host", async ({ page }) => {
  const hosts = new Set<string>();
  page.on("request", (request) => {
    hosts.add(new URL(request.url()).host);
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
  expect([...hosts]).toEqual(["127.0.0.1:4173"]);
});

test("/this-week/ still shows this week", async ({ page }) => {
  await page.goto("/this-week/");
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
});

test("a later evidence poll failure keeps the loaded dashboard", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-27T18:00:00-07:00") });
  await page.goto("/evidence/");
  await expect(page.getByRole("heading", { name: "Buy strongly" })).toBeVisible();
  await page.route("**/data/live.json", (route) => route.abort());
  const failed = page.waitForRequest("**/data/live.json");
  await page.clock.fastForward(10 * 60 * 1000);
  await failed;
  await expect(page.getByRole("heading", { name: "Buy strongly" })).toBeVisible();
  await expect(page.getByText("The dashboard could not load its data.")).toHaveCount(0);
});

test("settings validate on blur and save, and cancel does not write", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/settings.html");
  await page.fill("#cash-amount", "-1");
  await page.locator("#cash-amount").press("Tab");
  const field = page.locator("#cash-amount").locator("xpath=ancestor::*[contains(@class,'field')][1]");
  await expect(field.locator(".error")).toHaveText("Enter zero or more.");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page).toHaveURL(/settings\.html$/);
  expect(await page.evaluate(() => localStorage.getItem("btc-insights.settings.v1"))).toBeNull();
  await page.fill("#cash-amount", "");
  await page.getByRole("link", { name: "Cancel" }).click();
  await page.waitForURL(/index\.html$/);
  expect(await page.evaluate(() => localStorage.getItem("btc-insights.settings.v1"))).toBeNull();
});
