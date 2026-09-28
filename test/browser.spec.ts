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
    await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
    await expect(page.locator("body")).toContainText("Here's the reasoning behind this week's advice");
    await expect(page.locator("header.site a[aria-current='page']")).toHaveText("Evidence");
    await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/rkalla/btc-insights",
    );
    await expect(page.locator(".spectrum")).toHaveCount(0);
    await expect(page.locator(".disagreement")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Use your cash available to invest.");
    await expect(page.locator("body")).not.toContainText("Standing contribution continues.");
    await expect(page.locator("body")).not.toContainText("$100,000");
    await expect(page.locator("body")).not.toContainText("Selected marker");
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
    await expect(page.getByRole("radiogroup", { name: "How often" })).toBeVisible();
    await expect(page.getByLabel("Bitcoin you own")).toBeVisible();
    await expect(page.getByLabel("All your investments, including Bitcoin")).toBeVisible();
    await expect(page.getByLabel("Target share of your investments")).toBeVisible();
    await expect(page.getByLabel("Upper limit")).toBeVisible();
    await expect(page.locator("#thesis-state")).toHaveText("Off");
    await expect(page.getByLabel("The date you decided")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Where you hold it" })).toBeVisible();
    for (const old of ["Coins held", "Investable net worth", "Ceiling share", "Not declared"]) {
      await expect(page.locator("body")).not.toContainText(old);
    }
    const field = page.locator("#coins-held");
    const shell = field.locator("xpath=ancestor::*[contains(@class,'input')][1]");
    await expect(field).toHaveCSS("font-size", "17px");
    await expect(field).toHaveCSS("font-variant-numeric", "tabular-nums");
    expect((await field.evaluate((el) => getComputedStyle(el).fontFamily)).toLowerCase()).toContain("geist");
    await expect(shell).toHaveCSS("height", "44px");
    await expect(shell).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(shell).toHaveCSS("border-top-width", "1px");
    await expect(shell).toHaveCSS("border-top-color", "rgb(214, 211, 203)");
    await expect(shell).toHaveCSS("border-radius", "12px");
    await expect(page.locator("#coins-held + .affix")).toHaveCSS("color", "rgb(95, 101, 112)");
    await field.focus();
    expect(await shell.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("rgb(31, 94, 214) 0px 0px 0px 2px");
    await page.locator("#every-week").check({ force: true });
    const week = page.locator("label[for='every-week']");
    await expect(week).toHaveCSS("height", "44px");
    await expect(week).toHaveCSS("color", "rgb(21, 23, 28)");
    await expect(week).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(week).toHaveCSS("border-top-color", "rgb(21, 23, 28)");
    const toggle = page.getByRole("switch");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(toggle).toHaveCSS("background-color", "rgb(31, 94, 214)");
    await expect(page.locator("#thesis-state")).toHaveText("On");
    const save = page.getByRole("button", { name: "Save settings" });
    const cancel = page.getByRole("link", { name: "Cancel" });
    await expect(save).toHaveCSS("background-color", "rgb(31, 94, 214)");
    if (width < 600) {
      const saveBox = await save.boundingBox();
      const actionsBox = await page.locator(".actions").boundingBox();
      expect(saveBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();
      expect(Math.abs((saveBox?.width ?? 0) - (actionsBox?.width ?? 0))).toBeLessThan(2);
      await expect(cancel).toHaveCSS("text-decoration-line", "underline");
      await expect(cancel).toHaveCSS("border-top-width", "0px");
    } else {
      await expect(cancel).toHaveCSS("text-decoration-line", "none");
    }
    expect(await overflows(page)).toBe(false);
  });
}

test("no horizontal scroll at 320", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/evidence/");
  await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
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
    await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
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
  await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
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
  await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
  await page.getByRole("button", { name: "Show past signals" }).click();
  const dialog = page.getByRole("dialog", { name: "Fires" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".fire-row").first()).toContainText("Open. Not in the completed count.");
  await expect(dialog.locator(".fire-row").last()).toContainText("Jun 2013");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Show past signals" })).toBeFocused();
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
  const repo = "https://github.com/rkalla/btc-insights";
  expect(blob.includes(repo), "repo link").toBe(true);
  const rest = blob.split(repo).join("");
  expect(rest.includes("https://") || rest.includes("http://"), "remote url").toBe(false);
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
  expect(index).toContain("/assets/site.css");
  expect(index).toContain("/assets/this-week.css");
  expect(index).not.toContain("evidence.css");
  expect(index).not.toContain("dashboard.css");
  expect(evidence).toContain("/assets/site.css");
  expect(evidence).toContain("/assets/evidence.css");
  expect(evidence).not.toContain("this-week.css");
  expect(evidence).not.toContain("dashboard.css");
  const settings = readFileSync("dist/settings.html", "utf8");
  expect(settings).toContain("<title>Settings · BTC Friday</title>");
  expect(settings).toContain("/assets/site.css");
  expect(settings).toContain("/assets/settings.css");
  expect(settings).not.toContain("dashboard.css");
  expect(settings).not.toContain("this-week.css");
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
    await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/rkalla/btc-insights",
    );
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
  await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
  await page.route("**/data/live.json", (route) => route.abort());
  const failed = page.waitForRequest("**/data/live.json");
  await page.clock.fastForward(10 * 60 * 1000);
  await failed;
  await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
  await expect(page.getByText("The dashboard could not load its data.")).toHaveCount(0);
});

