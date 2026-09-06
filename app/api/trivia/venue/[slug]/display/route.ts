import { NextResponse } from "next/server";
import { getLatestTriviaVenueChampionship, getTriviaVenueLeaderboard, loadOpenTriviaVenueSession, loadTriviaVenue, rotateTriviaVenuePresenceToken, safeTriviaVenueTokenMatch, TRIVIA_VENUE_CHAMPIONSHIP_WINDOW_MS } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { displayKey?: string };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.displayKey ?? "", venue.display_token_hash)) {
    return NextResponse.json({ error: "Venue display access denied." }, { status: 403 });
  }
  const session = await loadOpenTriviaVenueSession(venue.id);
  if (!session) return NextResponse.json({ error: "No active venue session." }, { status: 404 });
  const presenceToken = await rotateTriviaVenuePresenceToken(session.id);
  const [leaderboard, latestChampionship] = await Promise.all([
    getTriviaVenueLeaderboard(session.id),
    getLatestTriviaVenueChampionship(session.id),
  ]);
  const championshipStartedAtMs = Date.parse(session.championship_started_at);
  const championshipEndsAt = Number.isFinite(championshipStartedAtMs)
    ? new Date(championshipStartedAtMs + TRIVIA_VENUE_CHAMPIONSHIP_WINDOW_MS).toISOString()
    : null;
  return NextResponse.json({
    venue: { slug: venue.slug, displayName: venue.display_name },
    venueSessionId: session.id,
    status: session.status,
    currentTriviaSessionId: session.current_trivia_session_id,
    presenceToken,
    leaderboard,
    championship: {
      startedAt: session.championship_started_at,
      endsAt: championshipEndsAt,
      latest: latestChampionship,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
