import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const fixtures = vi.hoisted(() => ({ claims: null as null | { sub: string; role: string; entitlements: string[] }, create: vi.fn(), join: vi.fn(), recover: vi.fn(), reserve: vi.fn(), release: vi.fn() }));
vi.mock("@/lib/play-point-core/games-session", () => ({ GAMES_SESSION_COOKIE: "pps_games_session", verifyGamesSessionToken: async () => fixtures.claims, isPrivilegedGamesSession: (c: {role: string}) => ["founder","builder"].includes(c.role) }));
vi.mock("@/lib/play-point-core/room-registry", () => ({ reservePlayAmplifiedSession: fixtures.reserve, releasePlayAmplifiedSession: fixtures.release, registerPlayAmplifiedRoom: vi.fn() }));
vi.mock("@/lib/play-point-core/on-my-list-server", () => ({ createOnMyListRoom: fixtures.create, joinOnMyListRoom: fixtures.join, recoverOnMyListHost: fixtures.recover }));
vi.mock("@/lib/play-point-core/mystery-server-v3", () => ({ createMysteryRoom: fixtures.create, joinMysteryRoom: fixtures.join }));
vi.mock("@/lib/play-point-core/live-craps-room-server", () => ({ createLiveCrapsServerRoom: fixtures.create, joinLiveCrapsServerRoom: fixtures.join }));
import { POST as list } from "../app/api/games/on-my-list/route";
import { POST as craps } from "../app/api/games/live-craps/route";
beforeEach(() => { vi.clearAllMocks(); fixtures.claims = null; fixtures.reserve.mockResolvedValue({code:"ABC234"}); fixtures.create.mockResolvedValue({code:"ABC234"}); fixtures.join.mockResolvedValue({code:"ABC234"}); fixtures.recover.mockResolvedValue({code:"ABC234"}); });
const request = (body: object) => new NextRequest("https://example.test/api/create", {method:"POST",body:JSON.stringify(body)});
it.each([[list,"intent"],[craps,"action"]] as const)("requires private hosting and uses reserved code", async (route,key) => {
 expect((await route(request({[key]:"create",name:"Host"}))).status).toBe(401);
 fixtures.claims={sub:"member",role:"member",entitlements:["*"]};
 expect((await route(request({[key]:"create",name:"Host"}))).status).toBe(403);
 fixtures.claims={sub:"host",role:"founder",entitlements:[]};
 expect((await route(request({[key]:"create",name:"Host",code:"CUSTOM"}))).status).toBeLessThan(300);
 expect(fixtures.reserve).toHaveBeenCalledWith(expect.objectContaining({participationModel:"OPEN_LOBBY"}));
 if(route===list) expect(fixtures.create).toHaveBeenCalledWith("Host","host","ABC234");
 else expect(fixtures.create).toHaveBeenCalledWith(expect.objectContaining({code:"ABC234"}));
});
it.each([[list,"intent"],[craps,"action"]] as const)("preserves guest join and compensates failed creation", async(route,key)=>{
 expect((await route(request({[key]:"join",name:"Guest",code:"ABC234"}))).status).toBe(200);
 expect(fixtures.reserve).not.toHaveBeenCalled();
 fixtures.claims={sub:"host",role:"builder",entitlements:[]}; fixtures.create.mockRejectedValue(new Error("create failed"));
 expect((await route(request({[key]:"create",name:"Host"}))).status).toBe(400); expect(fixtures.release).toHaveBeenCalledWith("ABC234");
});
it("preserves authorized On My List host recovery without allocating another session",async()=>{
 fixtures.claims={sub:"host",role:"founder",entitlements:[]};
 expect((await list(request({intent:"rejoin_host",code:"ABC234"}))).status).toBe(200);
 expect(fixtures.recover).toHaveBeenCalledWith("ABC234","host",true); expect(fixtures.reserve).not.toHaveBeenCalled();
});

import { POST as mystery } from "../app/api/games/mystery/route";
it("Mystery guest access does not allow anonymous or member hosting", async () => {
 expect((await mystery(request({intent:"create",name:"Host"}))).status).toBe(401);
 fixtures.claims={sub:"member",role:"member",entitlements:["*"]};
 expect((await mystery(request({intent:"create",name:"Host"}))).status).toBe(403);
 expect(fixtures.create).not.toHaveBeenCalled();
 fixtures.claims={sub:"host",role:"founder",entitlements:[]};
 expect((await mystery(request({intent:"create",name:"Host"}))).status).toBe(200);
});
