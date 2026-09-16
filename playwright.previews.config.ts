import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "game-previews.spec.ts",
  outputDir: "test-results/preview-browser",
  timeout: 180_000,
  workers: 1,
  use: {
    baseURL: process.env.PREVIEW_TEST_BASE_URL || "http://localhost:3004",
    channel: "chrome",
    serviceWorkers: "allow",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 960 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
