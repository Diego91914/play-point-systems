import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  advanceTriviaLiveQuestion,
  buildTriviaLiveHostSnapshot,
  buildTriviaLivePlayerSnapshot,
  createTriviaLiveSession,
  joinTriviaLiveSession,
  resolveTriviaLiveQuestion,
  startTriviaLiveSession,
  submitTriviaLiveAnswer,
  submitTriviaLiveWager,
  TriviaLiveAuthorizationError,
} from "../app/games/trivia/play/trivia-live-session";

function correctSlot(sessionId: string, hostToken: string) {
  let snapshot = buildTriviaLiveHostSnapshot(sessionId, "https://example.com", hostToken);
  if (snapshot.phase === "question-countdown") {
    vi.advanceTimersByTime(3_000);
    snapshot = buildTriviaLiveHostSnapshot(sessionId, "https://example.com", hostToken);
  }
  const card = snapshot.currentCard;
  const slot = card?.choices.find((choice) => choice.isCorrect)?.slot;

  if (!slot) {
    throw new Error("Expected a correct choice.");
  }

  return slot;
}

function advanceToFinalWager(sessionId: string, hostToken: string) {
  while (true) {
    const snapshot = buildTriviaLiveHostSnapshot(sessionId, "https://example.com", hostToken);

    if (snapshot.phase === "question-countdown") {
      vi.advanceTimersByTime(3_000);
      continue;
    }

    if (snapshot.phase === "wager-open") {
      return snapshot;
    }

    resolveTriviaLiveQuestion(sessionId, hostToken);
    advanceTriviaLiveQuestion(sessionId, hostToken);
  }
}

describe("live trivia final wager", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("pauses before the final question and keeps wagers private", () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const player = joinTriviaLiveSession(room.roomCode, "Olivia");
    startTriviaLiveSession(room.sessionId, room.hostToken);

    submitTriviaLiveAnswer(room.sessionId, player.playerId, correctSlot(room.sessionId, room.hostToken), player.playerToken);
    const wagerSnapshot = advanceToFinalWager(room.sessionId, room.hostToken);
    const playerBeforeWager = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);

    expect(wagerSnapshot.cardIndex).toBe(wagerSnapshot.deck.cards.length - 1);
    expect(wagerSnapshot.currentCard).toBeNull();
    expect(playerBeforeWager.phase).toBe("wager-open");
    expect(playerBeforeWager.currentCard).toBeNull();
    expect(playerBeforeWager.wagerState.maxWager).toBe(500);

    submitTriviaLiveWager(room.sessionId, player.playerId, 400, player.playerToken);
    const hostAfterWager = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);

    expect(hostAfterWager.wagerSubmittedCount).toBe(1);
    expect(hostAfterWager.wageredPlayerIds).toEqual([player.playerId]);
    expect(JSON.stringify(hostAfterWager)).not.toContain('"wager":400');
  });

  it("adds a correct wager, subtracts an incorrect wager, and defaults missing wagers to zero", () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const winner = joinTriviaLiveSession(room.roomCode, "Correct Player");
    const loser = joinTriviaLiveSession(room.roomCode, "Wrong Player");
    const noWager = joinTriviaLiveSession(room.roomCode, "No Wager Player");
    startTriviaLiveSession(room.sessionId, room.hostToken);

    const openingCorrectSlot = correctSlot(room.sessionId, room.hostToken);
    submitTriviaLiveAnswer(room.sessionId, winner.playerId, openingCorrectSlot, winner.playerToken);
    submitTriviaLiveAnswer(room.sessionId, loser.playerId, openingCorrectSlot, loser.playerToken);
    submitTriviaLiveAnswer(room.sessionId, noWager.playerId, openingCorrectSlot, noWager.playerToken);
    advanceToFinalWager(room.sessionId, room.hostToken);

    submitTriviaLiveWager(room.sessionId, winner.playerId, 500, winner.playerToken);
    submitTriviaLiveWager(room.sessionId, loser.playerId, 500, loser.playerToken);
    advanceTriviaLiveQuestion(room.sessionId, room.hostToken);
    vi.advanceTimersByTime(3_000);

    const finalCard = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken).currentCard!;
    const finalCorrectSlot = finalCard.choices.find((choice) => choice.isCorrect)!.slot;
    const finalWrongSlot = finalCard.choices.find((choice) => !choice.isCorrect)!.slot;
    submitTriviaLiveAnswer(room.sessionId, winner.playerId, finalCorrectSlot, winner.playerToken);
    submitTriviaLiveAnswer(room.sessionId, loser.playerId, finalWrongSlot, loser.playerToken);
    submitTriviaLiveAnswer(room.sessionId, noWager.playerId, finalCorrectSlot, noWager.playerToken);
    resolveTriviaLiveQuestion(room.sessionId, room.hostToken);

    const resolution = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken).resolution!;
    expect(resolution.rows.find((row) => row.playerId === winner.playerId)).toMatchObject({ wager: 500, delta: 500, nextScore: 1000 });
    expect(resolution.rows.find((row) => row.playerId === loser.playerId)).toMatchObject({ wager: 500, delta: -500, nextScore: 0 });
    expect(resolution.rows.find((row) => row.playerId === noWager.playerId)).toMatchObject({ wager: 0, delta: 0, nextScore: 500 });
  });

  it("rejects invalid, duplicate, and unauthorized wagers", () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const player = joinTriviaLiveSession(room.roomCode, "Secure Player");
    startTriviaLiveSession(room.sessionId, room.hostToken);
    submitTriviaLiveAnswer(room.sessionId, player.playerId, correctSlot(room.sessionId, room.hostToken), player.playerToken);
    advanceToFinalWager(room.sessionId, room.hostToken);

    expect(() => submitTriviaLiveWager(room.sessionId, player.playerId, 501, player.playerToken)).toThrow("0 to 500");
    expect(() => submitTriviaLiveWager(room.sessionId, player.playerId, 100, "wrong-token")).toThrow(TriviaLiveAuthorizationError);
    submitTriviaLiveWager(room.sessionId, player.playerId, 100, player.playerToken);
    expect(() => submitTriviaLiveWager(room.sessionId, player.playerId, 100, player.playerToken)).toThrow("already locked");
  });
});
