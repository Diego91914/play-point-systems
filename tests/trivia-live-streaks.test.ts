import { describe, expect, it } from "vitest";
import {
  advanceTriviaLiveQuestion,
  buildTriviaLiveHostSnapshot,
  buildTriviaLivePlayerSnapshot,
  createTriviaLiveSession,
  joinTriviaLiveSession,
  resolveTriviaLiveQuestion,
  startTriviaLiveSession,
  submitTriviaLiveAnswer,
} from "../app/games/trivia/play/trivia-live-session";

function answerCurrentQuestion(sessionId: string, hostToken: string, playerId: string, playerToken: string, correct: boolean) {
  const card = buildTriviaLiveHostSnapshot(sessionId, "https://example.com", hostToken).currentCard!;
  const choice = card.choices.find((candidate) => candidate.isCorrect === correct)!;
  submitTriviaLiveAnswer(sessionId, playerId, choice.slot, playerToken);
  resolveTriviaLiveQuestion(sessionId, hostToken);
  return buildTriviaLiveHostSnapshot(sessionId, "https://example.com", hostToken);
}

describe("live trivia streaks", () => {
  it("awards visible consecutive-answer bonuses and resets the current streak after a miss", () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const player = joinTriviaLiveSession(room.roomCode, "Streak Player");
    startTriviaLiveSession(room.sessionId, room.hostToken);

    const first = answerCurrentQuestion(room.sessionId, room.hostToken, player.playerId, player.playerToken, true);
    expect(first.resolution!.rows[0]).toMatchObject({ streakBonus: 0, delta: 500, nextScore: 500 });
    expect(first.players[0]).toMatchObject({ currentStreak: 1, bestStreak: 1 });

    advanceTriviaLiveQuestion(room.sessionId, room.hostToken);
    const second = answerCurrentQuestion(room.sessionId, room.hostToken, player.playerId, player.playerToken, true);
    expect(second.resolution!.rows[0]).toMatchObject({ streakBonus: 100, delta: 600, nextScore: 1100 });
    expect(second.players[0]).toMatchObject({ currentStreak: 2, bestStreak: 2 });

    const playerReveal = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);
    expect(playerReveal.resolution).toMatchObject({ playerStreakBonus: 100, playerDelta: 600 });

    advanceTriviaLiveQuestion(room.sessionId, room.hostToken);
    const missed = answerCurrentQuestion(room.sessionId, room.hostToken, player.playerId, player.playerToken, false);
    expect(missed.resolution!.rows[0]).toMatchObject({ streakBonus: 0, delta: 0, nextScore: 1100 });
    expect(missed.players[0]).toMatchObject({ currentStreak: 0, bestStreak: 2 });
  });
});
