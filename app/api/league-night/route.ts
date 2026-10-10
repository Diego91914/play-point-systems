import { createPlayAmplifiedSessionCode } from "@/lib/play-point-core/room-registry";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";

const EVENTS = "ppl_league_events";

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
  const players = Array.isArray(body.players) ? body.players.slice(0,500) : [];
  const rows = players.map(p => ({ display_name: String(p.name ?? "").trim().slice(0,100), pdga_number: Number(p.pdgaNumber) || null, rating: Number(p.rating) || null, division: String(p.division ?? "").trim().slice(0,40) || null })).filter(p => p.display_name);
  const supabase = getSupabaseServerClient();
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data: event, error } = await supabase.rpc("ppl_create_league_night", {
      p_owner_user_id: claims.sub, p_name: name, p_event_date: eventDate,
      p_distance: distance, p_stack_size: stackSize, p_players: rows,
      p_code: createPlayAmplifiedSessionCode(),
    });
    if (!error && event) return NextResponse.json({ event }, { status: 201 });
    // Every failed RPC rolls back all four writes, including a code collision.
    if (error?.code === "23505") continue;
    return NextResponse.json({ error: error?.message ?? "Could not create event." }, { status: error?.code === "22023" || error?.code === "22007" || error?.code === "22008" ? 400 : 500 });
  }
  return NextResponse.json({ error: "Could not allocate an unused League Night code. Try again." }, { status: 503 });
}

export async function PATCH(request: Request) {
  const claims = await account();
  if (!claims) return NextResponse.json({ error: "Sign in to manage League Night." }, { status: 401 });
  if (!canHostDuringPrelaunch(claims)) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string" || !["renew", "close"].includes(body.intent)) return NextResponse.json({ error: "Event and valid intent required." }, { status: 400 });
  const { data: event, error } = await getSupabaseServerClient().from(EVENTS)
    .update({ status: body.intent === "close" ? "closed" : "open" })
    .eq("id", body.id).eq("owner_user_id", claims.sub).eq("status", "open")
    .select("id,name,event_date,join_code,status").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update League Night." }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Open event not found or not owned by this account." }, { status: 404 });
  return NextResponse.json({ event });
}
