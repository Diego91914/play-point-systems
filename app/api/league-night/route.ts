import { reservePlayAmplifiedSession, releasePlayAmplifiedSession } from "@/lib/play-point-core/room-registry";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";

const EVENTS = "ppl_league_events";
const ROSTER = "ppl_league_roster";
const ACTIVITIES = "ppl_league_activities";

async function account() {
  const store = await cookies();
  return verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);
}

export async function GET() {
  const claims = await account();
  if (!claims) return NextResponse.json({ error: "Sign in to manage League Night." }, { status: 401 });
  const supabase = getSupabaseServerClient();
  const { data: events, error } = await supabase.from(EVENTS).select("id,name,event_date,join_code,status,created_at").eq("owner_user_id", claims.sub).order("event_date", { ascending: false }).limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}

export async function POST(request: Request) {
  const claims = await account();
  if (!claims) return NextResponse.json({ error: "Sign in to create League Night." }, { status: 401 });
  if (!canHostDuringPrelaunch(claims)) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { name?: string; eventDate?: string; distance?: number; stackSize?: number; players?: Array<{ name?: string; pdgaNumber?: number; rating?: number; division?: string }> };
  const name = String(body.name ?? "").trim().slice(0,120) || "League Night";
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.eventDate ?? "")) ? body.eventDate : new Date().toISOString().slice(0,10);
  const distance = Math.max(1, Math.min(100, Number(body.distance) || 20));
  const stackSize = Math.max(1, Math.min(100, Number(body.stackSize) || 10));
  const eventDay = Date.parse(String(eventDate));
  const directoryExpiry = Math.max(Date.now() + 86400000, Number.isFinite(eventDay) ? eventDay + 172800000 : 0);
  const supabase = getSupabaseServerClient();
  const session = await reservePlayAmplifiedSession({ gameSku: "game.league_night", participationModel: "HOSTED_ROSTER", joinHref: "/league-night/join/{code}", expiresAt: new Date(directoryExpiry).toISOString() });
  const { data: event, error } = await supabase.from(EVENTS).insert({ join_code: session.code, owner_user_id: claims.sub, name, event_date: eventDate, status: "open" }).select("id,name,event_date,join_code,status").single();
  if (error || !event) { await releasePlayAmplifiedSession(session.code); return NextResponse.json({ error: error?.message ?? "Could not create event." }, { status: 500 }); }
  const { error: activityError } = await supabase.from(ACTIVITIES).insert({ event_id: event.id, game_sku: "game.clear_the_stack", name: "Clear the Stack", settings: { distance, stackSize }, status: "open" });
  if (activityError) { await releasePlayAmplifiedSession(session.code); return NextResponse.json({ error: activityError.message }, { status: 500 }); }
  const players = Array.isArray(body.players) ? body.players.slice(0,500) : [];
  if (players.length) {
    const rows = players.map(p => ({ event_id: event.id, display_name: String(p.name ?? "").trim().slice(0,100), pdga_number: Number(p.pdgaNumber) || null, rating: Number(p.rating) || null, division: String(p.division ?? "").trim().slice(0,40) || null, source: "doubles", checked_in: true })).filter(p => p.display_name);
    if (rows.length) {
      const { error: rosterError } = await supabase.from(ROSTER).insert(rows);
      if (rosterError) { await releasePlayAmplifiedSession(session.code); return NextResponse.json({ error: rosterError.message }, { status: 500 }); }
    }
  }
  return NextResponse.json({ event }, { status: 201 });
}
