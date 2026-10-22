import "server-only";
import { getSupabaseServerClient } from "./quick-score-supabase";
import { readShotCaddySession } from "./shot-caddy-session";
import type { PlayAmplifiedSession } from "./room-registry";

const DAY = 86_400_000;
const ROOM_AUTHORITIES: Record<string, { table: string; code: string; phase?: "phase" | "craps"; terminal?: string[] }> = {
  "game.chain_reaction": { table: "ppl_chain_reaction_rooms", code: "code" },
  "game.how_close": { table: "ppl_how_close_rooms", code: "code" },
  "game.on_my_list": { table: "ppl_on_my_list_rooms", code: "code" },
  "game.all_about_you": { table: "ppl_all_about_you_rooms", code: "code" },
  "game.inside_man": { table: "ppl_inside_man_rooms", code: "code", phase: "phase" },
  "game.last_call_blackwood": { table: "ppl_mystery_rooms", code: "code", terminal: ["reveal"] },
  "game.phone_holdem": { table: "ppl_holdem_tables", code: "code" },
  "game.live_craps": { table: "ppl_live_craps_rooms", code: "room_code", phase: "craps" },
};
const TERMINAL = new Set(["finished", "completed", "closed"]);
function time(value: unknown) { return typeof value === "string" ? Date.parse(value) : NaN; }

/** Public discovery never writes activity or renews a gameplay lease. */
export async function authoritativeSessionExpiry(session: PlayAmplifiedSession, now = Date.now()): Promise<string | null> {
  if (session.gameSku.startsWith("shot_caddy.") || session.gameSku === "quest_caddy.experience") {
    const source = await readShotCaddySession(session.code, now);
    if (!source || source.joinHref !== session.joinHref || source.gameSku !== session.gameSku || (session.externalSessionId && source.externalSessionId !== session.externalSessionId)) return null;
    return source.expiresAt ?? null;
  }
  const supabase = getSupabaseServerClient();
  const authority = ROOM_AUTHORITIES[session.gameSku];
  if (authority) {
    const { data, error } = await supabase.from(authority.table).select("state,created_at,updated_at,expires_at").eq(authority.code, session.code).maybeSingle();
    if (error) throw new Error("Unable to verify game session lifecycle.");
    if (!data) return null;
    const phase = authority.phase === "craps" ? data.state?.room?.phase : authority.phase === "phase" ? data.state?.phase : data.state?.status;
    if (typeof phase !== "string" || TERMINAL.has(phase) || authority.terminal?.includes(phase)) return null;
    // These game servers advance this lease on authorized state changes.
    const expires = time(data.expires_at);
    return Number.isFinite(expires) && expires > now ? new Date(expires).toISOString() : null;
  }
  if (session.gameSku === "game.play_point_trivia") {
    const { data, error } = await supabase.from("ppl_trivia_sessions").select("status,expires_at").eq("room_code", session.code).maybeSingle();
    if (error) throw new Error("Unable to verify Trivia session lifecycle.");
    const expires = time(data?.expires_at);
    return data && ["lobby", "in-progress"].includes(data.status) && Number.isFinite(expires) && expires > now ? new Date(expires).toISOString() : null;
  }
  if (session.gameSku === "game.clear_the_stack" || session.gameSku === "game.league_night") {
    const league = session.gameSku === "game.league_night";
    const columns: string = league ? "id,status,created_at,updated_at,event_date" : "id,status,created_at,updated_at";
    const { data: rawData, error } = await supabase.from(league ? "ppl_league_events" : "ppl_clear_stack_rooms")
      .select(columns)
      .eq(league ? "join_code" : "code", session.code).maybeSingle();
    if (error) throw new Error("Unable to verify hosted session lifecycle.");
    const data = rawData as unknown as { id: string; status: string; created_at: string; updated_at: string | null; event_date?: string } | null;
    if (!data || !["open", ...(league ? [] : ["playing"])].includes(data.status) || (session.externalSessionId && data.id !== session.externalSessionId)) return null;
    const activity = time(data.updated_at ?? data.created_at);
    const scheduled = league ? time(`${data.event_date}T00:00:00.000Z`) + 2 * DAY : 0;
    const expires = Math.max(activity + DAY, scheduled);
    return Number.isFinite(expires) && expires > now ? new Date(expires).toISOString() : null;
  }
  // Unadapted formats cannot gain an indefinite lease from a missing expiry.
  const expires = session.expiresAt ? time(session.expiresAt) : time(session.createdAt) + DAY;
  return Number.isFinite(expires) && expires > now ? new Date(expires).toISOString() : null;
}
