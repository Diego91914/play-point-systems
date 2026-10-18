import { beforeEach, expect, it, vi } from "vitest";
const model = vi.hoisted(() => ({ claims: null as null | { sub: string; role: string; entitlements: string[] }, owner: "owner", state: "open", update: vi.fn(), rpc: vi.fn() }));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>undefined})}));
vi.mock("@/lib/play-point-core/games-session",()=>({GAMES_SESSION_COOKIE:"pps_games_session",verifyGamesSessionToken:async()=>model.claims,isPrivilegedGamesSession:(claims:{role:string})=>["founder","builder"].includes(claims.role)}));
vi.mock("@/lib/play-point-core/room-registry",()=>({createPlayAmplifiedSessionCode:()=>"ABC234",reservePlayAmplifiedSession:vi.fn(),releasePlayAmplifiedSession:vi.fn()}));
vi.mock("@/lib/play-point-core/quick-score-supabase",()=>({getSupabaseServerClient:()=>({rpc:model.rpc,from:()=>({update:(value:{status:string})=>{
 model.update(value);const filters:Record<string,string>={};let excludeClosed=false;
 const q={eq:(key:string,value:string)=>{filters[key]=value;return q;},neq:()=>{excludeClosed=true;return q;},select:()=>q,maybeSingle:async()=>{
  const owner=filters.owner_user_id??filters.host_session_id;
  if(owner!==model.owner||filters.id!=="event"||(filters.status&&filters.status!==model.state)||(excludeClosed&&model.state==="closed"))return{data:null,error:null};
  model.state=value.status;return{data:{id:"event",status:model.state},error:null};
 }};return q;
}})})}));
import { PATCH as league, POST as createLeague } from "../app/api/league-night/route";
import { PATCH as stack } from "../app/api/games/clear-the-stack/room/route";
const request=(body:object)=>new Request("https://example.test/api/hosted",{method:"PATCH",body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();model.claims=null;model.owner="owner";model.state="open";model.rpc.mockResolvedValue({data:{id:"event",join_code:"ABC234"},error:null});});
it.each([[league,{id:"event",intent:"renew"}],[stack,{id:"event",status:"playing"}]] as const)("denies guest and member renewal before touching state",async(route,body)=>{
 expect((await route(request(body))).status).toBe(401);
 model.claims={sub:"owner",role:"member",entitlements:["*"]};expect((await route(request(body))).status).toBe(403);expect(model.update).not.toHaveBeenCalled();
});
it.each(["founder","builder"])("permits only the %s owner to renew an open event",async role=>{
 model.claims={sub:"other",role,entitlements:[]};expect((await league(request({id:"event",intent:"renew"}))).status).toBe(404);
 model.claims.sub="owner";expect((await league(request({id:"event",intent:"renew",updatedAt:"2999-01-01",expiresAt:"2999-01-01"}))).status).toBe(200);
 expect(model.update).toHaveBeenLastCalledWith({status:"open"});
});
it("closed events cannot be reopened by renewal",async()=>{
 model.claims={sub:"owner",role:"founder",entitlements:[]};expect((await league(request({id:"event",intent:"close"}))).status).toBe(200);
 expect((await league(request({id:"event",intent:"renew"}))).status).toBe(404);
});
it("Clear the Stack renewal checks ownership and cannot revive a closed room",async()=>{
 model.claims={sub:"other",role:"founder",entitlements:[]};expect((await stack(request({id:"event",status:"playing"}))).status).toBe(403);
 model.claims.sub="owner";expect((await stack(request({id:"event",status:"playing"}))).status).toBe(200);
 expect((await stack(request({id:"event",status:"closed"}))).status).toBe(200);
 expect((await stack(request({id:"event",status:"playing"}))).status).toBe(403);
});
it("a collision is retried as a fresh atomic transaction",async()=>{
 model.claims={sub:"owner",role:"builder",entitlements:[]};model.rpc.mockResolvedValueOnce({data:null,error:{code:"23505",message:"collision"}});
 const response=await createLeague(request({name:"League",code:"CLIENT",players:[{name:"Guest",pdgaNumber:314732,rating:876,division:"MA2"}]}));
 expect(response.status).toBe(201);expect(model.rpc).toHaveBeenCalledTimes(2);
 expect(model.rpc).toHaveBeenLastCalledWith("ppl_create_league_night",expect.objectContaining({p_code:"ABC234",p_players:[{display_name:"Guest",pdga_number:314732,rating:876,division:"MA2"}]}));
});
it("exhausted collisions and RPC errors never cause separate compensating writes",async()=>{
 model.claims={sub:"owner",role:"founder",entitlements:[]};model.rpc.mockResolvedValue({data:null,error:{code:"23505",message:"collision"}});
 expect((await createLeague(request({name:"League"}))).status).toBe(503);expect(model.rpc).toHaveBeenCalledTimes(12);expect(model.update).not.toHaveBeenCalled();
});
