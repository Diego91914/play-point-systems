import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => ({ rows: {} as Record<string, Record<string, unknown> | null>, update: vi.fn(), insert: vi.fn(), error: false }));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from: (table: string) => ({ update: db.update, insert: db.insert, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.rows[table] ?? null, error: db.error ? { message: "outage" } : null }) }) }) }) }) }));
import { resolvePlayAmplifiedSession } from "../lib/play-point-core/room-registry";
const NOW = Date.parse("2026-10-10T12:00:00Z");
const iso = (hours: number) => new Date(NOW + hours * 3600000).toISOString();
function entry(sku: string) { db.rows.ppl_room_registry = { code: "ABC234", game_sku: sku, join_href: "/game?code=ABC234", participation_model: "HOSTED_ROSTER", created_at: iso(-72), expires_at: iso(-48) }; }
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW); db.rows = {}; db.error = false; });
afterEach(() => vi.useRealTimers());
it.each([
 ["game.on_my_list", "ppl_on_my_list_rooms", {status:"guessing"}],
 ["game.chain_reaction", "ppl_chain_reaction_rooms", {status:"playing"}],
 ["game.how_close", "ppl_how_close_rooms", {status:"playing"}],
 ["game.all_about_you", "ppl_all_about_you_rooms", {status:"reveal"}],
 ["game.inside_man", "ppl_inside_man_rooms", {phase:"mission"}],
 ["game.last_call_blackwood", "ppl_mystery_rooms", {status:"interrogation"}],
 ["game.phone_holdem", "ppl_holdem_tables", {status:"showdown"}],
 ["game.live_craps", "ppl_live_craps_rooms", {room:{phase:"playing"}}],
] as const)("preserves active %s using its authoritative renewed lease", async(sku,table,state)=>{
 entry(sku); db.rows[table]={state,created_at:iso(-72),updated_at:iso(-1),expires_at:iso(23)};
 const room=await resolvePlayAmplifiedSession("ABC234"); expect(room?.expiresAt).toBe(iso(23));
 expect(db.update).not.toHaveBeenCalled(); expect(db.insert).not.toHaveBeenCalled();
});
it.each(["finished","closed","completed"])("expires terminal state %s even with a future directory lease",async status=>{
 entry("game.on_my_list"); db.rows.ppl_on_my_list_rooms={state:{status},expires_at:iso(24)};
 expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull();
});
it("expires the final Mystery reveal, not intermediate reveals in other games",async()=>{
 entry("game.last_call_blackwood");db.rows.ppl_mystery_rooms={state:{status:"reveal"},expires_at:iso(24)};
 expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull();
});
it("public polling cannot renew an abandoned game",async()=>{
 entry("game.on_my_list");db.rows.ppl_on_my_list_rooms={state:{status:"guessing"},updated_at:iso(-25),expires_at:iso(-1)};
 for(let n=0;n<3;n++) expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull();
 expect(db.update).not.toHaveBeenCalled();expect(db.insert).not.toHaveBeenCalled();
});
it.each(["game.clear_the_stack","game.league_night"])("keeps an old active hosted session %s after authorized activity",async sku=>{
 entry(sku);db.rows[sku==="game.league_night"?"ppl_league_events":"ppl_clear_stack_rooms"]={id:"event",status:"open",event_date:"2026-10-01",created_at:iso(-72),updated_at:iso(-1)};
 expect((await resolvePlayAmplifiedSession("ABC234"))?.expiresAt).toBe(iso(23));
});
it("preserves scheduled League Night until after the event day",async()=>{
 entry("game.league_night");db.rows.ppl_league_events={id:"event",status:"open",event_date:"2026-11-01",created_at:iso(-72),updated_at:null};
 expect((await resolvePlayAmplifiedSession("ABC234"))?.expiresAt).toBe("2026-11-03T00:00:00.000Z");
});
it("closed scheduled events remain expired",async()=>{
 entry("game.league_night");db.rows.ppl_league_events={id:"event",status:"closed",event_date:"2026-11-01",created_at:iso(-72)};
 expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull();
});
it("does not backfill or revive abandoned historical hosted rooms",async()=>{
 entry("game.clear_the_stack");db.rows.ppl_clear_stack_rooms={id:"room",status:"playing",created_at:iso(-72),updated_at:null};
 expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull();expect(db.update).not.toHaveBeenCalled();
});
it("expires missing authoritative records and fails closed on database errors",async()=>{
 entry("game.on_my_list");expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull();
 db.error=true;await expect(resolvePlayAmplifiedSession("ABC234")).rejects.toThrow();
});
it("checks Trivia completion and its own lease",async()=>{
 entry("game.play_point_trivia");db.rows.ppl_trivia_sessions={status:"in-progress",expires_at:iso(4)};
 expect(await resolvePlayAmplifiedSession("ABC234")).not.toBeNull();
 db.rows.ppl_trivia_sessions.status="completed";expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull();
});
