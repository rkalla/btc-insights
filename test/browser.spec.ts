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
  const js = `${readFileSync("dist/assets/dashboard.js", "utf8")}${readFileSync("dist/assets/settings.js", "utf8")}`;
  for (const word of ["coingecko", "coinmetrics", "api_key", "GOLD_QUOTE", "wss://", "WebSocket"]) {
    expect(js.includes(word), word).toBe(false);
  }
});

for (const width of [1440, 1100, 390]) {
  test(`dashboard at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "All in" })).toBeVisible();
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
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "All in" })).toBeVisible();
  expect(await overflows(page)).toBe(false);
  await page.goto("/settings.html");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  expect(await overflows(page)).toBe(false);
});

test("axe is clean on the dashboard and settings", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "All in" })).toBeVisible();
  const dashboard = await new AxeBuilder({ page }).analyze();
  expect(dashboard.violations, JSON.stringify(dashboard.violations, null, 2)).toEqual([]);
  await page.goto("/settings.html");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  const settings = await new AxeBuilder({ page }).analyze();
  expect(settings.violations, JSON.stringify(settings.violations, null, 2)).toEqual([]);
});

test("a desktop marker opens one popover and escape returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "All in" })).toBeVisible();
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
  await page.locator("h1.brand-name").click();
  await expect(pop).toBeHidden();
});

test("show fires lists newest first under 768", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "All in" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "All in" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Up to $2,500.");
  const saved = await page.evaluate(() => localStorage.getItem("btc-insights.settings.v1"));
  expect(saved).toContain("2500");
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
