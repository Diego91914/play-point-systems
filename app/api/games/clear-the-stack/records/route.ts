import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { gamesSessionOwns, GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";

const SKU = "game.clear_the_stack";
const TABLE = "ppl_game_personal_records";

async function account() {
  const store = await cookies();
  const claims = await verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);
  if (!claims || !gamesSessionOwns(claims, SKU)) return null;
  return claims;
}

export async function GET(request: Request) {
  const claims = await account();
  if (!claims) return NextResponse.json({ error: "Sign in with an account that owns Clear the Stack." }, { status: 401 });
  const url = new URL(request.url);
  const distance = Math.max(1, Math.min(100, Number(url.searchParams.get("distance")) || 20));
  const stackSize = Math.max(1, Math.min(100, Number(url.searchParams.get("stackSize")) || 10));
  const setupKey = `${distance}ft:${stackSize}discs`;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("id,score,played_at,details").eq("user_id", claims.sub).eq("game_sku", SKU).eq("setup_key", setupKey).order("score", { ascending: false }).order("played_at", { ascending: true }).limit(3);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data ?? [] });
}

export async function POST(request: Request) {
  const claims = await account();
  if (!claims) return NextResponse.json({ error: "Sign in with an account that owns Clear the Stack." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { distance?: number; stackSize?: number; score?: number; rounds?: number[]; remaining?: number };
  const distance = Math.max(1, Math.min(100, Number(body.distance) || 20));
  const stackSize = Math.max(1, Math.min(100, Number(body.stackSize) || 10));
  const score = Number(body.score);
  if (!Number.isFinite(score)) return NextResponse.json({ error: "Invalid score." }, { status: 400 });
  const rounds = Array.isArray(body.rounds) ? body.rounds.slice(0,3).map(n => Math.max(0, Math.min(stackSize, Number(n) || 0))) : [];
  const remaining = Math.max(0, Math.min(stackSize, Number(body.remaining) || 0));
  const setupKey = `${distance}ft:${stackSize}discs`;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).insert({ user_id: claims.sub, game_sku: SKU, setup_key: setupKey, score, details: { distance, stackSize, rounds, remaining } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data, error: loadError } = await supabase.from(TABLE).select("id,score,played_at,details").eq("user_id", claims.sub).eq("game_sku", SKU).eq("setup_key", setupKey).order("score", { ascending: false }).order("played_at", { ascending: true }).limit(3);
  if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 });
  return NextResponse.json({ records: data ?? [] });
}
