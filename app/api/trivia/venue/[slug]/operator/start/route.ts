import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { generateTriviaVenueToken, hashTriviaVenueToken, loadOpenTriviaVenueSession, loadTriviaVenue, safeTriviaVenueTokenMatch } from "@/app/games/trivia/venue/trivia-venue-server";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({})) as { operatorKey?: string };
  const venue = await loadTriviaVenue(slug);
  if (!venue?.is_active || !safeTriviaVenueTokenMatch(body.operatorKey ?? "", venue.operator_token_hash)) {
    return NextResponse.json({ error: "Venue operator access denied." }, { status: 403 });
  }

  const existing = await loadOpenTriviaVenueSession(venue.id);
  if (existing) {
    return NextResponse.json({
      venueSessionId: existing.id,
      status: existing.status,
      alreadyOpen: true,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const bootstrapPresenceToken = generateTriviaVenueToken();
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_sessions")
    .insert({
      venue_id: venue.id,
      status: "active",
      presence_token_hash: hashTriviaVenueToken(bootstrapPresenceToken),
      presence_token_rotated_at: now,
      started_at: now,
      updated_at: now,
    })
    .select("id, status")
    .single();
  if (error) throw error;
  return NextResponse.json({ venueSessionId: data.id, status: data.status, alreadyOpen: false }, { headers: { "Cache-Control": "no-store" } });
}
