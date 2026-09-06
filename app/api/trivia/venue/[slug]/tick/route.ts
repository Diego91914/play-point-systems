import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { createTriviaLiveSession, startTriviaLiveSession } from "@/app/games/trivia/play/trivia-live-service";
import { finalizeTriviaVenueChampionshipIfDue, loadOpenTriviaVenueSession, loadTriviaVenue, loadVenueTriviaRuntime, safeTriviaVenueTokenMatch, seatVenuePlayerInTriviaSession, syncVenueScoresFromTrivia } from "@/app/games/trivia/venue/trivia-venue-server";

const REVEAL_HOLD_MS = 7000;
const WAGER_HOLD_MS = 45000;
const COMPLETED_HOLD_MS = 12000;

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { displayKey?: string };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.displayKey ?? "", venue.display_token_hash)) {
    return NextResponse.json({ error: "Venue display access denied." }, { status: 403 });
  }
  const venueSession = await loadOpenTriviaVenueSession(venue.id);
  if (!venueSession) {
    return NextResponse.json({ changed: false, reason: "no-venue-session" });
  }

  const championship = await finalizeTriviaVenueChampionshipIfDue(venueSession);
  if (!venueSession.current_trivia_session_id) {
    return NextResponse.json({ changed: Boolean(championship), action: championship ? "hourly-champion" : undefined, reason: "no-match" });
  }

  const sessionId = venueSession.current_trivia_session_id;
  const supabase = getSupabaseServerClient();
  const runtime = await loadVenueTriviaRuntime(sessionId);
  const { data: sessionRow, error: rowError } = await supabase
    .from("ppl_trivia_sessions")
    .select("status, phase, opened_at, updated_at, category, difficulty_filter, pacing_mode")
    .eq("id", sessionId)
    .single();
  if (rowError) throw rowError;

  if (sessionRow.status === "lobby" && (runtime.bundle.players ?? []).length > 0) {
    const { error } = await supabase.rpc("ppl_trivia_start_session", { p_session_id: sessionId });
    if (error) throw error;
    return NextResponse.json({ changed: true, action: championship ? "hourly-champion-and-started" : "started" });
  }

  if (sessionRow.phase === "question-open" && sessionRow.opened_at && runtime.questionTimerSeconds) {
    const elapsed = Date.now() - Date.parse(sessionRow.opened_at);
    if (elapsed >= runtime.questionTimerSeconds * 1000 + 500) {
      const { error } = await supabase.rpc("ppl_trivia_resolve_session", { p_session_id: sessionId });
      if (error) throw error;
      return NextResponse.json({ changed: true, action: championship ? "hourly-champion-and-revealed" : "revealed" });
    }
  }

  if (sessionRow.phase === "answer-reveal") {
    const elapsed = Date.now() - Date.parse(sessionRow.updated_at);
    if (elapsed >= REVEAL_HOLD_MS) {
      await syncVenueScoresFromTrivia(venueSession.id, sessionId);
      const { error } = await supabase.rpc("ppl_trivia_advance_session", { p_session_id: sessionId });
      if (error) throw error;
      return NextResponse.json({ changed: true, action: championship ? "hourly-champion-and-advanced" : "advanced" });
    }
  }

  if (sessionRow.phase === "wager-open") {
    const wagers = runtime.bundle.wagers ?? [];
    const players = runtime.bundle.players ?? [];
    const elapsed = Date.now() - Date.parse(sessionRow.updated_at);
    if (wagers.length >= players.length || elapsed >= WAGER_HOLD_MS) {
      if (elapsed >= WAGER_HOLD_MS && wagers.length < players.length) {
        const wagered = new Set(wagers.map((wager: any) => wager.player_id));
        for (const player of players) {
          if (wagered.has(player.id)) continue;
          const { error } = await supabase.rpc("ppl_trivia_submit_wager", {
            p_session_id: sessionId,
            p_player_id: player.id,
            p_wager: 0,
          });
          if (error) throw error;
        }
      }
      const { error } = await supabase.rpc("ppl_trivia_advance_session", { p_session_id: sessionId });
      if (error) throw error;
      return NextResponse.json({ changed: true, action: championship ? "hourly-champion-and-final-opened" : "final-opened" });
    }
  }

  if (sessionRow.status === "completed") {
    await syncVenueScoresFromTrivia(venueSession.id, sessionId);
    const elapsed = Date.now() - Date.parse(sessionRow.updated_at);
    if (elapsed >= COMPLETED_HOLD_MS) {
      const { data: venuePlayers, error: playersError } = await supabase
        .from("ppl_trivia_venue_players")
        .select("id, name, trivia_session_id, trivia_player_id")
        .eq("venue_session_id", venueSession.id)
        .is("removed_at", null)
        .gt("presence_expires_at", new Date().toISOString());
      if (playersError) throw playersError;

      const next = await createTriviaLiveSession(
        sessionRow.category,
        sessionRow.difficulty_filter,
        sessionRow.pacing_mode,
        "individual",
        2,
        [],
      );

      for (const player of venuePlayers ?? []) {
        await seatVenuePlayerInTriviaSession(player, next.sessionId, next.roomCode);
      }

      const now = new Date().toISOString();
      const { error: attachError } = await supabase
        .from("ppl_trivia_venue_sessions")
        .update({ current_trivia_session_id: next.sessionId, updated_at: now })
        .eq("id", venueSession.id)
        .eq("current_trivia_session_id", sessionId);
      if (attachError) throw attachError;

      if ((venuePlayers ?? []).length > 0) {
        await startTriviaLiveSession(next.sessionId, next.hostToken);
      }
      return NextResponse.json({ changed: true, action: championship ? "hourly-champion-and-next-match" : "next-match", triviaSessionId: next.sessionId, seatedPlayers: (venuePlayers ?? []).length });
    }
  }

  return NextResponse.json({ changed: Boolean(championship), action: championship ? "hourly-champion" : undefined, phase: sessionRow.phase, status: sessionRow.status });
}
