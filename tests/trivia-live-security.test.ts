import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getPublicDeck } from "../app/api/trivia/deck/route";
import { GET as getHostSession } from "../app/api/trivia/sessions/[sessionId]/route";
import {
  buildTriviaLiveHostSnapshot,
  buildTriviaLivePlayerSnapshot,
  createTriviaLiveSession,
  joinTriviaLiveSession,
  resolveTriviaLiveQuestion,
  startTriviaLiveSession,
  submitTriviaLiveAnswer,
  TriviaLiveAuthorizationError,
} from "../app/games/trivia/play/trivia-live-session";

function createRoomWithPlayers(...names: string[]) {
  const room = createTriviaLiveSession("bible", "mixed");
  const players = names.map((name) => joinTriviaLiveSession(room.roomCode, name));
  return { room, players };
}

describe("live trivia serialization security", () => {
  afterEach(() => vi.useRealTimers());

  it("never sends answer-key fields in a player card before reveal", () => {
    const { room, players } = createRoomWithPlayers("Alex");
    const [player] = players;
    vi.useFakeTimers();
    startTriviaLiveSession(room.sessionId, room.hostToken);
    vi.advanceTimersByTime(3_000);
    const snapshot = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);
    const serializedCard = JSON.stringify(snapshot.currentCard);

    expect(snapshot.currentCard).not.toBeNull();
    expect(serializedCard).not.toContain("isCorrect");
    expect(serializedCard).not.toContain("explanation");
    expect(serializedCard).not.toContain("reference");
    expect(serializedCard).not.toContain("tags");
    expect(serializedCard).not.toContain("sourceId");
  });

  it("reveals the answer only after the host resolves the question", () => {
    const { room, players } = createRoomWithPlayers("Jordan");
    const [player] = players;
    vi.useFakeTimers();
    startTriviaLiveSession(room.sessionId, room.hostToken);
    vi.advanceTimersByTime(3_000);

    const openSnapshot = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);
    const firstSlot = openSnapshot.currentCard?.choices[0]?.slot;
    expect(firstSlot).toBeDefined();

    submitTriviaLiveAnswer(room.sessionId, player.playerId, firstSlot!, player.playerToken);
    expect(buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken).resolution).toBeNull();

    resolveTriviaLiveQuestion(room.sessionId, room.hostToken);
    const revealed = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);
    expect(revealed.resolution?.correctSlot).toMatch(/^[A-D]$/);
    expect(revealed.resolution?.correctText).toBeTruthy();
    expect(revealed.resolution?.explanation).toBeTruthy();
    expect(revealed.resolution?.reference).toBeTruthy();
  });
});

describe("live trivia authorization", () => {
  it("rejects missing and incorrect host tokens", () => {
    const { room } = createRoomWithPlayers("Host Test Player");

    expect(() => buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", null)).toThrow(
      TriviaLiveAuthorizationError,
    );
    expect(() => startTriviaLiveSession(room.sessionId, "not-the-host-token")).toThrow(
      TriviaLiveAuthorizationError,
    );
  });

  it("enforces host authentication at the HTTP route", async () => {
    const { room } = createRoomWithPlayers("Route Player");
    const context = { params: Promise.resolve({ sessionId: room.sessionId }) };
    const unauthenticated = await getHostSession(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}`),
      context,
    );
    const authenticated = await getHostSession(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}`, {
        headers: { Authorization: `Bearer ${room.hostToken}` },
      }),
      context,
    );

    expect(unauthenticated.status).toBe(401);
    expect(authenticated.status).toBe(200);
    expect(authenticated.headers.get("cache-control")).toBe("no-store");
  });

  it("prevents one player from reading or answering for another", () => {
    const { room, players } = createRoomWithPlayers("Player One", "Player Two");
    const [first, second] = players;
    startTriviaLiveSession(room.sessionId, room.hostToken);

    expect(() => buildTriviaLivePlayerSnapshot(room.sessionId, second.playerId, first.playerToken)).toThrow(
      TriviaLiveAuthorizationError,
    );
    expect(() => submitTriviaLiveAnswer(room.sessionId, second.playerId, "A", first.playerToken)).toThrow(
      TriviaLiveAuthorizationError,
    );
  });

  it("uses non-predictable player identifiers and does not serialize token hashes", () => {
    const { room, players } = createRoomWithPlayers("Random ID Player");
    const [player] = players;
    const hostSnapshot = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    const playerSnapshot = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);

    expect(player.playerId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(hostSnapshot)).not.toContain("tokenHash");
    expect(JSON.stringify(playerSnapshot)).not.toContain("tokenHash");
    expect(JSON.stringify(hostSnapshot)).not.toContain(room.hostToken);
    expect(JSON.stringify(playerSnapshot)).not.toContain(player.playerToken);
  });
});

describe("legacy public trivia deck", () => {
  it("no longer exposes an answer-bearing deck", async () => {
    const response = await getPublicDeck();
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(410);
    expect(payload.error).toContain("no longer available");
  });
});