async function shellMetrics(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) => {
      const el = document.querySelector(selector);
      if (!(el instanceof HTMLElement)) return null;
      const style = getComputedStyle(el);
      const pad = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
      return { width: el.getBoundingClientRect().width, pad };
    };
    const card = document.querySelector(".card, .panel");
    const header = document.querySelector("header.site");
    return {
      bg: getComputedStyle(document.body).backgroundColor,
      font: getComputedStyle(document.body).fontFamily,
      headerH: header == null ? 0 : Math.round(header.getBoundingClientRect().height),
      radius: card == null ? "" : getComputedStyle(card).borderRadius,
      page: box(".page"),
      header: box(".site-inner"),
      footer: box(".foot-inner"),
    };
  });
}

for (const width of [390, 1440]) {
  test(`shared light shell at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const paths = ["/", "/evidence/", "/settings.html"] as const;
    const shots = [];
    for (const path of paths) {
      await page.goto(path);
      if (path === "/") {
        await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
        await expect(page).toHaveTitle("This week · BTC Friday");
      } else if (path === "/evidence/") {
        await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
        await expect(page).toHaveTitle("Evidence · BTC Friday");
      } else {
        await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
        await expect(page).toHaveTitle("Settings · BTC Friday");
        await expect(page.locator("a.gear")).toHaveAttribute("aria-current", "page");
      }
      await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
        "href",
        "https://github.com/rkalla/btc-insights",
      );
      shots.push(await shellMetrics(page));
    }
    const paper = "rgb(247, 246, 242)";
    for (const shot of shots) {
      expect(shot.bg).toBe(paper);
      expect(shot.font.toLowerCase()).toContain("geist");
      expect(shot.headerH).toBe(shots[0]?.headerH);
      expect(shot.radius).toBe(shots[0]?.radius);
      expect(shot.radius).toBe("16px");
      for (const part of [shot.page, shot.header, shot.footer]) {
        expect(part).not.toBeNull();
        expect(part!.width).toBeLessThanOrEqual(680 + part!.pad + 1);
      }
    }
  });
}

for (const width of [320, 390, 412]) {
  for (const scale of [1, 1.3]) {
    test(`no sideways scroll at ${width} with ${Math.round(scale * 100)}% text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/evidence/", "/settings.html"]) {
        await page.goto(path);
        if (path === "/") {
          await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
        } else if (path === "/evidence/") {
          await expect(page.getByRole("heading", { level: 1, name: "Why this week says Buy strongly" })).toBeVisible();
        } else {
          await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
        }
        if (scale !== 1) {
          await page.evaluate((factor) => {
            const elements = [document.documentElement, ...document.querySelectorAll("body *")];
            const sizes = elements.map((el) => Number.parseFloat(getComputedStyle(el).fontSize));
            elements.forEach((el, index) => {
              if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return;
              const size = sizes[index];
              if (size == null || !Number.isFinite(size) || size <= 0) return;
              el.style.fontSize = `${size * factor}px`;
            });
          }, scale);
        }
        const box = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(box.scrollWidth).toBe(box.clientWidth);
      }
    });
  }
}

test("layout probe is absent unless debug=layout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
  await expect(page.locator(".layout-probe")).toHaveCount(0);
  await page.goto("/?debug=layout");
  await expect(page.getByRole("heading", { level: 1, name: "A strong week to buy Bitcoin." })).toBeVisible();
  const probe = page.locator(".layout-probe");
  await expect(probe).toHaveCount(1);
  await expect(probe).toContainText("innerWidth");
  await expect(probe).toContainText("clientWidth");
  await expect(probe).toContainText("scrollWidth");
  await expect(probe).toContainText("visualViewport.width");
  await expect(probe).toContainText("visualViewport.scale");
  await expect(probe).toContainText("devicePixelRatio");
  await expect(probe).toContainText("fontSize");
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
