import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { extendVenuePlayerPresence, loadOpenTriviaVenueSession, loadTriviaVenue, safeTriviaVenueTokenMatch } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { playerId?: string; deviceToken?: string; presenceToken?: string };
  if (!body.playerId || !body.deviceToken || !body.presenceToken) {
    return NextResponse.json({ error: "Presence refresh information is incomplete." }, { status: 400 });
  }
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active) return NextResponse.json({ error: "Venue is unavailable." }, { status: 404 });
  const session = await loadOpenTriviaVenueSession(venue.id);
  if (!session || !safeTriviaVenueTokenMatch(body.presenceToken, session.presence_token_hash)) {
    return NextResponse.json({ error: "Scan the current venue QR code to keep playing." }, { status: 403 });
  }
  const { data: player, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .select("id, venue_session_id, device_token_hash, removed_at")
    .eq("id", body.playerId)
    .eq("venue_session_id", session.id)
    .maybeSingle();
  if (error) throw error;
  if (!player || player.removed_at || !safeTriviaVenueTokenMatch(body.deviceToken, player.device_token_hash)) {
    return NextResponse.json({ error: "Player access is no longer valid." }, { status: 403 });
  }
  const presenceExpiresAt = await extendVenuePlayerPresence(player.id);
  return NextResponse.json({ ok: true, presenceExpiresAt }, { headers: { "Cache-Control": "no-store" } });
}
