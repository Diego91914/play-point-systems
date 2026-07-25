import { describe, expect, it } from "vitest";
import {
  buildTriviaLiveHostSnapshot,
  buildTriviaLivePlayerSnapshot,
  createTriviaLiveSession,
  joinTriviaLiveSession,
  resolveTriviaLiveQuestion,
  startTriviaLiveSession,
  submitTriviaLiveAnswer,
} from "../app/games/trivia/play/trivia-live-session";

describe("live trivia teams", () => {
  it("assigns joiners evenly and rolls individual scores into team standings", () => {
    const room = createTriviaLiveSession("bible", "mixed", "standard", "teams", 3);
    const players = ["Olivia", "Noah", "Mia", "Liam", "Ava"].map((name) => joinTriviaLiveSession(room.roomCode, name));
    const lobby = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);

    expect(lobby.gameMode).toBe("teams");
    expect(lobby.teamCount).toBe(3);
    expect(lobby.players.map((player) => player.teamId)).toEqual(["blue", "gold", "red", "blue", "gold"]);
    expect(lobby.teamLeaderboard.map((team) => [team.id, team.playerCount])).toEqual([["blue", 2], ["gold", 2], ["red", 1]]);

    startTriviaLiveSession(room.sessionId, room.hostToken);
    const open = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    const correctSlot = open.currentCard!.choices.find((choice) => choice.isCorrect)!.slot;
    submitTriviaLiveAnswer(room.sessionId, players[0].playerId, correctSlot, players[0].playerToken);
    resolveTriviaLiveQuestion(room.sessionId, room.hostToken);

    const resolved = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    expect(resolved.teamLeaderboard[0]).toMatchObject({ id: "blue", score: 500 });
    expect(resolved.teamLeaderboard[1]).toMatchObject({ id: "gold", score: 0 });

    const playerView = buildTriviaLivePlayerSnapshot(room.sessionId, players[1].playerId, players[1].playerToken);
    expect(playerView.player.teamId).toBe("gold");
    expect(playerView.teamCount).toBe(3);
    expect(playerView.teamLeaderboard).toEqual(resolved.teamLeaderboard);
  });

  it("keeps individual rooms free of team assignments", () => {
    const room = createTriviaLiveSession("bible", "mixed", "standard", "individual");
    const player = joinTriviaLiveSession(room.roomCode, "Solo Player");
    const snapshot = buildTriviaLivePlayerSnapshot(room.sessionId, player.playerId, player.playerToken);

    expect(snapshot.gameMode).toBe("individual");
    expect(snapshot.player.teamId).toBeNull();
    expect(snapshot.teamLeaderboard).toEqual([]);
  });

  it("rejects team counts outside the supported range", () => {
    expect(() => createTriviaLiveSession("bible", "mixed", "standard", "teams", 1)).toThrow("between 2 and 8");
    expect(() => createTriviaLiveSession("bible", "mixed", "standard", "teams", 9)).toThrow("between 2 and 8");
  });

  it("supports a host-selected team count and waits until every team can have a player", () => {
    const room = createTriviaLiveSession("bible", "mixed", "standard", "teams", 4);
    joinTriviaLiveSession(room.roomCode, "First");
    expect(buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken).canStart).toBe(false);

    joinTriviaLiveSession(room.roomCode, "Second");
    joinTriviaLiveSession(room.roomCode, "Third");
    expect(buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken).canStart).toBe(false);

    joinTriviaLiveSession(room.roomCode, "Fourth");
    const ready = buildTriviaLiveHostSnapshot(room.sessionId, "https://example.com", room.hostToken);
    expect(ready.canStart).toBe(true);
    expect(ready.teamCount).toBe(4);
    expect(ready.players.map((player) => player.teamId)).toEqual(["blue", "gold", "red", "green"]);
  });
});
