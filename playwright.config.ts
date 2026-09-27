import { defineConfig } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "test",
  testMatch: "browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
  },
  webServer: {
    command: "node scripts/serve.mjs",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
