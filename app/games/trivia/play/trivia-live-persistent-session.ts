import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { buildServerRuntimeDeck } from "./trivia-published-catalog";
import { getTriviaTimerSeconds, type TriviaPacingMode } from "./trivia-live-timing";
import {
  TriviaLiveAuthorizationError,
  type TriviaLiveHostSnapshot,
  type TriviaLivePlayer,
  type TriviaLivePlayerSnapshot,
  type TriviaLiveResolution,
  type TriviaLiveSessionPhase,
  type TriviaLiveSessionStatus,
} from "./trivia-live-session";
import type {
  RuntimeDeck,
  RuntimeDeckCard,
  RuntimeDifficultyFilter,
  RuntimePublicDeckCard,
  RuntimeResponse,
  TriviaGameMode,
  TriviaTeamId,
} from "./trivia-runtime-types";
import { buildTriviaTeamLeaderboard } from "./trivia-team-utils";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SESSION_LIFETIME_MS = 6 * 60 * 60 * 1000;
const RECENT_QUESTION_HISTORY_LIMIT = 48;

type PersistedSession = {
  id: string;
  room_code: string;
  category: string;
  difficulty_filter: RuntimeDifficultyFilter;
  pacing_mode: TriviaPacingMode;
  game_mode: TriviaGameMode;
  team_count: number;
  random_seed: string;
  deck: RuntimeDeck;
  host_token_hash: string;
  status: TriviaLiveSessionStatus;
  phase: TriviaLiveSessionPhase;
  card_index: number;
  opened_at: string | null;
  resolution: TriviaLiveResolution | null;
};

type PersistedPlayer = {
  id: string;
  session_id: string;
  name: string;
  team_id: TriviaTeamId | null;
  token_hash: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  current_streak: number;
  best_streak: number;
};

type PersistedAnswer = {
  player_id: string;
  response: RuntimeResponse;
  response_text: string;
};

type PersistedWager = {
  player_id: string;
  wager: number;
};

type PersistedSessionBundle = {
  session: PersistedSession;
  players: PersistedPlayer[];
  answers: PersistedAnswer[];
  wagers: PersistedWager[];
};

function createAuthToken() {
  return randomBytes(32).toString("base64url");
}

function hashAuthToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function tokenMatches(token: string | null, expectedHash: string) {
  if (!token) {
    return false;
  }

  const received = Buffer.from(hashAuthToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function createRoomCode() {
  return [...randomBytes(6)]
    .map((value) => ROOM_CODE_ALPHABET[value & 31])
    .join("");
}

function toPublicPlayer(player: PersistedPlayer): TriviaLivePlayer {
  return {
    id: player.id,
    name: player.name,
    teamId: player.team_id,
    score: player.score,
    correctCount: player.correct_count,
    wrongCount: player.wrong_count,
    skippedCount: player.skipped_count,
    currentStreak: player.current_streak,
    bestStreak: player.best_streak,
  };
}

function getLeaderboard(players: PersistedPlayer[]) {
  return players.map(toPublicPlayer).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.name.localeCompare(right.name);
  });
}

function toPublicCard(card: RuntimeDeckCard | null): RuntimePublicDeckCard | null {
  if (!card) {
    return null;
  }

  return {
    category: card.category,
    difficulty: card.difficulty,
    prompt: card.prompt,
    choices: card.choices.map(({ slot, text }) => ({ slot, text })),
    roundId: card.roundId,
    roundLabel: card.roundLabel,
    roundIntro: card.roundIntro,
    roundIndex: card.roundIndex,
    questionNumberInRound: card.questionNumberInRound,
    totalQuestionsInRound: card.totalQuestionsInRound,
    totalRounds: card.totalRounds,
    totalQuestions: card.totalQuestions,
    scoring: card.scoring,
  };
}

function getCurrentCard(session: PersistedSession) {
  return session.card_index >= session.deck.cards.length
    ? null
    : session.deck.cards[session.card_index] ?? null;
}

