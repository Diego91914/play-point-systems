import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { getTriviaTimerSeconds } from "../play/trivia-live-timing";
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

export async function loadVenuePlayerForDevice(venueSessionId: string, playerId: string, deviceToken: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .select("id, venue_session_id, name, device_token_hash, rolling_score, score_total, consecutive_questions_missed, presence_expires_at, removed_at, trivia_session_id, trivia_player_id")
    .eq("venue_session_id", venueSessionId)
    .eq("id", playerId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !safeTriviaVenueTokenMatch(deviceToken, data.device_token_hash)) return null;
  return data;
}

export async function seatVenuePlayerInTriviaSession(
  venuePlayer: { id: string; name: string; trivia_session_id?: string | null; trivia_player_id?: string | null },
  triviaSessionId: string,
  _roomCode?: string,
) {
  if (venuePlayer.trivia_session_id === triviaSessionId && venuePlayer.trivia_player_id) {
    return venuePlayer.trivia_player_id;
  }

  // Venue Mode intentionally permits customers to join a match already in progress.
  // The normal room join RPC is lobby-only, so this trusted server path inserts the
  // mirrored live player directly after Venue presence/device authorization succeeds.
  const triviaPlayerId = randomUUID();
  const throwawayCredential = generateTriviaVenueToken();
  const { error: insertError } = await getSupabaseServerClient()
    .from("ppl_trivia_players")
    .insert({
      id: triviaPlayerId,
      session_id: triviaSessionId,
      name: venuePlayer.name,
      token_hash: hashTriviaVenueToken(throwawayCredential),
    });
  if (insertError) throw insertError;

  const now = new Date().toISOString();
  const { error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .update({ trivia_session_id: triviaSessionId, trivia_player_id: triviaPlayerId, rolling_score: 0, updated_at: now })
    .eq("id", venuePlayer.id);
  if (error) throw error;
  return triviaPlayerId;
}

export async function loadVenueTriviaRuntime(triviaSessionId: string) {
  const supabase = getSupabaseServerClient();
  await supabase.rpc("ppl_trivia_sync_question_phase", { p_session_id: triviaSessionId });
  const { data, error } = await supabase.rpc("ppl_trivia_load_session", { p_session_id: triviaSessionId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The venue trivia match is unavailable.");
  const bundle = data as any;
  const session = bundle.session;
  const card = session.card_index < session.deck.cards.length ? session.deck.cards[session.card_index] : null;
  const publicCard = card ? {
    prompt: card.prompt,
    choices: card.choices.map((choice: any) => ({ slot: choice.slot, text: choice.text })),
    roundLabel: card.roundLabel,
    questionNumberInRound: card.questionNumberInRound,
    totalQuestionsInRound: card.totalQuestionsInRound,
    totalQuestions: card.totalQuestions,
    scoring: card.scoring,
  } : null;
  return {
    bundle,
    session,
    currentCard: ["question-open", "answer-reveal"].includes(session.phase) ? publicCard : null,
    questionTimerSeconds: card ? getTriviaTimerSeconds(session.pacing_mode) : null,
  };
}

export async function syncVenueScoresFromTrivia(venueSessionId: string, triviaSessionId: string) {
  const { bundle } = await loadVenueTriviaRuntime(triviaSessionId);
  const answers = new Set((bundle.answers ?? []).map((answer: any) => answer.player_id));
  const playerById = new Map((bundle.players ?? []).map((player: any) => [player.id, player]));
  const { data: venuePlayers, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_players")
    .select("id, trivia_player_id, rolling_score, score_total, consecutive_questions_missed, removed_at")
    .eq("venue_session_id", venueSessionId)
    .eq("trivia_session_id", triviaSessionId);
  if (error) throw error;
  const now = new Date().toISOString();
  await Promise.all((venuePlayers ?? []).map(async (venuePlayer) => {
    if (!venuePlayer.trivia_player_id || venuePlayer.removed_at) return;
    const livePlayer: any = playerById.get(venuePlayer.trivia_player_id);
    if (!livePlayer) return;
    const answered = answers.has(venuePlayer.trivia_player_id);
    const nextMissed = answered ? 0 : (venuePlayer.consecutive_questions_missed ?? 0) + 1;
    const liveScore = Math.max(0, livePlayer.score ?? 0);
    const previousRolling = Math.max(0, venuePlayer.rolling_score ?? 0);
    const scoreGain = Math.max(0, liveScore - previousRolling);
    const update: Record<string, unknown> = {
      rolling_score: liveScore,
      score_total: Math.max(0, venuePlayer.score_total ?? 0) + scoreGain,
      correct_count: Math.max(0, livePlayer.correct_count ?? 0),
      answered_count: Math.max(0, (livePlayer.correct_count ?? 0) + (livePlayer.wrong_count ?? 0) + (livePlayer.skipped_count ?? 0)),
      consecutive_questions_missed: nextMissed,
      updated_at: now,
    };
    if (answered) update.last_active_at = now;
    const { error: updateError } = await getSupabaseServerClient()
      .from("ppl_trivia_venue_players")
      .update(update)
      .eq("id", venuePlayer.id);
    if (updateError) throw updateError;
  }));
}
