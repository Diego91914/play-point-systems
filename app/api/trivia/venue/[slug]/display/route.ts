import { NextResponse } from "next/server";
import { getTriviaVenueLeaderboard, loadOpenTriviaVenueSession, loadTriviaVenue, rotateTriviaVenuePresenceToken, safeTriviaVenueTokenMatch } from "@/app/games/trivia/venue/trivia-venue-server";

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
  const leaderboard = await getTriviaVenueLeaderboard(session.id);
  return NextResponse.json({
    venue: { slug: venue.slug, displayName: venue.display_name },
    venueSessionId: session.id,
    status: session.status,
    currentTriviaSessionId: session.current_trivia_session_id,
    presenceToken,
    leaderboard,
  }, { headers: { "Cache-Control": "no-store" } });
}
