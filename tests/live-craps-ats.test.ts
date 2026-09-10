import { describe, expect, it } from "vitest";
import { createLiveCrapsAtsState, getLiveCrapsAtsProgress, liveCrapsAtsCredit, placeLiveCrapsAtsBet, recordLiveCrapsAtsRoll } from "../lib/play-point-core/live-craps-ats";

describe("Live Craps Small Tall All", () => {
  it("tracks unique Small and Tall numbers across a shooter's hand", () => {
    let state = createLiveCrapsAtsState("shooter");
    for (const total of [2, 4, 4, 8, 12]) state = recordLiveCrapsAtsRoll(state, total).state;
    const progress = getLiveCrapsAtsProgress(state);
    expect(progress.small.filter((item) => item.covered).map((item) => item.number)).toEqual([2, 4]);
    expect(progress.tall.filter((item) => item.covered).map((item) => item.number)).toEqual([8, 12]);
    expect(progress.allCovered).toBe(4);
  });

  it("pays Small at 34 to 1 and removes only the completed Small wager", () => {
    let state = createLiveCrapsAtsState("shooter");
    state = placeLiveCrapsAtsBet(state, { id: "s", playerId: "a", kind: "small", amount: 5 });
    state = placeLiveCrapsAtsBet(state, { id: "a", playerId: "a", kind: "all", amount: 5 });
    let result = { state, wins: [] as any[], losses: [] as any[] };
    for (const total of [2, 3, 4, 5, 6]) result = recordLiveCrapsAtsRoll(result.state, total);
    expect(result.wins.map((bet) => bet.kind)).toEqual(["small"]);
    expect(liveCrapsAtsCredit(result.wins[0])).toBe(175); // $5 stake + $170 profit
    expect(result.state.bets.map((bet) => bet.kind)).toEqual(["all"]);
  });

  it("pays Tall at 34 to 1", () => {
    let state = placeLiveCrapsAtsBet(createLiveCrapsAtsState("shooter"), { id: "t", playerId: "a", kind: "tall", amount: 2 });
    let result = { state, wins: [] as any[], losses: [] as any[] };
    for (const total of [8, 9, 10, 11, 12]) result = recordLiveCrapsAtsRoll(result.state, total);
    expect(result.wins[0].kind).toBe("tall");
    expect(liveCrapsAtsCredit(result.wins[0])).toBe(70);
  });

  it("pays Make 'Em All at 175 to 1 after all ten numbers", () => {
    let state = placeLiveCrapsAtsBet(createLiveCrapsAtsState("shooter"), { id: "all", playerId: "a", kind: "all", amount: 1 });
    let result = { state, wins: [] as any[], losses: [] as any[] };
    for (const total of [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]) result = recordLiveCrapsAtsRoll(result.state, total);
    expect(result.wins[0].kind).toBe("all");
    expect(liveCrapsAtsCredit(result.wins[0])).toBe(176);
  });

  it("a seven loses every unfinished ATS wager and clears the tracker", () => {
    let state = createLiveCrapsAtsState("shooter");
    state = placeLiveCrapsAtsBet(state, { id: "s", playerId: "a", kind: "small", amount: 1 });
    state = placeLiveCrapsAtsBet(state, { id: "t", playerId: "a", kind: "tall", amount: 1 });
    state = recordLiveCrapsAtsRoll(state, 2).state;
    state = recordLiveCrapsAtsRoll(state, 8).state;
    const result = recordLiveCrapsAtsRoll(state, 7);
    expect(result.losses).toHaveLength(2);
    expect(result.state.covered).toEqual([]);
    expect(result.state.bets).toEqual([]);
  });

  it("does not reopen ATS betting after the shooter's first non-seven roll", () => {
    let state = recordLiveCrapsAtsRoll(createLiveCrapsAtsState("shooter"), 6).state;
    expect(() => placeLiveCrapsAtsBet(state, { id: "late", playerId: "a", kind: "small", amount: 1 })).toThrow(/close/i);
  });
});
