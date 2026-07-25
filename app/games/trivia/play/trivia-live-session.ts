import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { buildRuntimeDeck } from "./trivia-runtime-builder";
import type {
  RuntimeChoice,
  RuntimeDeck,
  RuntimeDeckCard,
  RuntimeDifficultyFilter,
  RuntimePublicDeckCard,
  RuntimeResponse,
} from "./trivia-runtime-types";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const QUESTION_TIMER_MS = 10000;
const QUESTION_POINTS_DROP_PER_SECOND = 100;
const sessions = new Map<string, TriviaLiveSession>();
const roomCodeToSessionId = new Map<string, string>();
const AUTH_TOKEN_BYTES = 32;

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

type StoredTriviaLivePlayer = TriviaLivePlayer & {
  tokenHash: string;
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

type TriviaLiveSession = {
  sessionId: string;
  roomCode: string;
  hostTokenHash: string;
  deck: RuntimeDeck;
  status: TriviaLiveSessionStatus;
  phase: TriviaLiveSessionPhase;
  cardIndex: number;
  players: StoredTriviaLivePlayer[];
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
  currentCard: RuntimePublicDeckCard | null;
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

export class TriviaLiveAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TriviaLiveAuthorizationError";
  }
}

export function readTriviaLiveBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  return match?.[1] ?? null;
}

export function isTriviaLiveAuthorizationError(error: unknown): error is TriviaLiveAuthorizationError {
  return error instanceof TriviaLiveAuthorizationError;
}

function createAuthToken() {
  return randomBytes(AUTH_TOKEN_BYTES).toString("base64url");
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

function requireHost(sessionId: string, token: string | null) {
  const session = sessions.get(sessionId);

  if (!session || !tokenMatches(token, session.hostTokenHash)) {
    throw new TriviaLiveAuthorizationError("A valid host token is required.");
  }

  return session;
}

function requirePlayer(sessionId: string, playerId: string, token: string | null) {
  const session = sessions.get(sessionId);
  const player = session?.players.find((candidate) => candidate.id === playerId);

  if (!session || !player || !tokenMatches(token, player.tokenHash)) {
    throw new TriviaLiveAuthorizationError("A valid player token is required.");
  }

  return { session, player };
}

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

function toPublicPlayer(player: StoredTriviaLivePlayer): TriviaLivePlayer {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    correctCount: player.correctCount,
    wrongCount: player.wrongCount,
    skippedCount: player.skippedCount,
  };
}

function getLeaderboard(players: StoredTriviaLivePlayer[]) {
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

function buildResponseText(card: RuntimeDeckCard, response: RuntimeResponse) {
  if (response === "skip") {
    return "Skip";
  }

  return card.choices.find((choice) => choice.slot === response)?.text ?? response;
}

export function createTriviaLiveSession(
  category: string,
  difficultyFilter: RuntimeDifficultyFilter,
): { sessionId: string; roomCode: string; hostToken: string } {
  const deck = buildRuntimeDeck(category, difficultyFilter);
  const sessionId = randomUUID();
  const roomCode = generateRoomCode();
  const hostToken = createAuthToken();
  const timestamp = now();
  const session: TriviaLiveSession = {
    sessionId,
    roomCode,
    hostTokenHash: hashAuthToken(hostToken),
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
  return { sessionId, roomCode, hostToken };
}

export function joinTriviaLiveSession(roomCode: string, playerName: string): { sessionId: string; playerId: string; playerToken: string } {
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

  const playerToken = createAuthToken();
  const player: StoredTriviaLivePlayer = {
    id: randomUUID(),
    name: nextName,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    skippedCount: 0,
    tokenHash: hashAuthToken(playerToken),
  };

  session.players.push(player);
  session.updatedAtMs = now();

  return { sessionId: session.sessionId, playerId: player.id, playerToken };
}

export function startTriviaLiveSession(sessionId: string, hostToken: string | null) {
  const session = requireHost(sessionId, hostToken);

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

export function submitTriviaLiveAnswer(sessionId: string, playerId: string, response: RuntimeResponse, playerToken: string | null) {
  const { session, player } = requirePlayer(sessionId, playerId, playerToken);
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

export function resolveTriviaLiveQuestion(sessionId: string, hostToken: string | null) {
  const session = requireHost(sessionId, hostToken);
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
    const speedBonus = 0;

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

export function advanceTriviaLiveQuestion(sessionId: string, hostToken: string | null) {
  const session = requireHost(sessionId, hostToken);

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

export function buildTriviaLiveHostSnapshot(sessionId: string, origin: string, hostToken: string | null): TriviaLiveHostSnapshot {
  const session = requireHost(sessionId, hostToken);
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
    players: session.players.map(toPublicPlayer),
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

export function buildTriviaLivePlayerSnapshot(sessionId: string, playerId: string, playerToken: string | null): TriviaLivePlayerSnapshot {
  const { session, player } = requirePlayer(sessionId, playerId, playerToken);
  const currentCard = getCurrentCard(session);
  const answer = session.selections[playerId];
  const resolutionRow = session.resolution?.rows.find((row) => row.playerId === playerId) ?? null;

  return {
    sessionId: session.sessionId,
    roomCode: session.roomCode,
    status: session.status,
    phase: session.phase,
    serverTimeMs: now(),
    player: toPublicPlayer(player),
    currentCard: toPublicCard(currentCard),
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

export function getTriviaLiveJoinUrl(sessionId: string, origin: string) {
  const session = getSessionOrThrow(sessionId);
  return `${origin}/games/trivia/join?code=${session.roomCode}`;
}
