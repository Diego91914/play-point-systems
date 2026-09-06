import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { loadOpenTriviaVenueSession, loadTriviaVenue, loadVenueTriviaRuntime, safeTriviaVenueTokenMatch, syncVenueScoresFromTrivia } from "@/app/games/trivia/venue/trivia-venue-server";

const REVEAL_HOLD_MS = 7000;
const WAGER_HOLD_MS = 45000;

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { displayKey?: string };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.displayKey ?? "", venue.display_token_hash)) {
    return NextResponse.json({ error: "Venue display access denied." }, { status: 403 });
  }
  const venueSession = await loadOpenTriviaVenueSession(venue.id);
  if (!venueSession?.current_trivia_session_id) {
    return NextResponse.json({ changed: false, reason: "no-match" });
  }

  const sessionId = venueSession.current_trivia_session_id;
  const supabase = getSupabaseServerClient();
  const runtime = await loadVenueTriviaRuntime(sessionId);
  const { data: sessionRow, error: rowError } = await supabase
    .from("ppl_trivia_sessions")
    .select("status, phase, opened_at, updated_at")
    .eq("id", sessionId)
    .single();
  if (rowError) throw rowError;

  if (sessionRow.status === "lobby" && (runtime.bundle.players ?? []).length > 0) {
    const { error } = await supabase.rpc("ppl_trivia_start_session", { p_session_id: sessionId });
    if (error) throw error;
    return NextResponse.json({ changed: true, action: "started" });
  }

  if (sessionRow.phase === "question-open" && sessionRow.opened_at && runtime.questionTimerSeconds) {
    const elapsed = Date.now() - Date.parse(sessionRow.opened_at);
    if (elapsed >= runtime.questionTimerSeconds * 1000 + 500) {
      const { error } = await supabase.rpc("ppl_trivia_resolve_session", { p_session_id: sessionId });
      if (error) throw error;
      return NextResponse.json({ changed: true, action: "revealed" });
    }
  }

  if (sessionRow.phase === "answer-reveal") {
    const elapsed = Date.now() - Date.parse(sessionRow.updated_at);
    if (elapsed >= REVEAL_HOLD_MS) {
      await syncVenueScoresFromTrivia(venueSession.id, sessionId);
      const { error } = await supabase.rpc("ppl_trivia_advance_session", { p_session_id: sessionId });
      if (error) throw error;
      return NextResponse.json({ changed: true, action: "advanced" });
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
      return NextResponse.json({ changed: true, action: "final-opened" });
    }
  }

  if (sessionRow.status === "completed") {
    await syncVenueScoresFromTrivia(venueSession.id, sessionId);
  }

  return NextResponse.json({ changed: false, phase: sessionRow.phase, status: sessionRow.status });
}
