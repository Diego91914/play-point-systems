import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";

const TABLE = "ppl_clear_stack_scores";
const noStore = { "Cache-Control": "private, no-store" };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: noStore });
type ScoreRow = { id: number; player_name: string; score: number; played_at: string; remaining: number; rounds: number[]; account_key?: string | null };
function present(rows: ScoreRow[]) {
  return rows.map(row => ({
    id: row.id, name: row.player_name, score: Number(row.score),
    playedAt: row.played_at, remaining: row.remaining, rounds: row.rounds,
    accountLinked: Boolean(row.account_key),
  }));
}
export async function GET(request: Request) {
  const url = new URL(request.url);
  const distance = Number(url.searchParams.get("distance") ?? "20");
  const stackSize = Number(url.searchParams.get("stackSize") ?? "10");
  const period = url.searchParams.get("period") ?? "daily";
  const scope = url.searchParams.get("scope") ?? "global";
  if (![distance, stackSize].every(n => Number.isInteger(n) && n >= 1 && n <= 100))
    return error("Invalid game setup.", 400);
  if (!["daily", "weekly", "all"].includes(period) || !["global", "host", "personal"].includes(scope))
    return error("Invalid leaderboard filter.", 400);
  const supabase = getSupabaseServerClient();
  let hostKey: string | null = null;
  if (scope !== "global") {
    const claims = await verifyGamesSessionToken((await cookies()).get(GAMES_SESSION_COOKIE)?.value);
    if (!claims || claims.sub === "builder-access") return error("A signed-in player account is required for personal or host records.", 401);
    hostKey = claims.sub;
  }
  let query = supabase.from(TABLE)
    .select("id,player_name,score,played_at,remaining,rounds,account_key")
    .eq("distance", distance).eq("stack_size", stackSize)
    .order("score", { ascending: false })
    .order("played_at", { ascending: true }).limit(10);
  if (scope === "global") {
    query = query.eq("is_ranked", true);
    if (period !== "all") {
      const now = new Date();
      const cutoff = new Date(now);
      if (period === "daily") cutoff.setUTCHours(0, 0, 0, 0);
      else {
        const day = (cutoff.getUTCDay() + 6) % 7;
        cutoff.setUTCDate(cutoff.getUTCDate() - day);
        cutoff.setUTCHours(0, 0, 0, 0);
      }
      query = query.gte("played_at", cutoff.toISOString());
    }
  } else if (scope === "host") query = query.eq("host_key", hostKey!);
  else query = query.eq("account_key", hostKey!);
  const { data, error: dbError } = await query;
  if (dbError) return error("Leaderboard temporarily unavailable.", 503);
  return NextResponse.json({ scope, period, distance, stackSize, timezone: "UTC", entries: present((data ?? []) as ScoreRow[]) }, { headers: noStore });
}
