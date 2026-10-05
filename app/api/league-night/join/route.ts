import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

export async function GET(request: Request) {
  const code = (new URL(request.url).searchParams.get("code") ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Join code required." }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const { data: event, error } = await supabase.from("ppl_league_events").select("id,name,event_date,status").eq("join_code", code).eq("status","open").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "League Night not found or closed." }, { status: 404 });
  const { data: activity } = await supabase.from("ppl_league_activities").select("id,name,settings,status").eq("event_id", event.id).eq("game_sku","game.clear_the_stack").eq("status","open").maybeSingle();
  return NextResponse.json({ event, activity });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { code?: string; name?: string; pdgaNumber?: number };
  const code = String(body.code ?? "").trim().toUpperCase();
  const name = String(body.name ?? "").trim().slice(0,100);
  if (!code || !name) return NextResponse.json({ error: "Join code and player name are required." }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const { data: event } = await supabase.from("ppl_league_events").select("id").eq("join_code", code).eq("status","open").maybeSingle();
  if (!event) return NextResponse.json({ error: "League Night not found or closed." }, { status: 404 });
  const pdga = Number(body.pdgaNumber) || null;
  if (pdga) {
    const { data: existing } = await supabase.from("ppl_league_roster").select("id,display_name,pdga_number,rating,division,source,checked_in").eq("event_id", event.id).eq("pdga_number", pdga).maybeSingle();
    if (existing) {
      await supabase.from("ppl_league_roster").update({ checked_in: true }).eq("id", existing.id);
      return NextResponse.json({ player: { ...existing, checked_in: true }, matched: true });
    }
  }
  const { data, error } = await supabase.from("ppl_league_roster").insert({ event_id: event.id, display_name: name, pdga_number: pdga, source: "qr", checked_in: true }).select("id,display_name,pdga_number,rating,division,source,checked_in").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data, matched: false }, { status: 201 });
}
