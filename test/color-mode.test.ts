import assert from "node:assert/strict";
import { test } from "node:test";
import { COLOR_MODE_KEY, colorModeSource } from "../src/painter/color-mode.ts";

interface FakeDocument {
  documentElement: {
    getAttribute(name: string): string | null;
  };
  meta: { content: string };
  live: { textContent: string };
  click(target: { closest(selector: string): unknown }): void;
}

interface FakeTheme {
  label: string;
  icons: Array<{ mode: string; hidden: boolean }>;
}

function mount(options: { stored?: string | null; matches?: boolean; throwOnRead?: boolean; throwOnWrite?: boolean } = {}): {
  document: FakeDocument;
  store: Map<string, string>;
  query: { matches: boolean };
  theme: FakeTheme;
} {
  const attrs = new Map<string, string>();
  const root = {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    getAttribute(name: string) {
      return attrs.get(name) ?? null;
    },
    removeAttribute(name: string) {
      attrs.delete(name);
    },
  };
  const meta = {
    content: "#F7F6F2",
    setAttribute(name: string, value: string) {
      if (name === "content") this.content = value;
    },
  };
  const live = { textContent: "" };
  const icons = ["system", "light", "dark"].map((mode) => ({
    mode,
    hidden: false,
    classList: { contains: (name: string) => name === `theme-icon--${mode}` },
    setAttribute(name: string) {
      if (name === "hidden") this.hidden = true;
    },
    removeAttribute(name: string) {
      if (name === "hidden") this.hidden = false;
    },
  }));
  const theme = {
    label: "",
    icons,
    setAttribute(name: string, value: string) {
      if (name === "aria-label") this.label = value;
    },
    querySelectorAll(selector: string) {
      return selector === ".theme-icon" ? icons : [];
    },
    closest(selector: string) {
      return selector === ".theme" ? theme : null;
    },
  };
  const listeners: Array<(event: { target: unknown }) => void> = [];
  const document = {
    documentElement: root,
    theme,
    icons,
    querySelector(selector: string) {
      if (selector === 'meta[name="theme-color"]') return meta;
      if (selector === "[data-color-mode-live]") return live;
      if (selector === ".theme") return theme;
      return null;
    },
    addEventListener(_type: string, fn: (event: { target: unknown }) => void) {
      listeners.push(fn);
    },
    click(target: { closest(selector: string): unknown }) {
      for (const fn of listeners) fn({ target });
    },
    meta,
    live,
  };
  const store = new Map<string, string>();
  if (options.stored != null) store.set(COLOR_MODE_KEY, options.stored);
  const localStorage = {
    getItem(key: string) {
      if (options.throwOnRead) throw new Error("blocked");
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (options.throwOnWrite) throw new Error("blocked");
      store.set(key, value);
    },
  };
  const query = { matches: options.matches === true, addEventListener() {} };
  const window = { matchMedia: () => query };
  const run = new Function("document", "localStorage", "window", colorModeSource());
  run(document, localStorage, window);
  return { document, store, query, theme };
}

test("color mode starts on system and cycles light, dark, then system", () => {
  const { document, store, theme } = mount();
  assert.equal(document.documentElement.getAttribute("data-color-mode"), "system");
  assert.equal(document.documentElement.getAttribute("data-theme"), null);
  assert.equal(document.meta.content, "#F7F6F2");
  assert.equal(theme.label, "Color mode: System");
  assert.deepEqual(theme.icons.map((icon) => icon.hidden), [false, true, true]);

  const icon = { closest: (selector: string) => (selector === ".theme" ? icon : null) };
  document.click(icon);
  assert.equal(document.documentElement.getAttribute("data-color-mode"), "light");
  assert.equal(document.documentElement.getAttribute("data-theme"), "light");
  assert.equal(store.get(COLOR_MODE_KEY), "light");
  assert.equal(document.live.textContent, "Using light colors");
  assert.equal(document.meta.content, "#F7F6F2");
  assert.equal(theme.label, "Color mode: Light");
  assert.deepEqual(theme.icons.map((icon) => icon.hidden), [true, false, true]);

  document.click(icon);
  assert.equal(document.documentElement.getAttribute("data-theme"), "dark");
  assert.equal(document.meta.content, "#1C1B18");
  assert.equal(document.live.textContent, "Using dark colors");

  document.click(icon);
  assert.equal(document.documentElement.getAttribute("data-color-mode"), "system");
  assert.equal(document.documentElement.getAttribute("data-theme"), null);
  assert.equal(store.get(COLOR_MODE_KEY), "system");
});

test("a stored dark choice is applied before the first click", () => {
  const { document } = mount({ stored: "dark" });
  assert.equal(document.documentElement.getAttribute("data-theme"), "dark");
  assert.equal(document.meta.content, "#1C1B18");
  assert.equal(document.live.textContent, "");
});

test("system mode on a dark device paints the dark browser chrome", () => {
  const { document } = mount({ matches: true });
  assert.equal(document.documentElement.getAttribute("data-theme"), null);
  assert.equal(document.meta.content, "#1C1B18");
});

test("a broken store leaves the page on system", () => {
  const { document } = mount({ throwOnRead: true, throwOnWrite: true });
  assert.equal(document.documentElement.getAttribute("data-color-mode"), "system");
  const icon = { closest: (selector: string) => (selector === ".theme" ? icon : null) };
  document.click(icon);
  assert.equal(document.documentElement.getAttribute("data-theme"), "light");
});

test("a click outside the color button does not change the mode", () => {
  const { document, store } = mount();
  document.click({ closest: () => null });
  assert.equal(document.documentElement.getAttribute("data-color-mode"), "system");
  assert.equal(store.has(COLOR_MODE_KEY), false);
});
