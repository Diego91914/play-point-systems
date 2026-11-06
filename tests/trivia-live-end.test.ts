import { describe, expect, it } from "vitest";
import {
  buildTriviaLiveHostSnapshot,
  createTriviaLiveSession,
  endTriviaLiveSession,
} from "../app/games/trivia/play/trivia-live-session";

describe("host end for live trivia", () => {
  it("ends the session idempotently while keeping the scores readable", () => {
    const session = createTriviaLiveSession("bible", "mixed");

    expect(endTriviaLiveSession(session.sessionId, session.hostToken)).toEqual({ ended: true, alreadyEnded: false, roomCode: session.roomCode });
    expect(buildTriviaLiveHostSnapshot(session.sessionId, "https://example.com", session.hostToken)).toMatchObject({
      status: "completed",
      phase: "completed",
      leaderboard: [],
    });
    expect(endTriviaLiveSession(session.sessionId, session.hostToken)).toEqual({ ended: true, alreadyEnded: true, roomCode: session.roomCode });
  });

  it("rejects a non-host end request", () => {
    const session = createTriviaLiveSession("bible", "mixed");
    expect(() => endTriviaLiveSession(session.sessionId, "not-the-host-token")).toThrow();
    expect(buildTriviaLiveHostSnapshot(session.sessionId, "https://example.com", session.hostToken).status).toBe("lobby");
  });
});
