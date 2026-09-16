import { expect, test, type Page } from "@playwright/test";
import { MASTER_GAME_CATALOG } from "../lib/play-point-core/master-game-catalog";

async function savedState(page: Page) {
  return page.evaluate(async () => {
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const open = indexedDB.open("shot-caddy-offline", 1);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const request = db.transaction("round-updates").objectStore("round-updates").getAll();
        request.onsuccess = () => { resolve(request.result); db.close(); };
      };
    });
    return { local: { ...localStorage }, session: { ...sessionStorage }, rows };
  });
}

test("browsing all previews preserves sessions and never loads or mutates games", async ({ page, context }, testInfo) => {
  // Seed from an inert test document: the real /offline page has its own game Links.
  await context.route("**/__preview-test-bootstrap", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Preview test fixture</title>" }));
  await page.goto("/__preview-test-bootstrap");
  await page.evaluate(async () => {
    // Synthetic test fixtures only. Capture generation never uses saved state.
    for (const slug of ["mystery", "chain-reaction", "how-close", "inside-man", "on-my-list", "all-about-you", "live-craps"]) {
      const key = `pps-${slug}-session`;
      localStorage.setItem(key, JSON.stringify({ code: "TESTAB", playerId: "preview-test-player", token: "not-a-real-token" }));
      localStorage.setItem(`${key}:retention`, JSON.stringify({ code: "TESTAB", firstSeenAt: 1, role: "guest" }));
    }
    localStorage.setItem("pps-holdem-TESTAB", JSON.stringify({ playerId: "test", token: "not-a-real-token" }));
    localStorage.setItem("play-point-trivia-host-connection-v2", JSON.stringify({ sessionId: "preview-test-only" }));
    localStorage.setItem("play-point-trivia-player-connection-v2", JSON.stringify({ sessionId: "preview-test-only", roomCode: "TESTAB" }));
    localStorage.setItem("sc_last_session_code", "TESTAB");
    localStorage.setItem("sc_last_player_id", "preview-test-player");
    localStorage.setItem("sc_last_player_name", "Test fixture");
    localStorage.setItem("sc_active_round_resumes_v1", JSON.stringify({ CLASSIC_GAME: { gameMode: "CLASSIC_GAME", sessionCode: "TESTAB", playerId: "test", playerName: "Test fixture", updatedAt: 1 } }));
    localStorage.setItem("sc_pending_round_sync_codes_v1", '["TESTAB"]');
    sessionStorage.setItem("gameMode", "CLASSIC_GAME");
    sessionStorage.setItem("classicVariant", "CHAOS");
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("shot-caddy-offline", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("round-updates", { keyPath: "sessionCode" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("round-updates", "readwrite");
        tx.objectStore("round-updates").put({ sessionCode: "TESTAB", roundState: { gameMode: "CLASSIC_GAME", holes: [] }, submittedByPlayerId: "preview-test-player", queuedAt: 1 });
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
  });
  const before = await savedState(page);
  const beforeCookies = await context.cookies();
  const forbidden: string[] = [];
  const network: string[] = [];
  context.on("request", request => {
    const url = new URL(request.url());
    network.push(`${request.method()} ${url.pathname}${url.search}`);
    if (!["GET", "HEAD"].includes(request.method()) || /^\/(api|games|shot-caddy|live)(\/|$)/.test(url.pathname)) forbidden.push(`${request.method()} ${url.href}`);
  });
  // Abort a regression before it can touch even a synthetic game session.
  await context.route("**/*", route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    return !["GET", "HEAD"].includes(request.method()) || /^\/(api|games|shot-caddy|live)(\/|$)/.test(path) ? route.abort() : route.continue();
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const writes: string[] = [];
    Object.assign(window, { previewStorageWrites: writes });
    for (const name of ["setItem", "removeItem", "clear"] as const) {
      const original = Storage.prototype[name];
      Object.defineProperty(Storage.prototype, name, { value: function (...args: string[]) {
        writes.push(`${name}:${args[0] ?? ""}`);
        return Reflect.apply(original, this, args);
      } });
    }
  });
  await page.goto("/play-amplified");
  await expect(page.locator("[data-game-preview]")).toHaveCount(MASTER_GAME_CATALOG.length);
  for (const game of MASTER_GAME_CATALOG) {
    const figure = page.locator(`[data-game-preview="${game.id}"]`);
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator("img")).toBeVisible();
    await expect.poll(() => figure.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(figure.locator("xpath=ancestor::a")).toHaveAttribute("href", game.href);
    await figure.hover();
  }
  await expect(page.locator("iframe, object, embed")).toHaveCount(0);
  await page.locator('[data-game-preview="chain-reaction"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("catalog.png") });
  // Real client navigation exercises the Link boundary, not just direct requests.
  await page.locator('[data-game-preview="chain-reaction"]').click();
  await expect(page).toHaveURL(/\/play-amplified\/games\/chain-reaction$/);
  for (const game of MASTER_GAME_CATALOG) {
    await page.goto(game.href);
    const figure = page.locator(`[data-game-preview="${game.id}"]`);
    await figure.scrollIntoViewIfNeeded();
    await expect.poll(() => figure.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.locator("iframe, object, embed")).toHaveCount(0);
    const launch = page.getByRole("link", { name: "Open full game" });
    await expect(launch).toHaveAttribute("href", game.launchHref);
    await launch.hover();
    await launch.focus();
    await page.evaluate(() => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online")); });
    if (["chain-reaction", "shot-chaos", "card-shark-stud", "quest-digital", "play-point-trivia"].includes(game.id)) await page.screenshot({ path: testInfo.outputPath(`${game.id}.png`) });
    expect(await page.evaluate(() => (window as unknown as { previewStorageWrites: string[] }).previewStorageWrites)).toEqual([]);
    expect(await savedState(page)).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.waitForTimeout(6000); // Exceeds common game polling intervals.
  expect(await savedState(page)).toEqual(before);
  expect(await context.cookies()).toEqual(beforeCookies);
  expect(forbidden).toEqual([]);
  expect(errors).toEqual([]);
  await testInfo.attach("preview-network", { body: network.join("\n"), contentType: "text/plain" });
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).some(r => r.active?.scriptURL.endsWith("/play-amplified-sw.js")))).toBe(true);
});

test("failed screenshots retain layout and explicit launch navigation without a runtime fallback", async ({ page, context }) => {
  await context.route("**/images/game-previews/**", route => route.abort());
  await page.goto("/play-amplified/games/chain-reaction");
  const figure = page.locator("[data-game-preview]");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.getByRole("status")).toContainText("Screenshot unavailable");
  await expect(page.locator("iframe, object, embed")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open full game" })).toHaveAttribute("href", "/games/chain-reaction");
  const box = await figure.locator("div").first().boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(4 / 3, 1);
});
