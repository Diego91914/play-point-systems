import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { loadOpenTriviaVenueSession, loadTriviaVenue, loadVenueTriviaRuntime, safeTriviaVenueTokenMatch } from "@/app/games/trivia/venue/trivia-venue-server";

type Action = "pause" | "resume" | "skip-question" | "end-session" | "remove-player" | "hide-nickname";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { operatorKey?: string; action?: Action; playerId?: string };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.operatorKey ?? "", venue.operator_token_hash)) {
    return NextResponse.json({ error: "Venue operator access denied." }, { status: 403 });
  }

  const session = await loadOpenTriviaVenueSession(venue.id);
  if (!session) return NextResponse.json({ error: "No active venue session." }, { status: 404 });
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  if (body.action === "pause" || body.action === "resume") {
    const nextStatus = body.action === "pause" ? "paused" : "active";
    const { error } = await supabase.from("ppl_trivia_venue_sessions").update({ status: nextStatus, updated_at: now }).eq("id", session.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, status: nextStatus });
  }

  if (body.action === "end-session") {
    const { error } = await supabase.from("ppl_trivia_venue_sessions").update({ status: "ended", ended_at: now, updated_at: now }).eq("id", session.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, status: "ended" });
  }

  if (body.action === "skip-question") {
    if (!session.current_trivia_session_id) return NextResponse.json({ error: "No live trivia match to skip." }, { status: 409 });
    const runtime = await loadVenueTriviaRuntime(session.current_trivia_session_id);
    if (runtime.session.status !== "in-progress") return NextResponse.json({ error: "Trivia is not currently in progress." }, { status: 409 });
    if (runtime.session.phase === "question-open") {
      const { error: resolveError } = await supabase.rpc("ppl_trivia_resolve_session", { p_session_id: session.current_trivia_session_id });
      if (resolveError) throw resolveError;
    }
    const afterResolve = await loadVenueTriviaRuntime(session.current_trivia_session_id);
    if (["answer-reveal", "wager-open"].includes(afterResolve.session.phase)) {
      const { error: advanceError } = await supabase.rpc("ppl_trivia_advance_session", { p_session_id: session.current_trivia_session_id });
      if (advanceError) throw advanceError;
    }
    return NextResponse.json({ ok: true, action: "skip-question" });
  }

  if (body.action === "remove-player" || body.action === "hide-nickname") {
    if (!body.playerId) return NextResponse.json({ error: "Choose a player." }, { status: 400 });
    const { data: player, error: playerError } = await supabase
      .from("ppl_trivia_venue_players")
      .select("id, name, trivia_session_id, trivia_player_id")
      .eq("venue_session_id", session.id)
      .eq("id", body.playerId)
      .maybeSingle();
    if (playerError) throw playerError;
    if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    if (body.action === "remove-player") {
      const { error } = await supabase.from("ppl_trivia_venue_players").update({ removed_at: now, updated_at: now }).eq("id", player.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, playerId: player.id, removed: true });
    }

    const safeName = `Player ${player.id.slice(0, 4).toUpperCase()}`;
    const { error: renameError } = await supabase.from("ppl_trivia_venue_players").update({ name: safeName, updated_at: now }).eq("id", player.id);
    if (renameError) throw renameError;
    if (player.trivia_player_id && player.trivia_session_id) {
      await supabase.from("ppl_trivia_players").update({ name: safeName, updated_at: now }).eq("id", player.trivia_player_id).eq("session_id", player.trivia_session_id);
    }
    return NextResponse.json({ ok: true, playerId: player.id, name: safeName });
  }

  return NextResponse.json({ error: "Unknown venue control action." }, { status: 400 });
}
