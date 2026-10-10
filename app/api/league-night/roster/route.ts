import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";

async function owner(eventId: string) {
  const store = await cookies();
  const claims = await verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);
  if (!claims) return null;
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("ppl_league_events").select("id").eq("id", eventId).eq("owner_user_id", claims.sub).maybeSingle();
  return data ? { claims, supabase } : null;
}

export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get("eventId") ?? "";
  const access = await owner(eventId);
  if (!access) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const { data, error } = await access.supabase.from("ppl_league_roster").select("id,display_name,pdga_number,rating,division,source,checked_in,account_user_id").eq("event_id", eventId).order("display_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ players: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { eventId?: string; name?: string; pdgaNumber?: number; rating?: number; division?: string };
  const eventId = String(body.eventId ?? "");
  const access = await owner(eventId);
  if (!access) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!canHostDuringPrelaunch(access.claims)) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
  const name = String(body.name ?? "").trim().slice(0,100);
  if (!name) return NextResponse.json({ error: "Player name is required." }, { status: 400 });
  const { data, error } = await access.supabase.from("ppl_league_roster").insert({ event_id: eventId, display_name: name, pdga_number: Number(body.pdgaNumber) || null, rating: Number(body.rating) || null, division: String(body.division ?? "").trim().slice(0,40) || null, source: "manual", checked_in: true }).select("id,display_name,pdga_number,rating,division,source,checked_in").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data }, { status: 201 });
}
