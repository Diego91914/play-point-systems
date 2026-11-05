import { expect, test, type BrowserContext } from "@playwright/test";
import { createGamesSessionToken, GAMES_SESSION_COOKIE } from "../lib/play-point-core/games-session";
import { initialStackState, scoreStack, startStack } from "../lib/play-point-core/clear-stack-engine";

const ROOM_KEY = "pps-clear-stack-host-room";
const game = scoreStack(startStack(initialStackState(25, 5), ["Host fixture", "Guest fixture"], 25, 5), 3);
const room = { id: "12345678-1234-1234-1234-123456789abc", code: "ABC234", spectator_token: "test-spectator-token", state_version: 4, game_state: game };

async function signIn(context: BrowserContext) {
  // Matches only the isolated Playwright dev server, never production signing.
  process.env.PLAY_POINT_GAMES_SESSION_SECRET = "playwright-local-only-session-signing-key";
  const token = await createGamesSessionToken({ sub: "recovery-fixture-host", email: "fixture@example.test", role: "founder", entitlements: ["game.clear_the_stack"] });
  await context.addCookies([{ name: GAMES_SESSION_COOKIE, value: token, url: "http://127.0.0.1:3001", httpOnly: true, sameSite: "Lax" }]);
}

test("host recovers saved server gameplay with empty browser storage and after reload", async ({ page, context }) => {
  await signIn(context);
  let mutations = 0;
  await page.route("**/api/games/clear-the-stack/room**", route => {
    if (route.request().method() !== "GET") { mutations++; return route.abort(); }
    return route.fulfill({ json: { room } });
  });
  await page.goto("/games/clear-the-stack");
  await expect(page.getByText("Guest fixture", { exact: true })).toBeVisible();
  await expect(page.getByText("25 FT · 5 DISC START", { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), ROOM_KEY)).toBe(room.id);
  await page.reload();
  await expect(page.getByText("Guest fixture", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "END GAME · CLOSE SESSION", exact: true })).toBeVisible();
  expect(mutations).toBe(0);
});

test("auth interruption preserves the host pointer and displays a reconnect message", async ({ page, context }) => {
  await signIn(context);
  await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), { key: ROOM_KEY, id: room.id });
  await page.route("**/api/games/clear-the-stack/room**", route => route.fulfill({ status: 401, json: { error: "Sign in again" } }));
  await page.route("**/api/games/clear-the-stack/leaderboard**", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/games/clear-the-stack");
  await expect(page.getByRole("alert")).toContainText("Your recovery link has been kept");
  expect(await page.evaluate(key => localStorage.getItem(key), ROOM_KEY)).toBe(room.id);
});
