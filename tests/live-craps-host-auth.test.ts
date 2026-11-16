import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createGamesSessionToken, GAMES_SESSION_COOKIE } from "@/lib/play-point-core/games-session";
const create = vi.hoisted(() => vi.fn());
const join = vi.hoisted(() => vi.fn());
vi.mock("@/lib/play-point-core/live-craps-room-server", () => ({ createLiveCrapsServerRoom: create, joinLiveCrapsServerRoom: join }));
import { POST } from "@/app/api/games/live-craps/route";
beforeEach(() => { vi.clearAllMocks(); process.env.PLAY_POINT_GAMES_SESSION_SECRET = "local-test-secret"; create.mockResolvedValue({ code: "ABC234" }); join.mockResolvedValue({ code: "ABC234" }); });
async function enter(action: string, role?: "founder" | "member", tamper = false) {
  const token = role ? await createGamesSessionToken({ sub: "account", email: "founder@example.test", role, entitlements: ["*"] }) : "";
  return POST(new NextRequest("http://localhost/api/games/live-craps", { method: "POST", headers: { "content-type": "application/json", cookie: `${GAMES_SESSION_COOKIE}=${tamper ? token + "x" : token}` }, body: JSON.stringify({ action, name: "Saved founder name", code: "ABC234" }) }));
}
it("does not treat a saved name as authentication", async () => { expect((await enter("create")).status).toBe(401); expect(create).not.toHaveBeenCalled(); });
it("rejects forged account cookies", async () => { expect((await enter("create", "founder", true)).status).toBe(401); expect(create).not.toHaveBeenCalled(); });
it("enforces prelaunch host authorization even for an authenticated member", async () => { expect((await enter("create", "member")).status).toBe(403); expect(create).not.toHaveBeenCalled(); });
it("allows a verified founder to host", async () => { expect((await enter("create", "founder")).status).toBe(201); expect(create).toHaveBeenCalledOnce(); });
it("preserves account-free guest joining", async () => { expect((await enter("join")).status).toBe(200); expect(join).toHaveBeenCalledOnce(); expect(create).not.toHaveBeenCalled(); });
