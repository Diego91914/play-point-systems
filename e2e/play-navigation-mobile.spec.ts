import { expect, test } from "@playwright/test";

for (const route of ["/play", "/play/host", "/play/join"] as const) {
  test(`${route} fits the phone viewport and keeps Play Amplified navigation`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Play Amplified home" })).toBeVisible();

    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(fitsViewport).toBe(true);

    const menu = page.getByRole("button", { name: "Toggle navigation menu" });
    await expect(menu).toBeVisible();
    await menu.click();
    const nav = page.locator("#mobile-navigation");
    await expect(nav.getByRole("link", { name: "Discover" })).toHaveAttribute("href", "/play-amplified");
    await expect(nav.getByRole("link", { name: "Play", exact: true })).toHaveAttribute("href", "/play");
    await expect(nav.getByRole("link", { name: "My Games" })).toHaveAttribute("href", "/games");
    await expect(nav.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/account");
  });
}

test("Play launcher separates hosting, joining, scoring, library, and discovery", async ({ page }) => {
  await page.goto("/play");
  const links = [
    ["/play/host", "Host"],
    ["/play/join", "Quick Join"],
    ["/live/quick-score", "Quick Score"],
    ["/games", "My Games"],
  ] as const;

  for (const [href] of links) {
    await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
  }
  await expect(page.locator('a[href="/play-amplified"]').first()).toBeVisible();
});

test("Quick Join accepts a room code without a customer or Builder sign-in screen", async ({ page }) => {
  await page.goto("/play/join");
  await expect(page.getByText("Guests do not need a Play Amplified account.")).toBeVisible();
  const roomCode = page.getByRole("textbox", { name: "Room code" });
  const joinButton = page.getByRole("button", { name: "JOIN GAME" });
  await expect(roomCode).toBeVisible();
  await expect(joinButton).toBeDisabled();
  await roomCode.fill("abc234");
  await expect(roomCode).toHaveValue("ABC234");
  await expect(joinButton).toBeEnabled();
  await expect(page.getByText("Builder Access")).toHaveCount(0);
});