async function loadSession(sessionId: string): Promise<PersistedSessionBundle> {
  const { error: syncError } = await getSupabaseServerClient().rpc("ppl_trivia_sync_question_phase", {
    p_session_id: sessionId,
  });

  if (syncError) {
    throw new Error(syncError.message);
  }

  const { data, error } = await getSupabaseServerClient().rpc("ppl_trivia_load_session", {
    p_session_id: sessionId,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("That trivia room no longer exists.");
  }

  return data as PersistedSessionBundle;
}

function requireHost(bundle: PersistedSessionBundle, hostToken: string | null) {
  if (!tokenMatches(hostToken, bundle.session.host_token_hash)) {
    throw new TriviaLiveAuthorizationError("A valid host token is required.");
  }
}

function requirePlayer(bundle: PersistedSessionBundle, playerId: string, playerToken: string | null) {
  const player = bundle.players.find((candidate) => candidate.id === playerId);

  if (!player || !tokenMatches(playerToken, player.token_hash)) {
    throw new TriviaLiveAuthorizationError("A valid player token is required.");
  }

  return player;
}

async function callMutation(name: string, args: Record<string, unknown>) {
  const { error } = await getSupabaseServerClient().rpc(name, args);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createPersistentTriviaLiveSession(
  category: string,
  difficultyFilter: RuntimeDifficultyFilter,
  pacingMode: TriviaPacingMode,
  gameMode: TriviaGameMode,
  teamCount: number,
  topicIds: readonly string[] = [],
): Promise<{ sessionId: string; roomCode: string; hostToken: string }> {
  const supabase = getSupabaseServerClient();
  const { data: recentRows, error: recentError } = await supabase
    .from("ppl_trivia_question_history")
    .select("source_id")
    .eq("category", category)
    .order("played_at", { ascending: false })
    .limit(RECENT_QUESTION_HISTORY_LIMIT);

  if (recentError) {
    throw new Error(`Unable to load recent trivia history: ${recentError.message}`);
  }

  const randomSeed = randomBytes(32).toString("hex");
  const deck = await buildServerRuntimeDeck(category, difficultyFilter, {
    seed: randomSeed,
    excludedSourceIds: [...new Set((recentRows ?? []).map((row) => row.source_id as string))],
    topicIds,
  });
  const sessionId = randomUUID();
  const hostToken = createAuthToken();
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomCode = createRoomCode();
    const { error } = await supabase.rpc("ppl_trivia_create_session_with_options", {
      p_session_id: sessionId,
      p_room_code: roomCode,
      p_category: category,
      p_difficulty_filter: difficultyFilter,
      p_pacing_mode: pacingMode,
      p_game_mode: gameMode,
      p_team_count: teamCount,
      p_random_seed: randomSeed,
      p_deck: deck,
      p_host_token_hash: hashAuthToken(hostToken),
      p_expires_at: expiresAt,
    });

    if (!error) {
      return { sessionId, roomCode, hostToken };
    }
    if (error.code !== "23505") {
      throw new Error(error.message);
    }
  }

  throw new Error("Unable to generate a unique trivia room code.");
}

export async function joinPersistentTriviaLiveSession(roomCode: string, playerName: string) {
  const playerToken = createAuthToken();
  const playerId = randomUUID();
  const { data, error } = await getSupabaseServerClient().rpc("ppl_trivia_join_room", {
    p_room_code: roomCode,
    p_player_id: playerId,
    p_player_name: playerName,
    p_token_hash: hashAuthToken(playerToken),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { sessionId: data as string, playerId, playerToken };
}

export async function startPersistentTriviaLiveSession(sessionId: string, hostToken: string | null) {
  requireHost(await loadSession(sessionId), hostToken);
  await callMutation("ppl_trivia_start_session", { p_session_id: sessionId });
}

export async function submitPersistentTriviaLiveAnswer(
  sessionId: string,
  playerId: string,
  response: RuntimeResponse,
  playerToken: string | null,
) {
  requirePlayer(await loadSession(sessionId), playerId, playerToken);
  await callMutation("ppl_trivia_submit_answer", {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_response: response,
  });
}

export async function submitPersistentTriviaLiveWager(
  sessionId: string,
  playerId: string,
  wager: number,
  playerToken: string | null,
) {
  requirePlayer(await loadSession(sessionId), playerId, playerToken);
  await callMutation("ppl_trivia_submit_wager", {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_wager: wager,
  });
}

export async function resolvePersistentTriviaLiveQuestion(sessionId: string, hostToken: string | null) {
  requireHost(await loadSession(sessionId), hostToken);
  await callMutation("ppl_trivia_resolve_session", { p_session_id: sessionId });
}

export async function advancePersistentTriviaLiveQuestion(sessionId: string, hostToken: string | null) {
  requireHost(await loadSession(sessionId), hostToken);
  await callMutation("ppl_trivia_advance_session", { p_session_id: sessionId });
}

export async function buildPersistentTriviaLiveHostSnapshot(
  sessionId: string,
  origin: string,
  hostToken: string | null,
): Promise<TriviaLiveHostSnapshot> {
  const bundle = await loadSession(sessionId);
  requireHost(bundle, hostToken);
  const { session, players, answers, wagers } = bundle;
  const storedCard = getCurrentCard(session);
  const currentCard = ["question-open", "answer-reveal"].includes(session.phase) ? storedCard : null;

  return {
    sessionId: session.id,
    roomCode: session.room_code,
    joinUrl: `${origin}/games/trivia/join?code=${session.room_code}`,
    qrUrl: `${origin}/api/trivia/sessions/${session.id}/join-qr`,
    status: session.status,
    phase: session.phase,
    serverTimeMs: Date.now(),
    cardIndex: session.card_index,
    deck: session.deck,
    currentCard,
    questionOpenedAtMs: session.opened_at ? Date.parse(session.opened_at) : null,
    questionTimerSeconds: currentCard ? getTriviaTimerSeconds(session.pacing_mode) : null,
    pacingMode: session.pacing_mode,
    gameMode: session.game_mode,
    teamCount: session.team_count,
    players: players.map(toPublicPlayer),
    leaderboard: getLeaderboard(players),
    teamLeaderboard: buildTriviaTeamLeaderboard(players.map(toPublicPlayer), session.game_mode, session.team_count),
    answeredPlayerIds: answers.map((answer) => answer.player_id),
    submittedCount: answers.length,
    waitingForCount: Math.max(0, players.length - answers.length),
    wageredPlayerIds: wagers.map((wager) => wager.player_id),
    wagerSubmittedCount: wagers.length,
    wagerWaitingForCount: Math.max(0, players.length - wagers.length),
    resolution: session.resolution,
    canStart: session.status === "lobby" && (session.game_mode === "individual"
      ? players.length >= 1
      : players.length >= session.team_count),
    canReveal: session.status === "in-progress" && session.phase === "question-open",
    canAdvance: session.status === "in-progress" && ["answer-reveal", "wager-open"].includes(session.phase),
  };
}

export async function buildPersistentTriviaLivePlayerSnapshot(
  sessionId: string,
  playerId: string,
  playerToken: string | null,
): Promise<TriviaLivePlayerSnapshot> {
  const bundle = await loadSession(sessionId);
  const player = requirePlayer(bundle, playerId, playerToken);
  const currentCard = ["question-open", "answer-reveal"].includes(bundle.session.phase) ? getCurrentCard(bundle.session) : null;
  const answer = bundle.answers.find((candidate) => candidate.player_id === playerId);
  const wager = bundle.wagers.find((candidate) => candidate.player_id === playerId);
  const resolutionRow = bundle.session.resolution?.rows.find((row) => row.playerId === playerId) ?? null;

  return {
    sessionId: bundle.session.id,
    roomCode: bundle.session.room_code,
    status: bundle.session.status,
    phase: bundle.session.phase,
    serverTimeMs: Date.now(),
    player: toPublicPlayer(player),
    currentCard: toPublicCard(currentCard),
    questionOpenedAtMs: bundle.session.opened_at ? Date.parse(bundle.session.opened_at) : null,
    questionTimerSeconds: currentCard ? getTriviaTimerSeconds(bundle.session.pacing_mode) : null,
    pacingMode: bundle.session.pacing_mode,
    gameMode: bundle.session.game_mode,
    teamCount: bundle.session.team_count,
    answerState: {
      hasSubmitted: Boolean(answer),
      response: answer?.response ?? null,
      responseText: answer?.response_text ?? null,
    },
    wagerState: {
      hasSubmitted: Boolean(wager),
      wager: wager?.wager ?? null,
      maxWager: player.score,
    },
    leaderboard: getLeaderboard(bundle.players),
    teamLeaderboard: buildTriviaTeamLeaderboard(bundle.players.map(toPublicPlayer), bundle.session.game_mode, bundle.session.team_count),
    resolution: bundle.session.resolution
      ? {
          correctSlot: bundle.session.resolution.correctSlot,
          correctText: bundle.session.resolution.correctText,
          explanation: bundle.session.resolution.card.explanation,
          reference: bundle.session.resolution.card.reference,
          playerOutcome: resolutionRow?.outcome ?? null,
          playerDelta: resolutionRow?.delta ?? null,
          playerSpeedBonus: resolutionRow?.speedBonus ?? null,
          playerStreakBonus: resolutionRow?.streakBonus ?? null,
        }
      : null,
  };
}

export async function getPersistentTriviaLiveJoinUrl(sessionId: string, origin: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_sessions")
    .select("room_code")
    .eq("id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("That trivia room no longer exists.");
  }

  return `${origin}/games/trivia/join?code=${data.room_code}`;
}
