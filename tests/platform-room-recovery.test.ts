import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ claims: null as null | {sub:string;role:string;entitlements:string[]}, rpc:vi.fn() }));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>undefined})}));
vi.mock("@/lib/play-point-core/games-session",()=>({GAMES_SESSION_COOKIE:"pps_games_session",verifyGamesSessionToken:async()=>m.claims,isPrivilegedGamesSession:(c:{role:string})=>["founder","builder"].includes(c.role)}));
vi.mock("@/lib/play-point-core/quick-score-supabase",()=>({getSupabaseServerClient:()=>({rpc:m.rpc})}));
import { POST } from "../app/api/games/clear-the-stack/room/recover/route";
const req=(body:unknown)=>new Request("https://example.test/api/recover",{method:"POST",body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();m.claims=null;m.rpc.mockResolvedValue({data:{id:"room",code:"ABC234",status:"playing"},error:null});});
it("blocks guests and authenticated Members before database recovery",async()=>{
 expect((await POST(req({code:"ABC234"}))).status).toBe(401);
 m.claims={sub:"owner",role:"member",entitlements:["*"]};expect((await POST(req({code:"ABC234"}))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();
});
it.each(["founder","builder"])("uses verified %s identity and original normalized code only",async role=>{
 m.claims={sub:"owner",role,entitlements:[]};const response=await POST(req({code:" abc234 ",owner:"other",status:"open",updatedAt:"2999"}));
 expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toBe("no-store");
 expect(m.rpc).toHaveBeenCalledWith("ppl_recover_clear_stack_room",{p_owner:"owner",p_code:"ABC234"});
});
it.each([["42501",404],["23505",409],["55000",409],["XX000",500]] as const)("maps %s without leaking database details",async(code,status)=>{
 m.claims={sub:"owner",role:"founder",entitlements:[]};m.rpc.mockResolvedValue({data:null,error:{code,message:"private DB details"}});
 const response=await POST(req({code:"ABC234"}));expect(response.status).toBe(status);expect(await response.text()).not.toContain("private DB details");
});
it.each([null,{}, {code:123},{code:"BAD"},{code:"ABC2345"}])("rejects malformed recovery input %j",async body=>{
 m.claims={sub:"owner",role:"builder",entitlements:[]};expect((await POST(req(body))).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();
});
