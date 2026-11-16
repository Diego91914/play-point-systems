import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/play-point-core/play-point-browser-supabase", () => ({ getPlayPointBrowserSupabaseClient: () => ({ auth: { getSession } }) }));
import { gamesHostFetch } from "@/lib/play-point-core/games-host-fetch";
const request = vi.fn();
const assign = vi.fn();
const entry = { method: "POST", body: JSON.stringify({ action: "create", name: "Founder" }) };
beforeEach(() => {
  vi.stubGlobal("fetch", request);
  vi.stubGlobal("window", { location: { pathname: "/games/live-craps", search: "", assign } });
  getSession.mockResolvedValue({ data: { session: { access_token: "verified-on-server" } } });
});
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); });
describe("shared host session recovery", () => {
  it.each(["live-craps", "holdem", "chain-reaction", "how-close", "inside-man", "on-my-list", "all-about-you", "mystery"])("restores missing cookie before retrying %s host creation once", async slug => {
    request.mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(new Response(null)).mockResolvedValueOnce(new Response(null, { status: 201 }));
    expect((await gamesHostFetch(`/api/games/${slug}`, entry)).status).toBe(201);
    expect(request.mock.calls[1]).toEqual(["/api/games/account/session", expect.objectContaining({ headers: { Authorization: "Bearer verified-on-server" } })]);
    expect(request.mock.calls[2]).toEqual([`/api/games/${slug}`, entry]);
  });
  it.each([200, 403, 500])("never retries status %s", async status => {
    request.mockResolvedValue(new Response(null, { status }));
    await gamesHostFetch("/api/games/live-craps", entry);
    expect(request).toHaveBeenCalledTimes(1); expect(getSession).not.toHaveBeenCalled();
  });
  it("does not intercept guest joins or gameplay", async () => {
    request.mockResolvedValue(new Response(null, { status: 401 }));
    await gamesHostFetch("/api/games/live-craps", { ...entry, body: JSON.stringify({ action: "join" }) });
    await gamesHostFetch("/api/games/live-craps/ABC234", entry);
    expect(getSession).not.toHaveBeenCalled(); expect(assign).not.toHaveBeenCalled();
  });
  it("sends an unsigned host to sign-in with its return destination", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    request.mockResolvedValue(new Response(null, { status: 401 }));
    await gamesHostFetch("/api/games/live-craps", entry);
    expect(assign).toHaveBeenCalledWith("/games/sign-in?next=%2Fgames%2Flive-craps");
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("preserves account verification errors without retrying creation", async () => {
    request.mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(new Response(null, { status: 500 }));
    expect((await gamesHostFetch("/api/games/live-craps", entry)).status).toBe(500);
    expect(request).toHaveBeenCalledTimes(2); expect(assign).not.toHaveBeenCalled();
  });
});
