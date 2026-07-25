import * as memory from "./trivia-live-session";
import type { RuntimeDifficultyFilter, RuntimeResponse, TriviaGameMode } from "./trivia-runtime-types";
import type { TriviaPacingMode } from "./trivia-live-timing";

export {
  isTriviaLiveAuthorizationError,
} from "./trivia-live-session";
export {
  readTriviaLiveBearerToken,
  readTriviaLiveHostToken,
  readTriviaLivePlayerToken,
} from "./trivia-live-cookie";

function isPersistentStoreEnabled() {
  return process.env.NODE_ENV !== "test"
    && Boolean(process.env.PLAY_POINT_LIVE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)
    && Boolean(
      process.env.PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY
      ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
}

async function persistentStore() {
  return import("./trivia-live-persistent-session");
}

export async function createTriviaLiveSession(
  category: string,
  difficultyFilter: RuntimeDifficultyFilter,
  pacingMode: TriviaPacingMode,
  gameMode: TriviaGameMode,
  teamCount: number,
) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).createPersistentTriviaLiveSession(category, difficultyFilter, pacingMode, gameMode, teamCount);
  }

  return memory.createTriviaLiveSession(category, difficultyFilter, pacingMode, gameMode, teamCount);
}

export async function joinTriviaLiveSession(roomCode: string, playerName: string) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).joinPersistentTriviaLiveSession(roomCode, playerName);
  }

  return memory.joinTriviaLiveSession(roomCode, playerName);
}

export async function startTriviaLiveSession(sessionId: string, hostToken: string | null) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).startPersistentTriviaLiveSession(sessionId, hostToken);
  }

  return memory.startTriviaLiveSession(sessionId, hostToken);
}

export async function submitTriviaLiveAnswer(
  sessionId: string,
  playerId: string,
  response: RuntimeResponse,
  playerToken: string | null,
) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).submitPersistentTriviaLiveAnswer(
      sessionId,
      playerId,
      response,
      playerToken,
    );
  }

  return memory.submitTriviaLiveAnswer(sessionId, playerId, response, playerToken);
}

export async function submitTriviaLiveWager(
  sessionId: string,
  playerId: string,
  wager: number,
  playerToken: string | null,
) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).submitPersistentTriviaLiveWager(
      sessionId,
      playerId,
      wager,
      playerToken,
    );
  }

  return memory.submitTriviaLiveWager(sessionId, playerId, wager, playerToken);
}

export async function resolveTriviaLiveQuestion(sessionId: string, hostToken: string | null) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).resolvePersistentTriviaLiveQuestion(sessionId, hostToken);
  }

  return memory.resolveTriviaLiveQuestion(sessionId, hostToken);
}

export async function advanceTriviaLiveQuestion(sessionId: string, hostToken: string | null) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).advancePersistentTriviaLiveQuestion(sessionId, hostToken);
  }

  return memory.advanceTriviaLiveQuestion(sessionId, hostToken);
}

export async function buildTriviaLiveHostSnapshot(
  sessionId: string,
  origin: string,
  hostToken: string | null,
) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).buildPersistentTriviaLiveHostSnapshot(
      sessionId,
      origin,
      hostToken,
    );
  }

  return memory.buildTriviaLiveHostSnapshot(sessionId, origin, hostToken);
}

export async function buildTriviaLivePlayerSnapshot(
  sessionId: string,
  playerId: string,
  playerToken: string | null,
) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).buildPersistentTriviaLivePlayerSnapshot(
      sessionId,
      playerId,
      playerToken,
    );
  }

  return memory.buildTriviaLivePlayerSnapshot(sessionId, playerId, playerToken);
}

export async function getTriviaLiveJoinUrl(sessionId: string, origin: string) {
  if (isPersistentStoreEnabled()) {
    return (await persistentStore()).getPersistentTriviaLiveJoinUrl(sessionId, origin);
  }

  return memory.getTriviaLiveJoinUrl(sessionId, origin);
}
