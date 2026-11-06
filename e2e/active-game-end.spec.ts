import { expect, test, type Page } from "@playwright/test";

async function openActiveShotCaddy(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("sc_active_round_resumes_v1", JSON.stringify({
      CLASSIC_GAME: {
        gameMode: "CLASSIC_GAME",
        sessionCode: "ABC234",
        playerId: "host-player",
        playerName: "Host",
        updatedAt: Date.now(),
      },
    }));
  });
  await page.route("**/shot-caddy/api/sessions/ABC234", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ roundState: { gameMode: "CLASSIC_GAME", hostPlayerId: "host-player" } }),
  }));
  await page.route("**/api/games/clear-the-stack/room", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ room: null }),
  }));
  await page.goto("/play-amplified");
  await expect(page.locator('section[aria-labelledby="active-game-heading"]')).toBeVisible();
}

test("END GAME cancel keeps Shot Caddy active", async ({ page }) => {
  let endRequests = 0;
  await page.route("**/api/sessions/ABC234/end", (route) => {
    endRequests += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });
  await openActiveShotCaddy(page);
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Shot Caddy");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "END GAME" }).click();
  await expect(page.locator('section[aria-labelledby="active-game-heading"]')).toBeVisible();
  expect(endRequests).toBe(0);
});

test("confirmed END GAME calls the server, clears recovery, and stays ended after refresh", async ({ page }) => {
  let ended = false;
  await page.route("**/api/sessions/ABC234/end", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ submittedByPlayerId: "host-player" });
    ended = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, endedAt: new Date().toISOString() }) });
  });
  await page.route("**/shot-caddy/api/sessions/ABC234", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ roundState: { gameMode: "CLASSIC_GAME", hostPlayerId: "host-player", hostEndedAt: ended ? "ended" : null } }),
  }));
  await openActiveShotCaddy(page);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "END GAME" }).click();
  await expect(page.locator('section[aria-labelledby="active-game-heading"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("sc_active_round_resumes_v1"))).toBe("{}");
  expect(ended).toBe(true);
  await page.reload();
  await expect(page.locator('section[aria-labelledby="active-game-heading"]')).toHaveCount(0);
});

test("server failure keeps the session available and displays a retry error", async ({ page }) => {
  let endRequests = 0;
  await page.route("**/api/sessions/ABC234/end", async (route) => {
    endRequests += 1;
    if (endRequests === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unable to finish the round; no scores were deleted." }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });
  await openActiveShotCaddy(page);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "END GAME" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("no scores were deleted");
  await expect(page.locator('section[aria-labelledby="active-game-heading"]')).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "END GAME" }).click();
  await expect(page.locator('section[aria-labelledby="active-game-heading"]')).toHaveCount(0);
  expect(endRequests).toBe(2);
});
