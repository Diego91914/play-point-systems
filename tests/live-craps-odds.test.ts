import { describe, expect, it } from "vitest";
import { liveCrapsDontOddsProfit, liveCrapsPassOddsProfit, maxLiveCrapsDontOdds, maxLiveCrapsPassOdds, placeLiveCrapsOdds, settleLiveCrapsOdds } from "../lib/play-point-core/live-craps-odds";

describe("Live Craps 3-4-5x odds", () => {
  it("uses 3x/4x/5x Pass and Come maximums", () => {
    expect(maxLiveCrapsPassOdds(10, 4)).toBe(30);
    expect(maxLiveCrapsPassOdds(10, 5)).toBe(40);
    expect(maxLiveCrapsPassOdds(10, 6)).toBe(50);
  });
  it("uses 6x lay maximum on Don't under 3-4-5x convention", () => expect(maxLiveCrapsDontOdds(10)).toBe(60));
  it("pays true odds on the do side", () => {
    expect(liveCrapsPassOddsProfit(30, 4)).toBe(60);
    expect(liveCrapsPassOddsProfit(40, 5)).toBe(60);
    expect(liveCrapsPassOddsProfit(50, 6)).toBe(60);
  });
  it("pays inverse true odds on the don't side", () => {
    expect(liveCrapsDontOddsProfit(60, 4)).toBe(30);
    expect(liveCrapsDontOddsProfit(60, 5)).toBe(40);
    expect(liveCrapsDontOddsProfit(60, 6)).toBe(50);
  });
  it("rejects odds above table maximum and settles a winning Pass odds bet", () => {
    const bankrolls = [{ playerId: "a", chips: 1000 }];
    expect(() => placeLiveCrapsOdds({ odds: [], bankrolls, id: "o1", playerId: "a", parentBetId: "p1", side: "pass", point: 6, lineAmount: 10, amount: 60 })).toThrow(/maximum/i);
    const placed = placeLiveCrapsOdds({ odds: [], bankrolls, id: "o1", playerId: "a", parentBetId: "p1", side: "pass", point: 6, lineAmount: 10, amount: 50 });
    const settled = settleLiveCrapsOdds({ ...placed, total: 6 });
    expect(settled.bankrolls[0].chips).toBe(1060);
    expect(settled.settlements[0]).toMatchObject({ status: "won", stake: 50, credit: 110, profit: 60 });
  });
});
