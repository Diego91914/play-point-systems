import { expect, test, type BrowserContext } from "@playwright/test";
import { createGamesSessionToken, GAMES_SESSION_COOKIE } from "../lib/play-point-core/games-session";

const session = { code: "ABC234", playerId: "surveyed-fixture", token: "test-only-token" };

async function signIn(context: BrowserContext) {
  process.env.PLAY_POINT_GAMES_SESSION_SECRET = "playwright-local-only-session-signing-key";
  const token = await createGamesSessionToken({
    sub: "on-my-list-visual-fixture",
    email: "fixture@example.test",
    role: "founder",
    entitlements: ["game.on_my_list"],
  });
  await context.addCookies([{
    name: GAMES_SESSION_COOKIE,
    value: token,
    url: "http://127.0.0.1:3001",
    httpOnly: true,
    sameSite: "Lax",
  }]);
}

test("On My List answer entry keeps its gradients without the shared orbit", async ({ page, context }) => {
  await signIn(context);
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: "pps-on-my-list-session",
    value: session,
  });
  await page.route("**/api/games/on-my-list/ABC234?**", route => route.fulfill({ json: {
    state: {
      code: session.code,
      status: "setup",
      hostPlayerId: session.playerId,
      players: [{ id: session.playerId, name: "Chan", score: 0, seat: 0 }, { id: "guest", name: "Ty", score: 0, seat: 1 }],
      round: 0,
      maxRounds: 4,
      answers: [],
      misses: {},
      pendingHitBy: null,
      message: "Build your board.",
      surveyed: { id: session.playerId, name: "Chan" },
      currentGuesser: null,
      currentQuestion: { id: "test-question", prompt: "Name things Chan would bring camping.", minAnswers: 5, maxAnswers: 10 },
      me: { id: session.playerId, isHost: true, isSurveyed: true },
    },
  } }));

  await page.goto("/games/on-my-list");
  await expect(page.getByText("Build your board privately")).toBeVisible();
  await expect(page.getByPlaceholder("Answer 1 · required")).toBeVisible();
  await expect(page.locator('[aria-hidden="true"] [class*="orbit"]')).toHaveCount(0);
  const backdropImage = await page.locator('[aria-hidden="true"][class*="backdrop"]').evaluate(element => getComputedStyle(element).backgroundImage);
  expect(backdropImage).toContain("radial-gradient");
});
