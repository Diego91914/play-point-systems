import { randomUUID } from "node:crypto";
import { buildRuntimeDeck } from "./trivia-runtime-builder";
import type {
  RuntimeChoice,
  RuntimeDeck,
  RuntimeDeckCard,
  RuntimeDifficultyFilter,
  RuntimeResponse,
} from "./trivia-runtime-types";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const QUESTION_TIMER_MS = 10000;
const QUESTION_POINTS_DROP_PER_SECOND = 100;
const sessions = new Map<string, TriviaLiveSession>();
const roomCodeToSessionId = new Map<string, string>();

export type TriviaLiveSessionStatus = "lobby" | "in-progress" | "completed";
export type TriviaLiveSessionPhase = "lobby" | "question-open" | "answer-reveal" | "completed";

export type TriviaLivePlayer = {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

export type TriviaLiveSubmission = {
  playerId: string;
  response: RuntimeResponse;
  responseText: string;
  outcome: "correct" | "wrong" | "skip";
  submittedAtMs: number | null;
  responseTimeMs: number | null;
};

export type TriviaLiveResolutionRow = TriviaLiveSubmission & {
  playerName: string;
  delta: number;
  speedBonus: number;
  nextScore: number;
};

export type TriviaLiveResolution = {
  card: RuntimeDeckCard;
  correctSlot: string;
  correctText: string;
  rows: TriviaLiveResolutionRow[];
};

export type TriviaLiveSession = {
  sessionId: string;
  roomCode: string;
  deck: RuntimeDeck;
  status: TriviaLiveSessionStatus;
  phase: TriviaLiveSessionPhase;
  cardIndex: number;
  players: TriviaLivePlayer[];
  selections: Record<string, TriviaLiveSubmission | undefined>;
  openedAtMs: number | null;
  resolution: TriviaLiveResolution | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export type TriviaLiveHostSnapshot = {
  sessionId: string;
  roomCode: string;
  joinUrl: string;
  qrUrl: string;
  status: TriviaLiveSessionStatus;
  phase: TriviaLiveSessionPhase;
  serverTimeMs: number;
  cardIndex: number;
  deck: RuntimeDeck;
  currentCard: RuntimeDeckCard | null;
  questionOpenedAtMs: number | null;
  questionTimerSeconds: number | null;
  players: TriviaLivePlayer[];
  leaderboard: TriviaLivePlayer[];
  answeredPlayerIds: string[];
  submittedCount: number;
  waitingForCount: number;
  resolution: TriviaLiveResolution | null;
  canStart: boolean;
  canReveal: boolean;
  canAdvance: boolean;
};

export type TriviaLivePlayerSnapshot = {
  sessionId: string;
  roomCode: string;
  status: TriviaLiveSessionStatus;
  phase: TriviaLiveSessionPhase;
  serverTimeMs: number;
  player: TriviaLivePlayer;
  currentCard: RuntimeDeckCard | null;
  questionOpenedAtMs: number | null;
  questionTimerSeconds: number | null;
  answerState: {
    hasSubmitted: boolean;
    response: RuntimeResponse | null;
    responseText: string | null;
  };
  leaderboard: TriviaLivePlayer[];
  resolution: {
    correctSlot: string;
    correctText: string;
    explanation: string;
    playerOutcome: "correct" | "wrong" | "skip" | null;
    playerDelta: number | null;
    playerSpeedBonus: number | null;
  } | null;
};

function generateRoomCode(): string {
  while (true) {
    let nextCode = "";

    for (let index = 0; index < 6; index += 1) {
      nextCode += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }

    if (!roomCodeToSessionId.has(nextCode)) {
      return nextCode;
    }
  }
}

function now() {
  return Date.now();
}

function getCurrentCard(session: TriviaLiveSession): RuntimeDeckCard | null {
  return session.cardIndex >= session.deck.cards.length ? null : session.deck.cards[session.cardIndex] ?? null;
}

function getCorrectChoice(card: RuntimeDeckCard): RuntimeChoice {
  return card.choices.find((choice) => choice.isCorrect) ?? card.choices[0];
}

function getLeaderboard(players: TriviaLivePlayer[]) {
  return [...players].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.name.localeCompare(right.name);
  });
}

function calculateAvailableCorrectPoints(card: RuntimeDeckCard, responseTimeMs: number | null) {
  const clamped = Math.max(0, Math.min(responseTimeMs ?? QUESTION_TIMER_MS, QUESTION_TIMER_MS));
  const elapsedSeconds = Math.floor(clamped / 1000);

  return Math.max(0, card.scoring.correct - elapsedSeconds * QUESTION_POINTS_DROP_PER_SECOND);
}

