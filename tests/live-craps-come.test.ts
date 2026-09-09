import { describe, expect, it } from "vitest";
import { createLiveCrapsBankrolls } from "../lib/play-point-core/live-craps-bets";
import { placeLiveCrapsComeBet, settleLiveCrapsComeBets } from "../lib/play-point-core/live-craps-come";

describe("Live Craps Come / Don't Come", () => {
  it("requires the main table point to be established", () => {
    expect(() => placeLiveCrapsComeBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "come", amount: 10, tablePoint: null, id: "c1" })).toThrow(/established table point/i);
  });

  it("wins a fresh Come bet on 7 or 11 and loses on craps", () => {
    const placed = placeLiveCrapsComeBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "come", amount: 10, tablePoint: 6, id: "c1" });
    expect(settleLiveCrapsComeBets({ ...placed, total: 11 }).bankrolls[0].chips).toBe(1010);
    expect(settleLiveCrapsComeBets({ ...placed, total: 3 }).settlements[0].status).toBe("lost");
  });

  it("moves a Come bet to its own point independently of the table point", () => {
    const placed = placeLiveCrapsComeBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "come", amount: 10, tablePoint: 6, id: "c1" });
    const moved = settleLiveCrapsComeBets({ ...placed, total: 9 });
    expect(moved.bets[0].point).toBe(9);
    expect(moved.settlements[0].status).toBe("point-established");
    const win = settleLiveCrapsComeBets({ bets: moved.bets, bankrolls: moved.bankrolls, total: 9 });
    expect(win.bankrolls[0].chips).toBe(1010);
    expect(win.bets).toHaveLength(0);
  });

  it("supports multiple independent Come points", () => {
    const bets = [
      { id: "c6", playerId: "a", kind: "come" as const, amount: 10, point: 6 as const },
      { id: "c9", playerId: "a", kind: "come" as const, amount: 10, point: 9 as const },
    ];
    const result = settleLiveCrapsComeBets({ bets, bankrolls: [{ playerId: "a", chips: 980 }], total: 6 });
    expect(result.settlements.map((r) => [r.betId, r.status])).toEqual([["c6", "won"], ["c9", "working"]]);
    expect(result.bets.map((b) => b.id)).toEqual(["c9"]);
  });

  it("uses Bar 12 for Don't Come: 2/3 win, 12 push, 7/11 lose", () => {
    const make = () => placeLiveCrapsComeBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "dont-come" as const, amount: 10, tablePoint: 8 as const, id: "d1" });
    expect(settleLiveCrapsComeBets({ ...make(), total: 2 }).settlements[0].status).toBe("won");
    expect(settleLiveCrapsComeBets({ ...make(), total: 12 }).settlements[0].status).toBe("push");
    expect(settleLiveCrapsComeBets({ ...make(), total: 7 }).settlements[0].status).toBe("lost");
  });

  it("wins an established Don't Come on 7 and loses when its number repeats", () => {
    const bet = [{ id: "d1", playerId: "a", kind: "dont-come" as const, amount: 10, point: 5 as const }];
    expect(settleLiveCrapsComeBets({ bets: bet, bankrolls: [{ playerId: "a", chips: 990 }], total: 7 }).settlements[0].status).toBe("won");
    expect(settleLiveCrapsComeBets({ bets: bet, bankrolls: [{ playerId: "a", chips: 990 }], total: 5 }).settlements[0].status).toBe("lost");
  });
});
