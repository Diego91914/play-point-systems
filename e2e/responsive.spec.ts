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

    const headline = page.locator("h1").first();
    await expect(headline).toBeVisible();
    await expect(headline).toHaveCSS("overflow-wrap", "anywhere");

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

test("Games pages require a Play Point account sign-in", async ({ page }) => {
  for (const route of [
    "/games",
    "/games/holdem",
    "/games/trivia/join",
    "/games/trivia/builder",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/games\/sign-in/);
    await expect(
      page.getByRole("heading", { name: /sign in to your games/i })
    ).toBeVisible();
  }
});

test("Games APIs reject unauthenticated requests before game logic runs", async ({ request }) => {
  const holdemResponse = await request.get("/api/games/holdem/ABC123/public");
  expect(holdemResponse.status()).toBe(401);
  await expect(holdemResponse.json()).resolves.toMatchObject({
    error: "Play Point account sign-in is required.",
  });

  const triviaResponse = await request.get("/api/trivia/catalog");
  expect(triviaResponse.status()).toBe(401);
  await expect(triviaResponse.json()).resolves.toMatchObject({
    error: "Play Point account sign-in is required.",
  });
});

test("Games sign-in controls remain usable on mobile", async ({ page }) => {
  await page.goto("/games/sign-in");

  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("At least 8 characters")).toBeVisible();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /forgot password/i })).toBeVisible();

  const pageFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  );
  expect(pageFits).toBe(true);
});
