import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { extendTriviaVenuePresence } from "@/app/games/trivia/venue/trivia-venue-presence";
import { moderateTriviaVenueNickname } from "@/app/games/trivia/venue/trivia-venue-name-moderation";
import { generateTriviaVenueToken, hashTriviaVenueToken, loadOpenTriviaVenueSession, loadTriviaVenue, safeTriviaVenueTokenMatch, seatVenuePlayerInTriviaSession } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { name?: string; presenceToken?: string };
  const moderation = moderateTriviaVenueNickname(body.name ?? "");
  if (!moderation.allowed) return NextResponse.json({ error: moderation.reason }, { status: 400 });
  const name = moderation.name;
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active) return NextResponse.json({ error: "Venue is unavailable." }, { status: 404 });
  const session = await loadOpenTriviaVenueSession(venue.id);
  if (!session || !safeTriviaVenueTokenMatch(body.presenceToken ?? "", session.presence_token_hash)) {
    return NextResponse.json({ error: "Scan the current venue QR code to join." }, { status: 403 });
  }
  const deviceToken = generateTriviaVenueToken();
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const presenceExpiresAt = new Date(extendTriviaVenuePresence(nowMs)).toISOString();
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .insert({ venue_session_id: session.id, name, device_token_hash: hashTriviaVenueToken(deviceToken), presence_expires_at: presenceExpiresAt, last_active_at: now, updated_at: now })
    .select("id, name, rolling_score, score_total, presence_expires_at, trivia_session_id, trivia_player_id")
    .single();
  if (error) {
    const duplicate = String(error.message ?? "").toLowerCase().includes("unique");
    return NextResponse.json({ error: duplicate ? "That player name is already in use here." : "Unable to join venue trivia." }, { status: duplicate ? 409 : 500 });
  }
  let triviaPlayerId: string | null = null;
  if (session.current_trivia_session_id) {
    const { data: liveSession, error: liveError } = await getSupabaseServerClient().from("ppl_trivia_sessions").select("id, room_code, status").eq("id", session.current_trivia_session_id).maybeSingle();
    if (liveError) throw liveError;
    if (liveSession) {
      triviaPlayerId = await seatVenuePlayerInTriviaSession(data, liveSession.id, liveSession.room_code);
      if (liveSession.status === "lobby") {
        const { error: startError } = await getSupabaseServerClient().rpc("ppl_trivia_start_session", { p_session_id: liveSession.id });
        if (startError) throw startError;
      }
    }
  }
  return NextResponse.json({ player: { ...data, trivia_player_id: triviaPlayerId ?? data.trivia_player_id }, deviceToken, venueSessionId: session.id, venue: { slug: venue.slug, displayName: venue.display_name } }, { headers: { "Cache-Control": "no-store" } });
}
