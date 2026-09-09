import { describe, expect, it } from "vitest";
import { settleLiveCrapsPropBet, validateLiveCrapsPropBet } from "../lib/play-point-core/live-craps-props";

const bet = (kind: any, amount = 1) => ({ id: `b-${kind}`, playerId: "p1", kind, amount });

describe("Live Craps center propositions", () => {
  it("settles standard one-roll proposition payouts", () => {
    expect(settleLiveCrapsPropBet(bet("any-seven", 5), 3, 4).profit).toBe(20);
    expect(settleLiveCrapsPropBet(bet("any-craps", 5), 1, 2).profit).toBe(35);
    expect(settleLiveCrapsPropBet(bet("two", 2), 1, 1).profit).toBe(60);
    expect(settleLiveCrapsPropBet(bet("three", 2), 1, 2).profit).toBe(30);
    expect(settleLiveCrapsPropBet(bet("eleven", 2), 5, 6).profit).toBe(30);
    expect(settleLiveCrapsPropBet(bet("twelve", 2), 6, 6).profit).toBe(60);
  });

  it("resolves every proposition on one roll", () => {
    const result = settleLiveCrapsPropBet(bet("eleven", 10), 3, 4);
    expect(result.status).toBe("lost");
    expect(result.credit).toBe(0);
    expect(result.profit).toBe(-10);
  });

  it("splits Horn into equal 2, 3, 11, and 12 units", () => {
    expect(settleLiveCrapsPropBet(bet("horn", 4), 6, 6).profit).toBe(27);
    expect(settleLiveCrapsPropBet(bet("horn", 4), 5, 6).profit).toBe(12);
    expect(settleLiveCrapsPropBet(bet("horn", 4), 3, 4).profit).toBe(-4);
  });

  it("splits C&E equally between Any Craps and Eleven", () => {
    expect(settleLiveCrapsPropBet(bet("ce", 2), 1, 2).profit).toBe(6);
    expect(settleLiveCrapsPropBet(bet("ce", 2), 5, 6).profit).toBe(14);
    expect(settleLiveCrapsPropBet(bet("ce", 2), 3, 4).profit).toBe(-2);
  });

  it("requires combination-friendly Standard Table units", () => {
    expect(() => validateLiveCrapsPropBet(bet("horn", 5))).toThrow(/4-chip/i);
    expect(() => validateLiveCrapsPropBet(bet("ce", 3))).toThrow(/2-chip/i);
  });

  it("rejects World/Whirl because it is outside the Standard Table", () => {
    expect(() => validateLiveCrapsPropBet(bet("world", 5))).toThrow();
  });
});
