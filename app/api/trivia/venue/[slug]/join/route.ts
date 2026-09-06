import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { extendTriviaVenuePresence } from "@/app/games/trivia/venue/trivia-venue-presence";
import { generateTriviaVenueToken, hashTriviaVenueToken, loadOpenTriviaVenueSession, loadTriviaVenue, safeTriviaVenueTokenMatch } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { name?: string; presenceToken?: string };
  const name = body.name?.trim() ?? "";
  if (name.length < 1 || name.length > 40) return NextResponse.json({ error: "Enter a player name." }, { status: 400 });
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
    .insert({
      venue_session_id: session.id,
      name,
      device_token_hash: hashTriviaVenueToken(deviceToken),
      presence_expires_at: presenceExpiresAt,
      last_active_at: now,
      updated_at: now,
    })
    .select("id, name, rolling_score, score_total, presence_expires_at")
    .single();
  if (error) {
    const duplicate = String(error.message ?? "").toLowerCase().includes("unique");
    return NextResponse.json({ error: duplicate ? "That player name is already in use here." : "Unable to join venue trivia." }, { status: duplicate ? 409 : 500 });
  }
  return NextResponse.json({ player: data, deviceToken, venueSessionId: session.id, venue: { slug: venue.slug, displayName: venue.display_name } }, { headers: { "Cache-Control": "no-store" } });
}