function normalizePlayerName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("A player name is required.");
  }

  return trimmed;
}

function getSessionOrThrow(sessionId: string): TriviaLiveSession {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("That trivia room no longer exists.");
  }

  return session;
}

function getSessionByRoomCodeOrThrow(roomCode: string): TriviaLiveSession {
  const sessionId = roomCodeToSessionId.get(roomCode.trim().toUpperCase());

  if (!sessionId) {
    throw new Error("That room code was not found.");
  }

  return getSessionOrThrow(sessionId);
}

function getPlayerOrThrow(session: TriviaLiveSession, playerId: string): TriviaLivePlayer {
  const player = session.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    throw new Error("That player is not in the room.");
  }

  return player;
}

function buildResponseText(card: RuntimeDeckCard, response: RuntimeResponse) {
  if (response === "skip") {
    return "Skip";
  }

  return card.choices.find((choice) => choice.slot === response)?.text ?? response;
}

export function createTriviaLiveSession(
  category: string,
  difficultyFilter: RuntimeDifficultyFilter,
): TriviaLiveSession {
  const deck = buildRuntimeDeck(category, difficultyFilter);
  const sessionId = randomUUID();
  const roomCode = generateRoomCode();
  const timestamp = now();
  const session: TriviaLiveSession = {
    sessionId,
    roomCode,
    deck,
    status: "lobby",
    phase: "lobby",
    cardIndex: 0,
    players: [],
    selections: {},
    openedAtMs: null,
    resolution: null,
    createdAtMs: timestamp,
    updatedAtMs: timestamp,
  };

  sessions.set(sessionId, session);
  roomCodeToSessionId.set(roomCode, sessionId);
  return session;
}

export function joinTriviaLiveSession(roomCode: string, playerName: string): { session: TriviaLiveSession; player: TriviaLivePlayer } {
  const session = getSessionByRoomCodeOrThrow(roomCode);

  if (session.status !== "lobby") {
    throw new Error("That room has already started.");
  }

  const nextName = normalizePlayerName(playerName);
  const alreadyExists = session.players.some(
    (player) => player.name.trim().toLowerCase() === nextName.toLowerCase(),
  );

  if (alreadyExists) {
    throw new Error("That player name is already in the room.");
  }

  const player: TriviaLivePlayer = {
    id: `player-${session.players.length + 1}`,
    name: nextName,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    skippedCount: 0,
  };

  session.players.push(player);
  session.updatedAtMs = now();

  return { session, player };
}

export function startTriviaLiveSession(sessionId: string) {
  const session = getSessionOrThrow(sessionId);

  if (session.status !== "lobby") {
    throw new Error("That room has already started.");
  }

  if (session.players.length === 0) {
    throw new Error("At least one player must join before the room can start.");
  }

  session.status = "in-progress";
  session.phase = "question-open";
  session.openedAtMs = now();
  session.updatedAtMs = now();

  return session;
}

export function submitTriviaLiveAnswer(sessionId: string, playerId: string, response: RuntimeResponse) {
  const session = getSessionOrThrow(sessionId);
  const player = getPlayerOrThrow(session, playerId);
  const card = getCurrentCard(session);

  if (!card || session.status !== "in-progress" || session.phase !== "question-open") {
    throw new Error("That room is not currently accepting answers.");
  }

  if (session.selections[player.id]) {
    throw new Error("This player already locked an answer for the current question.");
  }

  const submittedAtMs = now();
  const responseTimeMs =
    session.openedAtMs === null ? null : Math.max(0, submittedAtMs - session.openedAtMs);

  if ((responseTimeMs ?? QUESTION_TIMER_MS) >= QUESTION_TIMER_MS) {
    throw new Error("Time expired for this question.");
  }

  const correctChoice = getCorrectChoice(card);
  const outcome =
    response === "skip" ? "skip" : response === correctChoice.slot ? "correct" : "wrong";

  session.selections[player.id] = {
    playerId: player.id,
    response,
    responseText: buildResponseText(card, response),
    outcome,
    submittedAtMs,
    responseTimeMs,
  };
  session.updatedAtMs = submittedAtMs;

  return session;
}

