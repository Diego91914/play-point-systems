import { afterEach, describe, expect, it, vi } from "vitest";
import { CLEAR_STACK_HOST_ROOM_KEY, recoverClearStackHostRoom } from "../lib/play-point-core/clear-stack-recovery";
import { initialStackState, startStack, scoreStack } from "../lib/play-point-core/clear-stack-engine";

function storage(saved: string | null = "saved-room-id") {
  return { getItem: vi.fn(() => saved), setItem: vi.fn(), removeItem: vi.fn() };
}
const game = scoreStack(startStack(initialStackState(25, 5), ["Host", "Guest"], 25, 5), 3);
const room = { id: "live-room-id", code: "ABC234", spectator_token: "spectator", state_version: 4, game_state: game };
afterEach(() => vi.unstubAllGlobals());
describe("Clear the Stack server recovery", () => {
  it("recovers precise scoring state from the account with no browser pointer", async () => {
    const cache = storage(null);
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ room }));
    expect(await recoverClearStackHostRoom(cache, request)).toEqual(room);
    expect(request).toHaveBeenCalledWith("/api/games/clear-the-stack/room", { cache: "no-store" });
    expect(cache.setItem).toHaveBeenCalledWith(CLEAR_STACK_HOST_ROOM_KEY, room.id);
  });
  it.each([401, 403, 500, 503])("preserves recovery on HTTP %s", async status => {
    const cache = storage();
    await expect(recoverClearStackHostRoom(cache, vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status })))).rejects.toThrow();
    expect(cache.removeItem).not.toHaveBeenCalled();
    expect(cache.setItem).not.toHaveBeenCalled();
  });
  it("preserves recovery when offline", async () => {
    const cache = storage();
    await expect(recoverClearStackHostRoom(cache, vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")))).rejects.toThrow("offline");
    expect(cache.removeItem).not.toHaveBeenCalled();
  });
  it.each([400, 404, 410])("finds the current account room when an old pointer returns %s", async status => {
    const cache = storage();
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status })).mockResolvedValueOnce(Response.json({ room }));
    expect(await recoverClearStackHostRoom(cache, request)).toEqual(room);
    expect(request).toHaveBeenLastCalledWith("/api/games/clear-the-stack/room", { cache: "no-store" });
  });
  it("supports signed-out first visits without creating a room", async () => {
    const cache = storage(null);
    expect(await recoverClearStackHostRoom(cache, vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })))).toBeNull();
    expect(cache.setItem).not.toHaveBeenCalled();
  });
  it("recovers with browser storage disabled", async () => {
    const cache = storage();
    cache.getItem.mockImplementation(() => { throw Error("blocked"); });
    cache.setItem.mockImplementation(() => { throw Error("blocked"); });
    expect(await recoverClearStackHostRoom(cache, vi.fn<typeof fetch>().mockResolvedValue(Response.json({ room })))).toEqual(room);
  });
  it("rejects a malformed response without clearing recovery", async () => {
    const cache = storage();
    await expect(recoverClearStackHostRoom(cache, vi.fn<typeof fetch>().mockResolvedValue(Response.json({})))).rejects.toThrow("verified");
    expect(cache.removeItem).not.toHaveBeenCalled();
  });
});
