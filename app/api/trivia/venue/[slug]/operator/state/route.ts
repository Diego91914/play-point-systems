import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { loadOpenTriviaVenueSession, loadTriviaVenue, safeTriviaVenueTokenMatch } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { operatorKey?: string };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.operatorKey ?? "", venue.operator_token_hash)) {
    return NextResponse.json({ error: "Venue operator access denied." }, { status: 403 });
  }

  const session = await loadOpenTriviaVenueSession(venue.id);
  if (!session) {
    return NextResponse.json({ venue: { slug: venue.slug, displayName: venue.display_name }, session: null, players: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: players, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .select("id, name, rolling_score, score_total, hourly_score, consecutive_questions_missed, presence_expires_at, removed_at, last_active_at")
    .eq("venue_session_id", session.id)
    .order("hourly_score", { ascending: false });
  if (error) throw error;

  const now = Date.now();
  return NextResponse.json({
    venue: { slug: venue.slug, displayName: venue.display_name },
    session: {
      id: session.id,
      status: session.status,
      currentTriviaSessionId: session.current_trivia_session_id,
      startedAt: session.started_at,
    },
    players: (players ?? []).map((player) => ({
      id: player.id,
      name: player.name,
      rollingScore: player.rolling_score,
      scoreTotal: player.score_total,
      hourlyScore: player.hourly_score ?? 0,
      consecutiveQuestionsMissed: player.consecutive_questions_missed,
      presenceExpiresAt: player.presence_expires_at,
      presenceExpired: Date.parse(player.presence_expires_at) <= now,
      removed: Boolean(player.removed_at),
      lastActiveAt: player.last_active_at,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
