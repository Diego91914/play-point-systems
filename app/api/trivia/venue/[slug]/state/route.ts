import { NextResponse } from "next/server";
import { getTriviaVenueLeaderboard, loadOpenTriviaVenueSession, loadTriviaVenue, loadVenueTriviaRuntime, safeTriviaVenueTokenMatch } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { displayKey?: string };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.displayKey ?? "", venue.display_token_hash)) {
    return NextResponse.json({ error: "Venue display access denied." }, { status: 403 });
  }
  const venueSession = await loadOpenTriviaVenueSession(venue.id);
  if (!venueSession) return NextResponse.json({ error: "No active venue session." }, { status: 404 });
  const leaderboard = await getTriviaVenueLeaderboard(venueSession.id);
  if (!venueSession.current_trivia_session_id) {
    return NextResponse.json({
      venue: { slug: venue.slug, displayName: venue.display_name },
      venueSessionId: venueSession.id,
      status: venueSession.status,
      leaderboard,
      game: null,
    }, { headers: { "Cache-Control": "no-store" } });
  }
  const runtime = await loadVenueTriviaRuntime(venueSession.current_trivia_session_id);
  return NextResponse.json({
    venue: { slug: venue.slug, displayName: venue.display_name },
    venueSessionId: venueSession.id,
    status: venueSession.status,
    leaderboard,
    game: {
      status: runtime.session.status,
      phase: runtime.session.phase,
      cardIndex: runtime.session.card_index,
      totalQuestions: runtime.session.deck.cards.length,
      currentCard: runtime.currentCard,
      questionOpenedAt: runtime.session.opened_at,
      questionTimerSeconds: runtime.questionTimerSeconds,
      submittedCount: (runtime.bundle.answers ?? []).length,
      playerCount: (runtime.bundle.players ?? []).length,
      resolution: runtime.session.resolution ? {
        correctSlot: runtime.session.resolution.correctSlot,
        correctText: runtime.session.resolution.correctText,
        explanation: runtime.session.resolution.card?.explanation ?? "",
      } : null,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
