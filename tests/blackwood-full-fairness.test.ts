import { describe, expect, it } from "vitest";
import { auditAllBlackwoodFairness, expectedBlackwoodInvestigationTurns, simulateBlackwoodFairness } from "../lib/play-point-core/blackwood-simulation";
import { BLACKWOOD_CASE_VARIANTS } from "../lib/play-point-core/mystery-case-variants";

describe("Blackwood complete fairness audit", () => {
  it("gives every innocent seat a two-link conviction path at 4–8 players", () => {
    const scenarios = auditAllBlackwoodFairness();
    expect(scenarios).toHaveLength(BLACKWOOD_CASE_VARIANTS.length * 5);

    for (const scenario of scenarios) {
      expect(scenario.allInnocentsCanReachMinimumProof, `${scenario.variantId} at ${scenario.playerCount} players`).toBe(true);
      for (const seat of scenario.seats.filter(item => !item.isCulprit)) {
        expect(seat.proofSupportIds.length, `${scenario.variantId}/${scenario.playerCount}/${seat.roleId}`).toBeGreaterThanOrEqual(2);
        expect(seat.proofTurnsNeeded).toBeLessThanOrEqual(seat.personalTurnsAvailable);
      }
    }
  });

  it("never requires an optional 5th–8th role to solve any authored truth", () => {
    for (const scenario of auditAllBlackwoodFairness()) {
      expect(scenario.optionalRolesRequiredForSolution, `${scenario.variantId} at ${scenario.playerCount} players`).toBe(false);
      expect(scenario.seats.some(seat => seat.requiresOptionalRole)).toBe(false);
    }
  });

  it("preserves four personal investigation turns for every seat regardless of table size", () => {
    for (const playerCount of [4, 5, 6, 7, 8]) {
      const scenario = simulateBlackwoodFairness(playerCount, "blackwood-old-friend");
      expect(scenario.seats.every(seat => seat.personalTurnsAvailable === 4)).toBe(true);
      expect(expectedBlackwoodInvestigationTurns(playerCount)).toBe(playerCount * 4);
    }
  });

  it("leaves discretionary room after the two-link minimum proof path", () => {
    for (const scenario of auditAllBlackwoodFairness()) {
      for (const seat of scenario.seats.filter(item => !item.isCulprit)) {
        expect(seat.personalTurnsAvailable - seat.proofTurnsNeeded).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
