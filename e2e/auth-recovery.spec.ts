import { expect, test } from "@playwright/test";
import { createGamesSessionToken } from "../lib/play-point-core/games-session";
const authKey = "sb-qdsyxcjmrsxetjxeuojk-auth-token";
const room = { code: "ABC234", playerId: "player-host", token: "opaque-room-token", state: { phase: "lobby", me: { id: "player-host", isHost: true, chips: 1000 }, players: [], myBets: [], myComeBets: [] } };

test("Google entry preserves game return path without requesting an email link", async ({ page }) => {
  let oauthUrl = "";
  await page.route("**/auth/v1/authorize**", route => { oauthUrl = route.request().url(); return route.fulfill({ contentType: "text/html", body: "Google provider handoff fixture" }); });
  await page.goto("/account?returnTo=%2Fgames%2Flive-craps");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect(page.getByText("Email me a sign-in link")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect.poll(() => oauthUrl).toContain("provider=google");
  const redirect = new URL(new URL(oauthUrl).searchParams.get("redirect_to")!);
  expect(redirect.pathname).toBe("/account");
  expect(redirect.searchParams.get("returnTo")).toBe("/games/live-craps");
});

test("standalone app with retained Google session restores host cookie and table survives refresh", async ({ page, context }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ access_token: "fixture-access-token", refresh_token: "fixture-refresh-token", token_type: "bearer", expires_at: Math.floor(Date.now()/1000)+3600, user: { id: "fixture-host", email: "host@example.test", app_metadata: { provider: "google" }, user_metadata: {} } })), authKey);
  process.env.PLAY_POINT_GAMES_SESSION_SECRET = "playwright-local-only-session-signing-key";
  const token = await createGamesSessionToken({ sub: "fixture-host", email: "host@example.test", role: "founder", entitlements: ["*"] });
  let exchanges = 0, creates = 0;
  await page.route("**/api/games/account/session", async route => {
    expect(route.request().headers().authorization).toBe("Bearer fixture-access-token");
    exchanges++;
    await context.addCookies([{ name: "pps_games_session", value: token, url: "http://127.0.0.1:3001", httpOnly: true, sameSite: "Lax" }]);
    return route.fulfill({ json: { success: true } });
  });
  await page.route("**/api/games/live-craps", async route => {
    creates++;
    if (creates === 1) return route.fulfill({ status: 401, json: { error: "Sign in to host Live Craps." } });
    expect(exchanges).toBe(1);
    expect((await context.cookies()).find(cookie => cookie.name === "pps_games_session")?.value).toBe(token);
    return route.fulfill({ status: 201, json: room });
  });
  await page.route("**/api/games/live-craps/ABC234?**", route => {
    expect(new URL(route.request().url()).searchParams.get("token")).toBe(room.token);
    return route.fulfill({ json: { state: room.state } });
  });
  await page.goto("/games/live-craps");
  await page.getByPlaceholder("Your name").fill("Founder");
  await page.getByRole("button", { name: "CREATE TABLE", exact: true }).click();
  await expect(page.getByText("LIVE CRAPS · ABC234", { exact: true })).toBeVisible();
  expect(exchanges).toBe(1); expect(creates).toBe(2);
  // WebKit omits Cookie from intercepted fetch headers. Verify it over a real
  // request to the existing server-side privileged-session check instead.
  expect(await page.evaluate(async () => (await (await fetch("/api/games/account/shot-caddy-access")).json()).authorized)).toBe(true);
  await page.reload();
  await expect(page.getByText("LIVE CRAPS · ABC234", { exact: true })).toBeVisible();
  expect(creates).toBe(2);
});

test("invited guest can join without an account exchange", async ({ page }) => {
  let exchanges = 0;
  await page.route("**/api/games/account/session", route => { exchanges++; return route.abort(); });
  await page.route("**/api/games/live-craps", route => {
    expect(route.request().postDataJSON().action).toBe("join");
    return route.fulfill({ json: { ...room, state: { ...room.state, me: { ...room.state.me, isHost: false } } } });
  });
  await page.route("**/api/games/live-craps/ABC234?**", route => route.fulfill({ json: { state: { ...room.state, me: { ...room.state.me, isHost: false } } } }));
  await page.goto("/games/live-craps?code=ABC234&invite=1");
  await page.getByPlaceholder("Your name").fill("Guest");
  await expect(page.getByPlaceholder("Room code to join")).toHaveValue("ABC234");
  await page.getByRole("button", { name: "JOIN TABLE", exact: true }).click();
  await expect(page.getByText("LIVE CRAPS · ABC234", { exact: true }).first()).toBeVisible();
  expect(exchanges).toBe(0);
});

test("account callback exchanges retained login without an auth-lock deadlock", async ({ page, context }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ access_token: "callback-access-token", refresh_token: "fixture-refresh-token", token_type: "bearer", expires_at: Math.floor(Date.now()/1000)+3600, user: { id: "fixture-host", email: "host@example.test", app_metadata: { provider: "google" }, user_metadata: {} } })), authKey);
  process.env.PLAY_POINT_GAMES_SESSION_SECRET = "playwright-local-only-session-signing-key";
  const token = await createGamesSessionToken({ sub: "fixture-host", email: "host@example.test", role: "founder", entitlements: ["*"] });
  await page.route("**/api/games/account/session", async route => {
    expect(route.request().headers().authorization).toBe("Bearer callback-access-token");
    await context.addCookies([{ name: "pps_games_session", value: token, url: "http://127.0.0.1:3001", httpOnly: true, sameSite: "Lax" }]);
    return route.fulfill({ json: { success: true } });
  });
  await page.goto("/account?returnTo=%2Fgames%2Flive-craps");
  await expect(page).toHaveURL(/\/games\/live-craps$/);
  await expect(page.getByRole("button", { name: "CREATE TABLE", exact: true })).toBeVisible();
});
