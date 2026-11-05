import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGamesSessionToken } from "../lib/play-point-core/games-session";

const state = vi.hoisted(() => ({ token: "", data: null as Record<string, unknown> | null, error: null as { message: string } | null }));
const query = vi.hoisted(() => ({ eq: vi.fn(), not: vi.fn(), neq: vi.fn(), order: vi.fn(), limit: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() }));
const from = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => name === "pps_games_session" && state.token ? { value: state.token } : undefined }) }));
vi.mock("../lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from }) }));
import { GET } from "../app/api/games/clear-the-stack/room/route";

beforeEach(async () => {
  vi.stubEnv("PLAY_POINT_GAMES_SESSION_SECRET", "test-only-host-recovery-secret-1234567890");
  state.token = await createGamesSessionToken({ sub: "verified-host", email: "host@example.test", role: "member", entitlements: ["game.clear_the_stack"] });
  state.data = { id: "12345678-1234-1234-1234-123456789abc", code: "ABC234", status: "playing", spectator_token: "spectator", game_state: { phase: "playing" } };
  state.error = null;
  vi.clearAllMocks();
  from.mockReturnValue(query);
  for (const method of ["eq", "not", "neq", "order", "limit", "select"] as const) query[method].mockReturnValue(query);
  query.maybeSingle.mockImplementation(async () => ({ data: state.data, error: state.error }));
});
afterEach(() => vi.unstubAllEnvs());
describe("host-scoped Clear the Stack recovery API", () => {
  it("discovers active rooms from verified identity without any client room ID", async () => {
    const response = await GET(new Request("https://example.test/api/games/clear-the-stack/room"));
    expect(response.status).toBe(200);
    expect((await response.json()).room.id).toBe(state.data?.id);
    expect(query.eq).toHaveBeenCalledWith("host_session_id", "verified-host");
    expect(query.neq).toHaveBeenCalledWith("status", "closed");
    expect(query.not).toHaveBeenCalledWith("spectator_token", "is", null);
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("always scopes a supplied room ID to the signed-in host", async () => {
    const id = state.data!.id;
    expect((await GET(new Request(`https://example.test/api/games/clear-the-stack/room?id=${id}`))).status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("host_session_id", "verified-host");
    expect(query.eq).toHaveBeenCalledWith("id", id);
  });
  it.each(["", "forged-token"])("rejects absent or forged identity before touching game data", async token => {
    state.token = token;
    expect((await GET(new Request("https://example.test/api/games/clear-the-stack/room"))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
  it("requires the game's entitlement", async () => {
    state.token = await createGamesSessionToken({ sub: "other-host", email: "other@example.test", role: "member", entitlements: [] });
    expect((await GET(new Request("https://example.test/api/games/clear-the-stack/room"))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
  it("distinguishes no active game from failed database access", async () => {
    state.data = null;
    const response = await GET(new Request("https://example.test/api/games/clear-the-stack/room"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ room: null });
    state.error = { message: "backend unavailable" };
    expect((await GET(new Request("https://example.test/api/games/clear-the-stack/room"))).status).toBe(503);
  });
  it("marks an owned closed room as terminal rather than treating auth errors as closure", async () => {
    state.data!.status = "closed";
    expect((await GET(new Request(`https://example.test/api/games/clear-the-stack/room?id=${state.data!.id}`))).status).toBe(410);
  });
});
