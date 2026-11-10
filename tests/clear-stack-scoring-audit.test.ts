import { describe, expect, it } from "vitest";
import {
  initialStackState,
  normalizeStackState,
  scoreStack,
  startStack,
  type StackState,
} from "@/lib/play-point-core/clear-stack-engine";
import { readFileSync } from "node:fs";

function playSet(state: StackState, makesByRound: number[][]): StackState {
  const set = state.currentSet;
  while (state.phase === "playing" && state.currentSet === set) {
    const playerIndex = state.turn;
    const player = state.players[playerIndex];
    const makes = makesByRound[state.round]?.[playerIndex] ?? 0;
    state = scoreStack(state, Math.min(makes, player.remaining));
  }
  return state;
}

describe("Clear the Stack scoring audit", () => {
  it("reproduces the three-player screenshot: cumulative ranking and tied Set 2", () => {
    let state = startStack(initialStackState(20, 5), ["Channing", "Gary", "Gianna"], 20, 5,
      { mode: "points", setsToPlay: 3 });

    // Set 1 totals: 5, 6, 8. Gianna wins the set.
    state = playSet(state, [[0, 1, 3], [5, 4, 2], [0, 0, 0]]);
    expect(state.setResults[0]).toEqual({ set: 1, scores: [5, 6, 8], winnerIndex: 2, tied: false });
    expect(state.setsWon).toEqual([0, 0, 1]);

    // Set 2 totals: 4, 4, 4. A tie awards no set win.
    state = playSet(state, [[0, 0, 0], [3, 3, 3], [2, 2, 2]]);
    expect(state.setResults[1]).toEqual({ set: 2, scores: [4, 4, 4], winnerIndex: null, tied: true });
    expect(state.setsWon).toEqual([0, 0, 1]);
    expect(state.players.map(player => player.score)).toEqual([9, 10, 12]);
    expect(state.currentSet).toBe(3);
    expect(state.round).toBe(0);
    expect(state.phase).toBe("playing");
  });

  it.each([0, 1, 2, 3, 4, 5])("carries %i remaining disc(s) forward without inventing a fourth round", remaining => {
    let state = startStack(initialStackState(20, 5), ["Gary"], 20, 5);
    state = scoreStack(state, 5 - remaining);

    if (remaining === 0) {
      expect(state.phase).toBe("finished");
      expect(state.players[0].rounds).toEqual([5, 0, 0]);
    } else {
      expect(state.phase).toBe("playing");
      expect(state.round).toBe(1);
      expect(state.players[0].remaining).toBe(remaining);
      state = scoreStack(state, 0);
      expect(state.round).toBe(2);
      expect(state.players[0].remaining).toBe(remaining);
      state = scoreStack(state, 0);
      expect(state.phase).toBe("finished");
      expect(state.players[0].rounds).toHaveLength(3);
      expect(state.players[0].rounds[2]).toBe(0);
    }
    expect(state.players[0].rounds).toHaveLength(3);
    expect(state.players[0].remaining).toBe(remaining);
    expect(state.players[0].score).toBe(10 - 4 * remaining);
    expect(() => scoreStack(state, 0)).toThrow(/not in progress/);
  });

  it("pads rounds when all stacks clear early and clamps a corrupt persisted cursor", () => {
    let state = startStack(initialStackState(20, 5), ["A", "B", "C"], 20, 5,
      { mode: "points", setsToPlay: 1 });
    state = playSet(state, [[5, 5, 5], [0, 0, 0], [0, 0, 0]]);
    expect(state.phase).toBe("finished");
    expect(state.setResults).toHaveLength(1);
    expect(state.players.every(player => player.rounds.length === 3)).toBe(true);

    const normalized = normalizeStackState({ ...state, phase: "playing", round: 3 }, 20, 5);
    expect(normalized.round).toBe(2);
    expect(() => scoreStack({ ...normalized, round: 3 }, 0)).toThrow(/round is invalid/);
  });

  it("makes the live and spectator views prioritize completed sets and cumulative multiplayer standings", () => {
    const host = readFileSync("app/games/clear-the-stack/ClearTheStackClient.tsx", "utf8");
    const spectator = readFileSync("app/games/clear-the-stack/join/[code]/ClearStackJoinClient.tsx", "utf8");
    expect(host).toContain("Completed sets");
    expect(host).toContain("Cumulative standings · current set points");
    expect(spectator).toContain("Cumulative standings · current set points");
    expect(spectator).toContain("Completed sets");
    expect(host).toContain("This disc carried forward from Round");
    expect(spectator).toContain("carried forward from Round");
  });
});
