import { expect, test } from "@playwright/test";

const marketingRoutes = [
  "/",
  "/games",
  "/live",
  "/shot-caddy",
  "/games/trivia",
  "/music",
  "/about",
  "/contact",
  "/support",
] as const;

for (const route of marketingRoutes) {
  test(`${route} keeps its headline inside the mobile viewport`, async ({ page }) => {
    await page.goto(route);

    const headline = page.locator("h1").first();
    await expect(headline).toBeVisible();
    await expect(headline).toHaveCSS("overflow-wrap", "anywhere");

    const bounds = await headline.boundingBox();
    const viewport = page.viewportSize();
    expect(bounds).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width + 1);

    const headlineFits = await headline.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
    expect(headlineFits).toBe(true);

    const pageFits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    expect(pageFits).toBe(true);
  });
}

test("the mobile brand mark and company name remain fully visible", async ({ page }) => {
  await page.goto("/");

  const logo = page.locator('header img[src*="play-point-emblem"]').first();
  await expect(logo).toBeVisible();
  const logoBounds = await logo.boundingBox();
  expect(logoBounds).not.toBeNull();
  expect(logoBounds!.width).toBeGreaterThanOrEqual(32);
  expect(logoBounds!.height).toBeGreaterThanOrEqual(32);

  const companyName = page.getByText("Play Point Systems", { exact: true }).first();
  await expect(companyName).toBeVisible();
  expect(await companyName.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test("task routes surface their primary control without a marketing preamble", async ({ page }) => {
  await page.goto("/games/trivia/join");
  const roomCode = page.getByLabel("Room code");
  await expect(roomCode).toBeVisible();
  const roomCodeBounds = await roomCode.boundingBox();
  expect(roomCodeBounds).not.toBeNull();
  expect(roomCodeBounds!.y).toBeLessThan(page.viewportSize()!.height);

  await page.goto("/games/trivia/builder");
  await expect(page.getByRole("button", { name: /create live room/i })).toBeVisible();
});
