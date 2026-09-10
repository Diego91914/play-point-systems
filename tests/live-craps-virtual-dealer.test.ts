import { describe, expect, it } from "vitest";
import { createLiveCrapsBankrolls } from "../lib/play-point-core/live-craps-bets";
import { nextLiveCrapsPressTargets, planLiveCrapsPress } from "../lib/play-point-core/live-craps-virtual-dealer";

describe("Live Craps virtual dealer", () => {
  it("uses payout first and pulls only the balance from bankroll", () => {
    const bankrolls = createLiveCrapsBankrolls(["p1"], 100);
    const plan = planLiveCrapsPress({ bankrolls, playerId: "p1", number: 6, currentBet: 30, targetBet: 48, payoutAvailable: 14 });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.funding.payoutUsed).toBe(14);
    expect(plan.funding.bankrollUsed).toBe(4);
    expect(plan.bankrolls[0].chips).toBe(96);
  });

  it("returns leftover payout to collect when the payout exceeds the press", () => {
    const plan = planLiveCrapsPress({ bankrolls: createLiveCrapsBankrolls(["p1"], 100), playerId: "p1", number: 5, currentBet: 25, targetBet: 30, payoutAvailable: 35 });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.funding.payoutUsed).toBe(5);
    expect(plan.funding.bankrollUsed).toBe(0);
    expect(plan.funding.collectRemainder).toBe(30);
  });

  it("offers the largest legal affordable target when bankroll is short", () => {
    const plan = planLiveCrapsPress({ bankrolls: createLiveCrapsBankrolls(["p1"], 2), playerId: "p1", number: 6, currentBet: 30, targetBet: 48, payoutAvailable: 10 });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.largestAffordableTarget).toBe(42);
    expect(plan.additionalNeeded).toBe(6);
  });

  it("rejects press targets that are not payout-friendly units", () => {
    expect(() => planLiveCrapsPress({ bankrolls: createLiveCrapsBankrolls(["p1"]), playerId: "p1", number: 6, currentBet: 30, targetBet: 35, payoutAvailable: 10 })).toThrow(/6-chip units/i);
  });

  it("generates one-unit and double targets", () => {
    expect(nextLiveCrapsPressTargets(6, 30)).toEqual([36, 60]);
    expect(nextLiveCrapsPressTargets(5, 25)).toEqual([30, 50]);
  });
});
