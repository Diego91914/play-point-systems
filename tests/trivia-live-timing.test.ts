import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildTriviaLiveHostSnapshot,
  createTriviaLiveSession,
  joinTriviaLiveSession,
  resolveTriviaLiveQuestion,
  startTriviaLiveSession,
  submitTriviaLiveAnswer,
} from "../app/games/trivia/play/trivia-live-session";
import {
  calculateTriviaAvailablePoints,
  getTriviaCountdownProgress,
  getTriviaPointsDropPerSecond,
  getTriviaTimerSeconds,
} from "../app/games/trivia/play/trivia-live-timing";

afterEach(() => {
  vi.useRealTimers();
});

describe("trivia pacing modes", () => {
  it("uses a proportional score drop for standard and relaxed clocks", () => {
    expect(getTriviaTimerSeconds("standard")).toBe(10);
    expect(getTriviaTimerSeconds("relaxed")).toBe(20);
    expect(getTriviaPointsDropPerSecond(1_000, 10)).toBe(100);
    expect(getTriviaPointsDropPerSecond(1_000, 20)).toBe(50);
    expect(calculateTriviaAvailablePoints(1_000, 9_000, 10)).toBe(100);
    expect(calculateTriviaAvailablePoints(1_000, 19_000, 20)).toBe(50);
    expect(calculateTriviaAvailablePoints(1_000, 20_000, 20)).toBe(0);
    expect(getTriviaCountdownProgress(0, 20)).toBe(100);
    expect(getTriviaCountdownProgress(5_000, 20)).toBe(75);
    expect(getTriviaCountdownProgress(25_000, 20)).toBe(0);
  });

  it("persists relaxed pacing in snapshots and scores against its 20-second clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T17:00:00.000Z"));
    const room = createTriviaLiveSession("bible", "mixed", "relaxed");
    const player = joinTriviaLiveSession(room.roomCode, "Relaxed Player");

    startTriviaLiveSession(room.sessionId, room.hostToken);
    const opened = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    const correctSlot = opened.currentCard?.choices.find((choice) => choice.isCorrect)?.slot;

    expect(opened.pacingMode).toBe("relaxed");
    expect(opened.questionTimerSeconds).toBe(20);
    expect(correctSlot).toBeDefined();

    vi.advanceTimersByTime(15_000);
    submitTriviaLiveAnswer(room.sessionId, player.playerId, correctSlot!, player.playerToken);
    resolveTriviaLiveQuestion(room.sessionId, room.hostToken);

    const resolved = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    expect(resolved.resolution?.rows[0]?.delta).toBe(250);
  });

  it("rejects an answer at the standard timer boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T17:00:00.000Z"));
    const room = createTriviaLiveSession("bible", "mixed", "standard");
    const player = joinTriviaLiveSession(room.roomCode, "Boundary Player");

    startTriviaLiveSession(room.sessionId, room.hostToken);
    vi.advanceTimersByTime(10_000);

    expect(() => submitTriviaLiveAnswer(room.sessionId, player.playerId, "A", player.playerToken)).toThrow(
      "Time expired for this question.",
    );
  });
});
