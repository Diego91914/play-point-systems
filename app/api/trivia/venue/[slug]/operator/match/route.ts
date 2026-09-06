import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { createTriviaLiveSession, startTriviaLiveSession } from "@/app/games/trivia/play/trivia-live-service";
import type { RuntimeDifficultyFilter } from "@/app/games/trivia/play/trivia-runtime-types";
import type { TriviaPacingMode } from "@/app/games/trivia/play/trivia-live-timing";
import { loadOpenTriviaVenueSession, loadTriviaVenue, safeTriviaVenueTokenMatch, seatVenuePlayerInTriviaSession } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as {
    operatorKey?: string;
    category?: string;
    difficultyFilter?: RuntimeDifficultyFilter;
    pacingMode?: TriviaPacingMode;
    topicIds?: string[];
  };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.operatorKey ?? "", venue.operator_token_hash)) {
    return NextResponse.json({ error: "Venue operator access denied." }, { status: 403 });
  }
  const venueSession = await loadOpenTriviaVenueSession(venue.id);
  if (!venueSession) return NextResponse.json({ error: "Start Venue Trivia first." }, { status: 409 });

  const category = body.category?.trim() || "bible";
  const difficultyFilter = body.difficultyFilter ?? "mixed";
  const pacingMode = body.pacingMode ?? "relaxed";
  const room = await createTriviaLiveSession(category, difficultyFilter, pacingMode, "individual", 2, body.topicIds ?? []);

  const { data: venuePlayers, error: playersError } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .select("id, name, trivia_session_id, trivia_player_id, removed_at, presence_expires_at")
    .eq("venue_session_id", venueSession.id)
    .is("removed_at", null)
    .gt("presence_expires_at", new Date().toISOString());
  if (playersError) throw playersError;

  for (const player of venuePlayers ?? []) {
    await seatVenuePlayerInTriviaSession(player, room.sessionId, room.roomCode);
  }

  const now = new Date().toISOString();
  const { error: attachError } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_sessions")
    .update({ current_trivia_session_id: room.sessionId, updated_at: now })
    .eq("id", venueSession.id);
  if (attachError) throw attachError;

  if ((venuePlayers ?? []).length > 0) {
    await startTriviaLiveSession(room.sessionId, room.hostToken);
  }

  return NextResponse.json({
    venueSessionId: venueSession.id,
    triviaSessionId: room.sessionId,
    roomCode: room.roomCode,
    started: (venuePlayers ?? []).length > 0,
    seatedPlayers: (venuePlayers ?? []).length,
  }, { headers: { "Cache-Control": "no-store" } });
}
