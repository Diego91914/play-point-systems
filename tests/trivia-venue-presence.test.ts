import { describe, expect, it } from "vitest";
import {
  TRIVIA_VENUE_IDLE_MISSED_QUESTIONS,
  TRIVIA_VENUE_PRESENCE_WINDOW_MS,
  canTriviaVenuePlayerAnswer,
  extendTriviaVenuePresence,
  getTriviaVenuePresenceStatus,
  recordTriviaVenueMiss,
  resetTriviaVenueActivityAfterAnswer,
  shouldShowTriviaVenuePlayerOnLeaderboard,
} from "../app/games/trivia/venue/trivia-venue-presence";

describe("Trivia Venue Mode presence", () => {
  it("grants a sixty minute presence window", () => {
    const now = 1_000_000;
    expect(extendTriviaVenuePresence(now)).toBe(now + TRIVIA_VENUE_PRESENCE_WINDOW_MS);
  });

  it("keeps a present player active before the idle threshold", () => {
    expect(getTriviaVenuePresenceStatus({
      nowMs: 1000,
      presenceExpiresAtMs: 5000,
      consecutiveQuestionsMissed: TRIVIA_VENUE_IDLE_MISSED_QUESTIONS - 1,
    })).toBe("active");
  });

  it("hides a player after three consecutive misses without erasing eligibility", () => {
    const status = getTriviaVenuePresenceStatus({
      nowMs: 1000,
      presenceExpiresAtMs: 5000,
      consecutiveQuestionsMissed: TRIVIA_VENUE_IDLE_MISSED_QUESTIONS,
    });

    expect(status).toBe("idle");
    expect(canTriviaVenuePlayerAnswer(status)).toBe(true);
    expect(shouldShowTriviaVenuePlayerOnLeaderboard(status)).toBe(false);
  });

  it("requires a rescan after presence expires", () => {
    const status = getTriviaVenuePresenceStatus({
      nowMs: 5000,
      presenceExpiresAtMs: 5000,
      consecutiveQuestionsMissed: 0,
    });

    expect(status).toBe("presence_expired");
    expect(canTriviaVenuePlayerAnswer(status)).toBe(false);
    expect(shouldShowTriviaVenuePlayerOnLeaderboard(status)).toBe(false);
  });

  it("keeps removed players blocked regardless of presence", () => {
    const status = getTriviaVenuePresenceStatus({
      nowMs: 1000,
      presenceExpiresAtMs: 9000,
      consecutiveQuestionsMissed: 0,
      removed: true,
    });

    expect(status).toBe("removed");
    expect(canTriviaVenuePlayerAnswer(status)).toBe(false);
  });

  it("restores activity after an answer", () => {
    expect(recordTriviaVenueMiss(2)).toBe(3);
    expect(resetTriviaVenueActivityAfterAnswer()).toEqual({ consecutiveQuestionsMissed: 0 });
  });
});
