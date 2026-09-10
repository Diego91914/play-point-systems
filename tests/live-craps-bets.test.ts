import { describe, expect, it } from "vitest";
import { createLiveCrapsBankrolls, placeLiveCrapsBet, settleLiveCrapsBets } from "../lib/play-point-core/live-craps-bets";

describe("Live Craps betting", () => {
  it("deducts a bet when placed and pays Pass Line natural 1:1", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a", "b"]), playerId: "a", kind: "pass-line", amount: 100, point: null, id: "b1" });
    expect(placed.bankrolls[0].chips).toBe(900);
    const settled = settleLiveCrapsBets({ ...placed, total: 7, pointBefore: null });
    expect(settled.bankrolls[0].chips).toBe(1100);
    expect(settled.bets).toHaveLength(0);
    expect(settled.settlements[0]).toMatchObject({ betId: "b1", status: "won", credit: 200, profit: 100, remainsWorking: false });
  });

  it("keeps a line bet working when a point is established", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "pass-line", amount: 100, point: null, id: "b1" });
    const settled = settleLiveCrapsBets({ ...placed, total: 6, pointBefore: null });
    expect(settled.bankrolls[0].chips).toBe(900);
    expect(settled.bets).toHaveLength(1);
    expect(settled.settlements[0].status).toBe("working");
  });

  it("pays a made Pass Line point and records loss on seven-out", () => {
    const bankrolls = [{ playerId: "a", chips: 900 }];
    const bet = [{ id: "b1", playerId: "a", kind: "pass-line" as const, amount: 100 }];
    const made = settleLiveCrapsBets({ bets: bet, bankrolls, total: 6, pointBefore: 6 });
    expect(made.bankrolls[0].chips).toBe(1100);
    expect(made.settlements[0].profit).toBe(100);
    const seven = settleLiveCrapsBets({ bets: bet, bankrolls, total: 7, pointBefore: 6 });
    expect(seven.bankrolls[0].chips).toBe(900);
    expect(seven.settlements[0].status).toBe("lost");
  });

  it("treats Don't Pass 12 as a recorded push on the come-out", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "dont-pass", amount: 100, point: null, id: "b1" });
    const settled = settleLiveCrapsBets({ ...placed, total: 12, pointBefore: null });
    expect(settled.bankrolls[0].chips).toBe(1000);
    expect(settled.settlements[0]).toMatchObject({ status: "push", credit: 100, profit: 0 });
  });

  it("settles Field every roll and emits a receipt", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "field", amount: 100, point: 6, id: "b1" });
    const win = settleLiveCrapsBets({ ...placed, total: 12, pointBefore: 6 });
    expect(win.bankrolls[0].chips).toBe(1200);
    expect(win.settlements[0]).toMatchObject({ status: "won", credit: 300, profit: 200 });
    const loss = settleLiveCrapsBets({ ...placed, total: 8, pointBefore: 6 });
    expect(loss.bankrolls[0].chips).toBe(900);
    expect(loss.settlements[0].status).toBe("lost");
  });

  it("pays Place 6 profit while leaving the original wager working", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "place", amount: 60, number: 6, point: 8, id: "b1" });
    const noChange = settleLiveCrapsBets({ ...placed, total: 5, pointBefore: 8 });
    expect(noChange.bets).toHaveLength(1);
    expect(noChange.settlements[0].status).toBe("working");
    const win = settleLiveCrapsBets({ ...placed, total: 6, pointBefore: 8 });
    expect(win.bankrolls[0].chips).toBe(1010); // 940 rack + 70 profit; $60 remains on the 6
    expect(win.bets).toHaveLength(1);
    expect(win.settlements[0]).toMatchObject({ status: "won", credit: 70, profit: 70, remainsWorking: true });
    const seven = settleLiveCrapsBets({ ...placed, total: 7, pointBefore: 8 });
    expect(seven.bankrolls[0].chips).toBe(940);
    expect(seven.settlements[0].status).toBe("lost");
  });

  it("keeps existing Place bets off through a come-out 7", () => {
    const bets = [
      { id: "six", playerId: "a", kind: "place" as const, amount: 60, number: 6 as const },
      { id: "eight", playerId: "a", kind: "place" as const, amount: 60, number: 8 as const },
    ];
    const settled = settleLiveCrapsBets({ bets, bankrolls: [{ playerId: "a", chips: 880 }], total: 7, pointBefore: null });
    expect(settled.bankrolls[0].chips).toBe(880);
    expect(settled.bets.map((bet) => bet.id)).toEqual(["six", "eight"]);
    expect(settled.settlements.map((item) => [item.betId, item.status, item.profit])).toEqual([
      ["six", "off", 0],
      ["eight", "off", 0],
    ]);
  });

  it("can represent simultaneous win, loss, and working wagers independently", () => {
    const bets = [
      { id: "field", playerId: "a", kind: "field" as const, amount: 10 },
      { id: "six", playerId: "a", kind: "place" as const, amount: 60, number: 6 as const },
      { id: "eight", playerId: "a", kind: "place" as const, amount: 60, number: 8 as const },
    ];
    const settled = settleLiveCrapsBets({ bets, bankrolls: [{ playerId: "a", chips: 870 }], total: 6, pointBefore: 8 });
    expect(settled.settlements.map((item) => [item.betId, item.status])).toEqual([["field", "lost"], ["six", "won"], ["eight", "working"]]);
    expect(settled.bets.map((bet) => bet.id)).toEqual(["six", "eight"]);
  });

  it("rejects bets larger than the player's fictional bankroll", () => {
    expect(() => placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "field", amount: 1001, point: null, id: "b1" })).toThrow(/not enough chips/i);
  });
});
