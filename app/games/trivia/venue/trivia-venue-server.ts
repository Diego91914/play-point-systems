import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { getTriviaTimerSeconds } from "../play/trivia-live-timing";
import { extendTriviaVenuePresence, getTriviaVenuePresenceStatus, shouldShowTriviaVenuePlayerOnLeaderboard } from "./trivia-venue-presence";

export const TRIVIA_VENUE_CHAMPIONSHIP_WINDOW_MS = 60 * 60 * 1000;

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
    .select("id, venue_id, status, current_trivia_session_id, presence_token_hash, presence_token_rotated_at, started_at, championship_started_at")
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
    .select("id, name, rolling_score, score_total, championship_score, consecutive_questions_missed, presence_expires_at, removed_at, last_active_at")
    .eq("venue_session_id", venueSessionId)
    .order("championship_score", { ascending: false })
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
  }).map((player, index) => ({
    id: player.id,
    name: player.name,
    rollingScore: player.rolling_score,
    scoreTotal: player.score_total,
    championshipScore: player.championship_score,
    rank: index + 1,
  }));
}

export async function getLatestTriviaVenueChampionship(venueSessionId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_venue_championships")
    .select("id, window_started_at, window_ended_at, winner_player_id, standings, created_at")
    .eq("venue_session_id", venueSessionId)
    .order("window_ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function finalizeTriviaVenueChampionshipIfDue(venueSession: { id: string; championship_started_at: string }) {
  const windowStartedAtMs = Date.parse(venueSession.championship_started_at);
  if (!Number.isFinite(windowStartedAtMs) || Date.now() < windowStartedAtMs + TRIVIA_VENUE_CHAMPIONSHIP_WINDOW_MS) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data: players, error: playerError } = await supabase
    .from("ppl_trivia_venue_players")
    .select("id, name, championship_score, presence_expires_at, consecutive_questions_missed, removed_at")
    .eq("venue_session_id", venueSession.id)
    .order("championship_score", { ascending: false });
  if (playerError) throw playerError;

  const nowMs = Date.now();
  const standings = (players ?? [])
    .filter((player) => {
      const status = getTriviaVenuePresenceStatus({
        nowMs,
        presenceExpiresAtMs: Date.parse(player.presence_expires_at),
        consecutiveQuestionsMissed: player.consecutive_questions_missed,
        removed: Boolean(player.removed_at),
      });
      return status !== "removed";
    })
    .map((player, index) => ({ rank: index + 1, playerId: player.id, name: player.name, score: player.championship_score }));

  const windowEndedAt = new Date(nowMs).toISOString();
  const winnerPlayerId = standings[0]?.playerId ?? null;
  const { data: championship, error: insertError } = await supabase
    .from("ppl_trivia_venue_championships")
    .insert({
      venue_session_id: venueSession.id,
      window_started_at: venueSession.championship_started_at,
      window_ended_at: windowEndedAt,
      winner_player_id: winnerPlayerId,
      standings,
    })
    .select("id, window_started_at, window_ended_at, winner_player_id, standings, created_at")
    .single();
  if (insertError) throw insertError;

  const { error: resetPlayersError } = await supabase
    .from("ppl_trivia_venue_players")
    .update({ championship_score: 0, updated_at: windowEndedAt })
    .eq("venue_session_id", venueSession.id);
  if (resetPlayersError) throw resetPlayersError;

  const { error: resetSessionError } = await supabase
    .from("ppl_trivia_venue_sessions")
    .update({ championship_started_at: windowEndedAt, updated_at: windowEndedAt })
    .eq("id", venueSession.id)
    .eq("championship_started_at", venueSession.championship_started_at);
  if (resetSessionError) throw resetSessionError;

  return championship;
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
    .select("id, venue_session_id, name, device_token_hash, rolling_score, score_total, championship_score, consecutive_questions_missed, presence_expires_at, removed_at, trivia_session_id, trivia_player_id")
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
    .update({ trivia_session_id: triviaSessionId, trivia_player_id: triviaPlayerId, rolling_score: 0, current_match_score: 0, updated_at: now })
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
    .select("id, trivia_player_id, rolling_score, current_match_score, score_total, championship_score, consecutive_questions_missed, removed_at")
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
    const previousMatchScore = Math.max(0, venuePlayer.current_match_score ?? 0);
    const scoreGain = Math.max(0, liveScore - previousMatchScore);
    const update: Record<string, unknown> = {
      rolling_score: liveScore,
      current_match_score: liveScore,
      score_total: Math.max(0, venuePlayer.score_total ?? 0) + scoreGain,
      championship_score: Math.max(0, venuePlayer.championship_score ?? 0) + scoreGain,
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
