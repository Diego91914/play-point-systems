import { expect, test } from "@playwright/test";

const marketingRoutes = [
  "/",
  "/live",
  "/shot-caddy",
  "/music",
  "/about",
  "/contact",
  "/support",
  "/games/sign-in",
] as const;

for (const route of marketingRoutes) {
  test(`${route} keeps its headline inside the mobile viewport`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("domcontentloaded");

    const headline = page.locator("h1").first();
    await expect(headline).toBeVisible();

    const bounds = await headline.boundingBox();
    const viewport = page.viewportSize();
    expect(bounds).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width + 1);

    const headlineFits = await headline.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1
    );
    expect(headlineFits).toBe(true);

    const pageFits = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    );
    expect(pageFits).toBe(true);
  });
}

test("the mobile brand mark and company name remain fully visible", async ({ page }) => {
  await page.goto("/");

  const logo = page.locator('header img[src*="play-point-systems-emblem"]').first();
  await expect(logo).toBeVisible();
  const logoBounds = await logo.boundingBox();
  expect(logoBounds).not.toBeNull();
  expect(logoBounds!.width).toBeGreaterThanOrEqual(32);
  expect(logoBounds!.height).toBeGreaterThanOrEqual(32);

  const companyName = page.getByText("Play Point Systems", { exact: true }).first();
  await expect(companyName).toBeVisible();
  expect(
    await companyName.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)
  ).toBe(true);
});

test("private game hosting routes offer account and builder access to unsigned hosts", async ({ page }) => {
  for (const route of ["/games", "/games/trivia/builder"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\\/games\\/sign-in\\?next=/);
    await expect(page.getByRole("link", { name: "Sign in to my Play Amplified account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Use private builder access" })).toBeVisible();
  }
});

test("invited guests may open Hold'em and Trivia without Builder Access", async ({ page }) => {
  for (const route of ["/games/holdem", "/games/trivia/join"]) {
    await page.goto(route);
    await expect(page).not.toHaveURL(/\/builder-access\?next=/);
    await expect(page.locator("h1").first()).toBeVisible();
  }
});

test("guest-capable game APIs reject unusable room access without requiring a customer account", async ({ request }) => {
  const holdemResponse = await request.get("/api/games/holdem/ABC123/public");
  expect([400, 404]).toContain(holdemResponse.status());

  const triviaResponse = await request.get("/api/trivia/catalog");
  expect([200, 401, 403]).toContain(triviaResponse.status());
});

test("Games sign-in offers account and builder options rather than forcing a password loop", async ({ page }) => {
  await page.goto("/games/sign-in");
  await expect(page).toHaveURL(/\\/games\\/sign-in/);
  await expect(page.getByRole("link", { name: "Sign in to my Play Amplified account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Use private builder access" })).toBeVisible();
  await expect(page.getByPlaceholder("you@example.com")).toHaveCount(0);
  const pageFits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(pageFits).toBe(true);
});
