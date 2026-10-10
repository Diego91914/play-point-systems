import { beforeEach, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({claims:null as null|{sub:string;role:string;entitlements:string[]},insert:vi.fn(),update:vi.fn()}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>undefined})}));
vi.mock("@/lib/play-point-core/games-session",()=>({GAMES_SESSION_COOKIE:"pps_games_session",verifyGamesSessionToken:async()=>m.claims,isPrivilegedGamesSession:(c:{role:string})=>["founder","builder"].includes(c.role)}));
vi.mock("@/lib/play-point-core/quick-score-supabase",()=>({getSupabaseServerClient:()=>({from:(table:string)=>{
 const filters:Record<string,string>={};const q={select:()=>q,eq:(key:string,value:string)=>{filters[key]=value;return q;},order:async()=>({data:[{id:"player",display_name:"Guest"}],error:null}),maybeSingle:async()=>({data:table==="ppl_league_events" && (!filters.owner_user_id||filters.owner_user_id==="owner")?{id:"event",status:"open"}:null,error:null}),single:async()=>({data:{id:"player",display_name:"Guest"},error:null}),insert:(value:unknown)=>{m.insert(value);return q;},update:(value:unknown)=>{m.update(value);return q;}};return q;
}})}));
import { POST as add, GET as roster } from "../app/api/league-night/roster/route";
import { POST as guestJoin } from "../app/api/league-night/join/route";
const req=(body:unknown)=>new Request("https://example.test/api/league-night/roster",{method:"POST",body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();m.claims=null;});
it("rejects unauthenticated owner management",async()=>{expect((await add(req({eventId:"event",name:"Guest"}))).status).toBe(404);expect(m.insert).not.toHaveBeenCalled();});
it("rejects an authenticated non-privileged owner write while preserving owner reads",async()=>{
 m.claims={sub:"owner",role:"member",entitlements:["*"]};expect((await add(req({eventId:"event",name:"Guest"}))).status).toBe(403);expect(m.insert).not.toHaveBeenCalled();
 expect((await roster(new Request("https://example.test/api/league-night/roster?eventId=event"))).status).toBe(200);
});
it.each(["founder","builder"])("preserves authorized %s roster management",async role=>{
 m.claims={sub:"owner",role,entitlements:[]};expect((await add(req({eventId:"event",name:"Guest",pdgaNumber:314732,rating:876,division:"MA2"}))).status).toBe(201);
 expect(m.insert).toHaveBeenCalledWith(expect.objectContaining({event_id:"event",display_name:"Guest",source:"manual"}));
});
it("rejects a different Founder owner",async()=>{m.claims={sub:"other",role:"founder",entitlements:[]};expect((await add(req({eventId:"event",name:"Guest"}))).status).toBe(404);expect(m.insert).not.toHaveBeenCalled();});
it("preserves account-free invited guest joining through the server",async()=>{
 expect((await guestJoin(req({code:"ABC234",name:"Invited"}))).status).toBe(201);
 expect(m.insert).toHaveBeenCalledWith(expect.objectContaining({event_id:"event",display_name:"Invited",source:"qr"}));
});
