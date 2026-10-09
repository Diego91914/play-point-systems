import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ claims: null as null | { sub: string; role: string; entitlements: string[] }, insert: vi.fn(), reserve: vi.fn(), release: vi.fn() }));
vi.mock("@/lib/play-point-core/games-session", () => ({ GAMES_SESSION_COOKIE: "pps_games_session", verifyGamesSessionToken: async () => mocks.claims, gamesSessionOwns: () => false, isPrivilegedGamesSession: (c: { role: string }) => ["founder", "builder"].includes(c.role) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/play-point-core/room-registry", () => ({ reservePlayAmplifiedSession: mocks.reserve, releasePlayAmplifiedSession: mocks.release }));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from: () => ({ insert: mocks.insert }) }) }));
import { proxy } from "../proxy";
import { POST as clearStack } from "../app/api/games/clear-the-stack/room/route";
import { POST as league } from "../app/api/league-night/route";
beforeEach(() => {
  vi.clearAllMocks(); mocks.claims = null;
  mocks.reserve.mockResolvedValue({ code: "ABC234" });
  mocks.insert.mockImplementation(() => ({ select: () => ({ single: async () => ({ data: { id: "new-room", code: "ABC234", join_code: "ABC234" }, error: null }) }) }));
});
describe("guest authentication boundaries", () => {
  it.each(["/games/mystery?code=ABC234", "/api/games/mystery", "/games/trivia/venue/test/join", "/api/trivia/venue/test/join", "/api/trivia/venue/test/player", "/api/trivia/venue/test/refresh"])("allows invited guest path %s", async (path) => {
    const response = await proxy(new NextRequest(`https://example.test${path}`, { method: path.startsWith("/api/") ? "POST" : "GET" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
  it.each(["/api/trivia/venue/test/operator", "/api/trivia/venue/test/tick", "/api/trivia/venue/test/state", "/api/games/clear-the-stack/room"])("blocks anonymous privileged path %s", async (path) => {
    expect((await proxy(new NextRequest(`https://example.test${path}`, { method: "POST" }))).status).toBe(401);
  });
  it("does not open arbitrary venue methods", async () => {
    expect((await proxy(new NextRequest("https://example.test/api/trivia/venue/test/player", { method: "DELETE" }))).status).toBe(401);
  });
});
describe.each([["Clear the Stack", clearStack], ["League Night", league]] as const)("%s server hosting", (_, create) => {
  const request = () => new Request("https://example.test/api/create", { method: "POST", body: JSON.stringify({ name: "Test" }) });
  it("rejects an anonymous host before DB access", async () => {
    expect((await create(request())).status).toBe(401); expect(mocks.insert).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("rejects an ordinary member even with ownership", async () => {
    mocks.claims = { sub: "member", role: "member", entitlements: ["*"] };
    expect((await create(request())).status).toBe(403); expect(mocks.insert).not.toHaveBeenCalled();
  });
  it.each(["founder", "builder"])("allows %s and registers the hosted roster", async role => {
    mocks.claims = { sub: "host", role, entitlements: [] };
    expect((await create(request())).status).toBeLessThan(300);
    expect(mocks.reserve).toHaveBeenCalledWith(expect.objectContaining({ participationModel: "HOSTED_ROSTER" }));
    expect(mocks.insert.mock.calls[0][0]).toEqual(expect.objectContaining({ [create === clearStack ? "code" : "join_code"]: "ABC234" }));
  });
  it("releases only the new reservation after failed creation", async () => {
    mocks.claims = { sub: "host", role: "founder", entitlements: [] };
    mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: null, error: { message: "failed" } }) }) });
    expect((await create(request())).status).toBe(500); expect(mocks.release).toHaveBeenCalledWith("ABC234");
  });
});
