import { describe, expect, it } from "vitest";
import { createLiveCrapsBankrolls, placeLiveCrapsBet, settleLiveCrapsBets } from "../lib/play-point-core/live-craps-bets";

describe("Live Craps betting", () => {
  it("deducts a bet when placed and pays Pass Line natural 1:1", () => {
    let bankrolls = createLiveCrapsBankrolls(["a", "b"]);
    const placed = placeLiveCrapsBet({ bets: [], bankrolls, playerId: "a", kind: "pass-line", amount: 100, point: null, id: "b1" });
    expect(placed.bankrolls[0].chips).toBe(900);
    const settled = settleLiveCrapsBets({ ...placed, total: 7, pointBefore: null });
    expect(settled.bankrolls[0].chips).toBe(1100);
    expect(settled.bets).toHaveLength(0);
  });

  it("keeps a line bet working when a point is established", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "pass-line", amount: 100, point: null, id: "b1" });
    const settled = settleLiveCrapsBets({ ...placed, total: 6, pointBefore: null });
    expect(settled.bankrolls[0].chips).toBe(900);
    expect(settled.bets).toHaveLength(1);
  });

  it("pays a made Pass Line point and loses it on seven-out", () => {
    const bankrolls = [{ playerId: "a", chips: 900 }];
    const bet = [{ id: "b1", playerId: "a", kind: "pass-line" as const, amount: 100 }];
    expect(settleLiveCrapsBets({ bets: bet, bankrolls, total: 6, pointBefore: 6 }).bankrolls[0].chips).toBe(1100);
    expect(settleLiveCrapsBets({ bets: bet, bankrolls, total: 7, pointBefore: 6 }).bankrolls[0].chips).toBe(900);
  });

  it("treats Don't Pass 12 as a push on the come-out", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "dont-pass", amount: 100, point: null, id: "b1" });
    const settled = settleLiveCrapsBets({ ...placed, total: 12, pointBefore: null });
    expect(settled.bankrolls[0].chips).toBe(1000);
  });

  it("settles Field every roll including double payout on 2 and 12", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "field", amount: 100, point: 6, id: "b1" });
    expect(settleLiveCrapsBets({ ...placed, total: 12, pointBefore: 6 }).bankrolls[0].chips).toBe(1200);
    expect(settleLiveCrapsBets({ ...placed, total: 8, pointBefore: 6 }).bankrolls[0].chips).toBe(900);
  });

  it("keeps Place bets working until their number hits or seven-out", () => {
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "place", amount: 60, number: 6, point: 8, id: "b1" });
    const noChange = settleLiveCrapsBets({ ...placed, total: 5, pointBefore: 8 });
    expect(noChange.bets).toHaveLength(1);
    const win = settleLiveCrapsBets({ ...placed, total: 6, pointBefore: 8 });
    expect(win.bankrolls[0].chips).toBe(1070); // 940 + 60 stake + 70 profit
    expect(win.bets).toHaveLength(0);
    expect(settleLiveCrapsBets({ ...placed, total: 7, pointBefore: 8 }).bankrolls[0].chips).toBe(940);
  });

  it("rejects bets larger than the player's fictional bankroll", () => {
    expect(() => placeLiveCrapsBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), playerId: "a", kind: "field", amount: 1001, point: null, id: "b1" })).toThrow(/not enough chips/i);
  });
});
