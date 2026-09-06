import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { canTriviaVenuePlayerAnswer, getTriviaVenuePresenceStatus } from "@/app/games/trivia/venue/trivia-venue-presence";
import { loadOpenTriviaVenueSession, loadTriviaVenue, loadVenuePlayerForDevice, loadVenueTriviaRuntime, seatVenuePlayerInTriviaSession } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as {
    venueSessionId?: string;
    playerId?: string;
    deviceToken?: string;
    action?: "answer" | "wager";
    response?: string;
    wager?: number;
  };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active) return NextResponse.json({ error: "Venue is unavailable." }, { status: 404 });
  const venueSession = await loadOpenTriviaVenueSession(venue.id);
  if (!venueSession || venueSession.id !== body.venueSessionId) return NextResponse.json({ error: "Venue session changed. Scan the TV again." }, { status: 409 });
  const venuePlayer = await loadVenuePlayerForDevice(venueSession.id, body.playerId ?? "", body.deviceToken ?? "");
  if (!venuePlayer) return NextResponse.json({ error: "Player access denied." }, { status: 403 });

  const presenceStatus = getTriviaVenuePresenceStatus({
    nowMs: Date.now(),
    presenceExpiresAtMs: Date.parse(venuePlayer.presence_expires_at),
    consecutiveQuestionsMissed: venuePlayer.consecutive_questions_missed,
    removed: Boolean(venuePlayer.removed_at),
  });

  if (!venueSession.current_trivia_session_id) {
    return NextResponse.json({
      venue: { slug: venue.slug, displayName: venue.display_name },
      presenceStatus,
      waitingForMatch: true,
      player: { id: venuePlayer.id, name: venuePlayer.name, rollingScore: venuePlayer.rolling_score, scoreTotal: venuePlayer.score_total },
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: liveSession, error: liveError } = await getSupabaseServerClient()
    .from("ppl_trivia_sessions")
    .select("id, room_code, status")
    .eq("id", venueSession.current_trivia_session_id)
    .maybeSingle();
  if (liveError) throw liveError;
  if (!liveSession) return NextResponse.json({ error: "Current trivia match is unavailable." }, { status: 409 });

  const livePlayerId = await seatVenuePlayerInTriviaSession(venuePlayer, liveSession.id, liveSession.room_code);

  if (body.action) {
    if (!canTriviaVenuePlayerAnswer(presenceStatus)) {
      return NextResponse.json({ error: "Scan the venue TV again to keep playing." }, { status: 403 });
    }
    if (body.action === "answer") {
      if (!["A", "B", "C", "D", "skip"].includes(body.response ?? "")) {
        return NextResponse.json({ error: "Choose an answer." }, { status: 400 });
      }
      const { error } = await getSupabaseServerClient().rpc("ppl_trivia_submit_answer", {
        p_session_id: liveSession.id,
        p_player_id: livePlayerId,
        p_response: body.response,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      const now = new Date().toISOString();
      await getSupabaseServerClient().from("ppl_trivia_venue_players").update({ consecutive_questions_missed: 0, last_active_at: now, updated_at: now }).eq("id", venuePlayer.id);
    }
    if (body.action === "wager") {
      const wager = Number(body.wager);
      if (!Number.isInteger(wager) || wager < 0) return NextResponse.json({ error: "Enter a valid wager." }, { status: 400 });
      const { error } = await getSupabaseServerClient().rpc("ppl_trivia_submit_wager", {
        p_session_id: liveSession.id,
        p_player_id: livePlayerId,
        p_wager: wager,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const runtime = await loadVenueTriviaRuntime(liveSession.id);
  const livePlayer = (runtime.bundle.players ?? []).find((player: any) => player.id === livePlayerId) ?? null;
  const answer = (runtime.bundle.answers ?? []).find((row: any) => row.player_id === livePlayerId) ?? null;
  const wager = (runtime.bundle.wagers ?? []).find((row: any) => row.player_id === livePlayerId) ?? null;
  const resolutionRow = runtime.session.resolution?.rows?.find((row: any) => row.playerId === livePlayerId) ?? null;

  return NextResponse.json({
    venue: { slug: venue.slug, displayName: venue.display_name },
    presenceStatus,
    waitingForMatch: false,
    player: {
      id: venuePlayer.id,
      name: venuePlayer.name,
      rollingScore: livePlayer?.score ?? venuePlayer.rolling_score,
      scoreTotal: venuePlayer.score_total,
      currentStreak: livePlayer?.current_streak ?? 0,
    },
    game: {
      status: runtime.session.status,
      phase: runtime.session.phase,
      cardIndex: runtime.session.card_index,
      currentCard: runtime.currentCard,
      questionOpenedAt: runtime.session.opened_at,
      questionTimerSeconds: runtime.questionTimerSeconds,
      answerState: { hasSubmitted: Boolean(answer), response: answer?.response ?? null },
      wagerState: { hasSubmitted: Boolean(wager), wager: wager?.wager ?? null, maxWager: livePlayer?.score ?? 0 },
      resolution: runtime.session.resolution ? {
        correctSlot: runtime.session.resolution.correctSlot,
        correctText: runtime.session.resolution.correctText,
        explanation: runtime.session.resolution.card?.explanation ?? "",
        outcome: resolutionRow?.outcome ?? null,
        delta: resolutionRow?.delta ?? null,
      } : null,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
