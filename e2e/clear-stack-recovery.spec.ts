import { expect, test, type BrowserContext } from "@playwright/test";
import { createGamesSessionToken, GAMES_SESSION_COOKIE } from "../lib/play-point-core/games-session";
import { initialStackState, scoreStack, startStack, type StackState } from "../lib/play-point-core/clear-stack-engine";

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
  await expect(page.getByRole("alert").filter({ hasText: "Your recovery link has been kept" })).toContainText("Your recovery link has been kept");
  expect(await page.evaluate(key => localStorage.getItem(key), ROOM_KEY)).toBe(room.id);
});

test("cancel keeps the recovered game intact and confirmed End Game closes only that room", async ({ page, context }) => {
  await signIn(context);
  const writes: unknown[] = [];
  await page.route("**/api/games/clear-the-stack/room**", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { room } });
    writes.push(route.request().postDataJSON());
    return route.fulfill({ json: { room: { ...room, state_version: 5 } } });
  });
  await page.route("**/api/games/clear-the-stack/leaderboard**", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/games/clear-the-stack");
  const end = page.getByRole("button", { name: "END GAME · CLOSE SESSION", exact: true });
  await expect(end).toBeVisible();
  page.once("dialog", dialog => dialog.dismiss());
  await end.click();
  await expect(page.getByText("Guest fixture", { exact: true })).toBeVisible();
  expect(writes).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), ROOM_KEY)).toBe(room.id);
  page.once("dialog", dialog => dialog.accept());
  await end.click();
  await expect(page.getByRole("button", { name: "START NEW GAME", exact: true })).toBeVisible();
  expect(writes).toEqual([{ id: room.id, version: room.state_version, action: "close" }]);
  expect(await page.evaluate(key => localStorage.getItem(key), ROOM_KEY)).toBeNull();
});

test("two-player Best of 5 setup persists score, set, round and match length across refresh", async ({ page, context }) => {
  await signIn(context);
  await page.addInitScript(() => {
    if (sessionStorage.getItem("cts-clean-setup-once")) return;
    localStorage.removeItem("pps-clear-stack-host-draft");
    localStorage.removeItem("pps-clear-stack-host-room");
    sessionStorage.setItem("cts-clean-setup-once", "1");
  });
  const hostRoom = { ...room, state_version: 0, game_state: initialStackState(20, 5) };
  let persisted: typeof hostRoom = hostRoom;
  await page.route("**/api/games/clear-the-stack/room**", async route => {
    const request = route.request();
    if (request.method() === "GET") return route.fulfill({ json: { room: persisted } });
    if (request.method() === "POST") return route.fulfill({ json: { room: hostRoom, reused: false } });
    const body = request.postDataJSON();
    let state = persisted.game_state as StackState;
    if (body.action === "start") state = startStack(state, body.names, body.distance, body.stackSize, body.match);
    if (body.action === "makes") state = scoreStack(state, body.makes);
    persisted = { ...persisted, state_version: persisted.state_version + 1, game_state: state };
    return route.fulfill({ json: { room: persisted } });
  });
  await page.route("**/api/games/clear-the-stack/leaderboard**", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/games/clear-the-stack");
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(page.getByRole("button", { name: "Best of 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Best of 5", exact: true }).click();
  await page.getByLabel("Host", { exact: false }).fill("Chan");
  await page.getByPlaceholder("Player 2 name").fill("Tyler");
  await page.getByRole("button", { name: "START NEW GAME", exact: true }).click();
  await page.getByRole("button", { name: "4", exact: true }).click();
  await expect(page.getByText("Chan · Set 8 · Sets won 0", { exact: true })).toBeVisible();
  expect(persisted.game_state.match).toEqual({ mode: "best_of_5", setsToPlay: 5 });
  expect(persisted.game_state.players[0].score).toBe(8);
  await page.reload();
  await expect(page.getByText("SET 1/5 · ROUND 1/3 · +2 EACH", { exact: true })).toBeVisible();
  await expect(page.getByText("Chan · Set 8 · Sets won 0", { exact: true })).toBeVisible();
  await expect(page.getByText("Tyler", { exact: true })).toBeVisible();
});

test("Undo Last Score returns to the same scorer and replaces the mistaken points", async ({ page, context }) => {
  await signIn(context);
  const hostRoom = { ...room, state_version: 0, game_state: initialStackState(20, 5), undo_action_id: null as string | null };
  let persisted = hostRoom;
  const scoreHistory: Array<{ actionId: string; before: StackState }> = [];
  await page.route("**/api/games/clear-the-stack/room**", async route => {
    const request = route.request();
    if (request.method() === "GET") {
      const actionId = new URL(request.url()).searchParams.get("action_id");
      return route.fulfill({ json: { room: persisted, action_confirmed: actionId ? false : null } });
    }
    if (request.method() === "POST") return route.fulfill({ json: { room: persisted, reused: false } });
    const body = request.postDataJSON();
    let state = persisted.game_state;
    if (body.action === "start") state = startStack(state, body.names, body.distance, body.stackSize, body.match);
    if (body.action === "makes") {
      scoreHistory.push({ actionId: body.action_id, before: structuredClone(state) });
      state = scoreStack(state, body.makes);
      persisted = { ...persisted, undo_action_id: body.action_id };
    }
    if (body.action === "undo") {
      const previous = scoreHistory.pop();
      if (previous) state = previous.before;
      persisted = { ...persisted, undo_action_id: scoreHistory.at(-1)?.actionId ?? null };
    }
    persisted = { ...persisted, state_version: persisted.state_version + 1, game_state: state };
    return route.fulfill({ json: { room: persisted } });
  });
  await page.route("**/api/games/clear-the-stack/leaderboard**", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/games/clear-the-stack");
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByLabel("Host", { exact: false }).fill("Chan");
  await page.getByPlaceholder("Player 2 name").fill("Gary");
  await page.getByRole("button", { name: "START NEW GAME", exact: true }).click();
  await expect(page.getByText("Chan", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "2", exact: true }).click(); // Mistaken result: +4
  await expect(page.getByText("Gary", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "UNDO LAST SCORE", exact: true }).click();
  await expect(page.getByText("Last score undone.")).toBeVisible();
  await expect(page.getByText("Chan", { exact: true })).toBeVisible();
  await expect(page.getByText("Cumulative match points: 0 · Current set: 0 · Sets won: 0 · Maximum per set: 10")).toBeVisible();

  await page.getByRole("button", { name: "1", exact: true }).click(); // Corrected result: +2
  expect(persisted.game_state.players[0].score).toBe(2);
  expect(persisted.game_state.players[1].score).toBe(0);
  expect(persisted.game_state.players[0].remaining).toBe(4);
  await expect(page.getByText("Gary", { exact: true })).toBeVisible();
});

test("multiplayer setup exposes configurable sets and cumulative-point ranking", async ({ page, context }) => {
  await signIn(context);
  await page.route("**/api/games/clear-the-stack/room**", route => route.fulfill({ json: { room: null } }));
  await page.route("**/api/games/clear-the-stack/leaderboard**", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/games/clear-the-stack");
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByLabel("Sets to play")).toHaveValue("3");
  await page.getByLabel("Sets to play").fill("4");
  await expect(page.getByLabel("Sets to play")).toHaveValue("4");
  await expect(page.getByText("Recommended: 3 sets (9 scoring rounds).")).toBeVisible();
  await expect(page.getByText("Final rankings use cumulative points across all sets; sets won do not determine rank.")).toBeVisible();
});
