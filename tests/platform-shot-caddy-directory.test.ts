import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const registry = vi.hoisted(() => ({ resolve: vi.fn(), register: vi.fn() }));
vi.mock("../lib/play-point-core/room-registry", () => ({ resolvePlayAmplifiedSession: registry.resolve, registerPlayAmplifiedSession: registry.register }));
import { registerShotCaddySession } from "../lib/play-point-core/shot-caddy-directory";
const session = () => ({ success: true, sessionCode: "ABC010", roundId: "round-id", createdAt: new Date().toISOString(), roundState: { gameMode: "CLASSIC_GAME", players: [{ id: "seat" }] } });
beforeEach(() => { vi.clearAllMocks(); registry.resolve.mockResolvedValue(null); registry.register.mockResolvedValue(undefined); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => session() })); });
it("registers an authoritative legacy roster and its existing destination", async () => {
 const room = await registerShotCaddySession("abc010");
 expect(room).toEqual(expect.objectContaining({ participationModel: "HOSTED_ROSTER", externalSessionId: "round-id", joinHref: "/shot-caddy/join/ABC010" }));
 expect(fetch).toHaveBeenCalledWith("https://shot-caddy-web.vercel.app/shot-caddy/api/sessions/ABC010", expect.objectContaining({ redirect: "error" }));
});
it.each(["", "invalid", "CREATE"])("rejects malformed or reserved code %s without network access", async code => { expect(await registerShotCaddySession(code)).toBeNull(); expect(fetch).not.toHaveBeenCalled(); });
it.each(["missing", "expired", "mismatch", "unknown mode"])("does not register %s session", async kind => {
 const data = session(); if(kind === "expired") data.createdAt = "2000-01-01";
 if(kind === "mismatch") data.sessionCode = "XYZ234";
 if(kind === "unknown mode") data.roundState.gameMode = "UNKNOWN";
 vi.mocked(fetch).mockResolvedValue({ ok: kind !== "missing", json: async () => data } as Response);
 expect(await registerShotCaddySession("ABC010")).toBeNull(); expect(registry.register).not.toHaveBeenCalled();
});
it("never overwrites a collision", async () => { registry.register.mockRejectedValue(new Error("collision")); await expect(registerShotCaddySession("ABC010")).rejects.toThrow("collision"); });
