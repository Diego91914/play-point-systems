import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { extendTriviaVenuePresence, getTriviaVenuePresenceStatus, shouldShowTriviaVenuePlayerOnLeaderboard } from "./trivia-venue-presence";

export function hashTriviaVenueToken(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function generateTriviaVenueToken() {
  return randomBytes(24).toString("base64url");
}

export function safeTriviaVenueTokenMatch(value: string, expectedHash: string | null | undefined) {
  if (!value || !expectedHash) return false;
  const actual = Buffer.from(hashTriviaVenueToken(value), "utf8");
  const expected = Buffer.from(expectedHash, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function loadTriviaVenue(slug: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venues")
    .select("id, slug, display_name, is_active, operator_token_hash, display_token_hash")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadOpenTriviaVenueSession(venueId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_sessions")
    .select("id, venue_id, status, current_trivia_session_id, presence_token_hash, presence_token_rotated_at, started_at")
    .eq("venue_id", venueId)
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function rotateTriviaVenuePresenceToken(venueSessionId: string) {
  const token = generateTriviaVenueToken();
  const now = new Date().toISOString();
  const { error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_sessions")
    .update({ presence_token_hash: hashTriviaVenueToken(token), presence_token_rotated_at: now, updated_at: now })
    .eq("id", venueSessionId);
  if (error) throw error;
  return token;
}

export async function getTriviaVenueLeaderboard(venueSessionId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .select("id, name, rolling_score, score_total, consecutive_questions_missed, presence_expires_at, removed_at, last_active_at")
    .eq("venue_session_id", venueSessionId)
    .order("rolling_score", { ascending: false })
    .limit(20);
  if (error) throw error;
  const nowMs = Date.now();
  return (data ?? []).filter((player) => {
    const status = getTriviaVenuePresenceStatus({
      nowMs,
      presenceExpiresAtMs: Date.parse(player.presence_expires_at),
      consecutiveQuestionsMissed: player.consecutive_questions_missed,
      removed: Boolean(player.removed_at),
    });
    return shouldShowTriviaVenuePlayerOnLeaderboard(status);
  }).map((player, index) => ({ id: player.id, name: player.name, rollingScore: player.rolling_score, scoreTotal: player.score_total, rank: index + 1 }));
}

export async function extendVenuePlayerPresence(playerId: string) {
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const presenceExpiresAt = new Date(extendTriviaVenuePresence(nowMs)).toISOString();
  const { error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .update({ presence_expires_at: presenceExpiresAt, consecutive_questions_missed: 0, last_active_at: now, updated_at: now })
    .eq("id", playerId);
  if (error) throw error;
  return presenceExpiresAt;
}
