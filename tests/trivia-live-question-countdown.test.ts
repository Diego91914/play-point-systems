import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("live trivia question countdown", () => {
  afterEach(() => vi.useRealTimers());

  it("hides the question for three seconds and starts response timing when it opens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T19:00:00.000Z"));
    const room = createTriviaLiveSession("bible", "mixed");
    const player = joinTriviaLiveSession(room.roomCode, "Ready Player");

    startTriviaLiveSession(room.sessionId, room.hostToken);
    const hostCountdown = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    const playerCountdown = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);

    expect(hostCountdown.phase).toBe("question-countdown");
    expect(hostCountdown.questionOpenedAtMs).toBe(Date.now() + 3_000);
    expect(hostCountdown.currentCard).toBeNull();
    expect(playerCountdown.currentCard).toBeNull();
    expect(() => submitTriviaLiveAnswer(room.sessionId, player.playerId, "A", player.playerToken)).toThrow("not currently accepting answers");

    vi.advanceTimersByTime(2_999);
    expect(buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken).phase).toBe("question-countdown");

    vi.advanceTimersByTime(1);
    const opened = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    const correctSlot = opened.currentCard!.choices.find((choice) => choice.isCorrect)!.slot;
    expect(opened.phase).toBe("question-open");

    vi.advanceTimersByTime(1_000);
    submitTriviaLiveAnswer(room.sessionId, player.playerId, correctSlot, player.playerToken);
    resolveTriviaLiveQuestion(room.sessionId, room.hostToken);
    const revealed = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    expect(revealed.resolution!.rows[0].responseTimeMs).toBe(1_000);

    advanceTriviaLiveQuestion(room.sessionId, room.hostToken);
    const nextCountdown = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    expect(nextCountdown.phase).toBe("question-countdown");
    expect(nextCountdown.currentCard).toBeNull();
  });
});
