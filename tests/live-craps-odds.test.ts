import { describe, expect, it } from "vitest";
import { liveCrapsDontOddsProfit, liveCrapsPassOddsProfit, maxLiveCrapsDontOdds, maxLiveCrapsPassOdds, placeLiveCrapsOdds, setLiveCrapsOddsWorkingOverride, settleLiveCrapsOdds } from "../lib/play-point-core/live-craps-odds";

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
  it("allows repeated odds additions on one parent while enforcing the aggregate maximum", () => {
    const bankrolls = [{ playerId: "a", chips: 1000 }];
    const first = placeLiveCrapsOdds({ odds: [], bankrolls, id: "o1", playerId: "a", parentBetId: "c9", parentKind: "come", side: "pass", point: 9, lineAmount: 10, amount: 20 });
    const second = placeLiveCrapsOdds({ odds: first.odds, bankrolls: first.bankrolls, id: "o2", playerId: "a", parentBetId: "c9", parentKind: "come", side: "pass", point: 9, lineAmount: 10, amount: 20 });
    expect(second.odds.filter((bet) => bet.parentBetId === "c9").reduce((sum, bet) => sum + bet.amount, 0)).toBe(40);
    expect(second.bankrolls[0].chips).toBe(960);
    expect(() => placeLiveCrapsOdds({ odds: second.odds, bankrolls: second.bankrolls, id: "o3", playerId: "a", parentBetId: "c9", parentKind: "come", side: "pass", point: 9, lineAmount: 10, amount: 5 })).toThrow(/maximum/i);
    expect(() => placeLiveCrapsOdds({ odds: [], bankrolls, id: "bad", playerId: "a", parentBetId: "dc5", parentKind: "dont-come", side: "pass", point: 5, lineAmount: 10, amount: 10 })).toThrow(/does not match/i);
  });
  it("keeps Come odds off by default on a table come-out and allows the owner to call them on", () => {
    const bankrolls = [{ playerId: "a", chips: 1000 }];
    const placed = placeLiveCrapsOdds({ odds: [], bankrolls, id: "o1", playerId: "a", parentBetId: "c9", parentKind: "come", side: "pass", point: 9, lineAmount: 10, amount: 20 });
    const off = settleLiveCrapsOdds({ ...placed, total: 7, tablePointBefore: null });
    expect(off.settlements[0].status).toBe("off");
    expect(off.odds).toHaveLength(1);
    const calledOn = setLiveCrapsOddsWorkingOverride({ odds: placed.odds, playerId: "a", betId: "o1", workingOverride: "on" });
    const lost = settleLiveCrapsOdds({ odds: calledOn, bankrolls: placed.bankrolls, total: 7, tablePointBefore: null });
    expect(lost.settlements[0].status).toBe("lost");
  });
  it("keeps Don't Come odds on by default during a table come-out", () => {
    const placed = placeLiveCrapsOdds({ odds: [], bankrolls: [{ playerId: "a", chips: 1000 }], id: "o1", playerId: "a", parentBetId: "dc5", parentKind: "dont-come", side: "dont-pass", point: 5, lineAmount: 10, amount: 60 });
    const won = settleLiveCrapsOdds({ ...placed, total: 7, tablePointBefore: null });
    expect(won.settlements[0]).toMatchObject({ status: "won", profit: 40 });
  });
  it("rejects odds above table maximum and settles a winning Pass odds bet", () => {
    const bankrolls = [{ playerId: "a", chips: 1000 }];
    expect(() => placeLiveCrapsOdds({ odds: [], bankrolls, id: "o1", playerId: "a", parentBetId: "p1", parentKind: "pass-line", side: "pass", point: 6, lineAmount: 10, amount: 60 })).toThrow(/maximum/i);
    const placed = placeLiveCrapsOdds({ odds: [], bankrolls, id: "o1", playerId: "a", parentBetId: "p1", parentKind: "pass-line", side: "pass", point: 6, lineAmount: 10, amount: 50 });
    const settled = settleLiveCrapsOdds({ ...placed, total: 6, tablePointBefore: 6 });
    expect(settled.bankrolls[0].chips).toBe(1060);
    expect(settled.settlements[0]).toMatchObject({ status: "won", stake: 50, credit: 110, profit: 60 });
  });
});