export function resolveTriviaLiveQuestion(sessionId: string) {
  const session = getSessionOrThrow(sessionId);
  const card = getCurrentCard(session);

  if (!card || session.status !== "in-progress" || session.phase !== "question-open") {
    throw new Error("There is no active question to resolve.");
  }

  const correctChoice = getCorrectChoice(card);
  const rows: TriviaLiveResolutionRow[] = [];

  session.players.forEach((player) => {
    const submission =
      session.selections[player.id] ??
      {
        playerId: player.id,
        response: "skip" as const,
        responseText: "Skip",
        outcome: "skip" as const,
        submittedAtMs: null,
        responseTimeMs: null,
      };

    let delta = 0;
    let speedBonus = 0;

    if (submission.outcome === "correct") {
      delta = calculateAvailableCorrectPoints(card, submission.responseTimeMs);
      player.correctCount += 1;
    } else if (submission.outcome === "wrong") {
      delta = 0;
      player.wrongCount += 1;
    } else {
      delta = 0;
      player.skippedCount += 1;
    }

    player.score += delta;

    rows.push({
      ...submission,
      playerName: player.name,
      delta,
      speedBonus,
      nextScore: player.score,
    });
  });

  session.phase = "answer-reveal";
  session.resolution = {
    card,
    correctSlot: correctChoice.slot,
    correctText: correctChoice.text,
    rows,
  };
  session.updatedAtMs = now();

  return session;
}

export function advanceTriviaLiveQuestion(sessionId: string) {
  const session = getSessionOrThrow(sessionId);

  if (session.status !== "in-progress" || session.phase !== "answer-reveal") {
    throw new Error("Resolve the current question before advancing.");
  }

  if (session.cardIndex >= session.deck.cards.length - 1) {
    session.status = "completed";
    session.phase = "completed";
    session.cardIndex = session.deck.cards.length;
    session.selections = {};
    session.openedAtMs = null;
    session.updatedAtMs = now();
    return session;
  }

  session.cardIndex += 1;
  session.selections = {};
  session.resolution = null;
  session.phase = "question-open";
  session.openedAtMs = now();
  session.updatedAtMs = now();

  return session;
}

export function buildTriviaLiveHostSnapshot(sessionId: string, origin: string): TriviaLiveHostSnapshot {
  const session = getSessionOrThrow(sessionId);
  const currentCard = getCurrentCard(session);

  return {
    sessionId: session.sessionId,
    roomCode: session.roomCode,
    joinUrl: `${origin}/games/trivia/join?code=${session.roomCode}`,
    qrUrl: `${origin}/api/trivia/sessions/${session.sessionId}/join-qr`,
    status: session.status,
    phase: session.phase,
    serverTimeMs: now(),
    cardIndex: session.cardIndex,
    deck: session.deck,
    currentCard,
    questionOpenedAtMs: session.openedAtMs,
    questionTimerSeconds: currentCard ? QUESTION_TIMER_MS / 1000 : null,
    players: session.players,
    leaderboard: getLeaderboard(session.players),
    answeredPlayerIds: Object.values(session.selections)
      .filter((selection): selection is TriviaLiveSubmission => Boolean(selection))
      .map((selection) => selection.playerId),
    submittedCount: Object.values(session.selections).filter(Boolean).length,
    waitingForCount: Math.max(0, session.players.length - Object.values(session.selections).filter(Boolean).length),
    resolution: session.resolution,
    canStart: session.status === "lobby" && session.players.length > 0,
    canReveal: session.status === "in-progress" && session.phase === "question-open",
    canAdvance: session.status === "in-progress" && session.phase === "answer-reveal",
  };
}

export function buildTriviaLivePlayerSnapshot(sessionId: string, playerId: string): TriviaLivePlayerSnapshot {
  const session = getSessionOrThrow(sessionId);
  const player = getPlayerOrThrow(session, playerId);
  const currentCard = getCurrentCard(session);
  const answer = session.selections[playerId];
  const resolutionRow = session.resolution?.rows.find((row) => row.playerId === playerId) ?? null;

  return {
    sessionId: session.sessionId,
    roomCode: session.roomCode,
    status: session.status,
    phase: session.phase,
    serverTimeMs: now(),
    player,
    currentCard,
    questionOpenedAtMs: session.openedAtMs,
    questionTimerSeconds: currentCard ? QUESTION_TIMER_MS / 1000 : null,
    answerState: {
      hasSubmitted: Boolean(answer),
      response: answer?.response ?? null,
      responseText: answer?.responseText ?? null,
    },
    leaderboard: getLeaderboard(session.players),
    resolution: session.resolution
      ? {
          correctSlot: session.resolution.correctSlot,
          correctText: session.resolution.correctText,
          explanation: session.resolution.card.explanation,
          playerOutcome: resolutionRow?.outcome ?? null,
          playerDelta: resolutionRow?.delta ?? null,
          playerSpeedBonus: resolutionRow?.speedBonus ?? null,
        }
      : null,
  };
}
