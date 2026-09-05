import { describe, expect, it } from "vitest";
import {
  BLACKWOOD_CASE_VARIANTS,
  resolveBlackwoodVariant,
} from "../lib/play-point-core/mystery-case-variants";
import {
  expectedBlackwoodInvestigationTurns,
  simulateBlackwoodFairness,
} from "../lib/play-point-core/blackwood-simulation";
import { getBlackwoodVariantContent } from "../lib/play-point-core/mystery-variant-content";
import { BLACKWOOD_MINIMUM_PROOF_PLANS } from "../lib/play-point-core/mystery-fairness";

const paths = [
  { letter: "open", voice: "listen", expected: "blackwood-old-friend" },
  { letter: "open", voice: "leave", expected: "blackwood-younger-sister" },
  { letter: "seal", voice: "listen", expected: "blackwood-private-chef" },
  { letter: "seal", voice: "leave", expected: "blackwood-business-partner" },
] as const;

describe("Blackwood release readiness contract", () => {
  it("keeps the authored 2x2 branch matrix stable", () => {
    for (const path of paths) {
      const signals = {
        adrian_sealed_letter: path.letter,
        adrian_voice_draft: path.voice,
      };
      const authored = [...BLACKWOOD_CASE_VARIANTS]
        .sort((a, b) => b.branchFit(signals) - a.branchFit(signals))[0];
      expect(authored.id).toBe(path.expected);
    }
  });

  it.each(BLACKWOOD_CASE_VARIANTS)("$id has a complete case contract", variant => {
    const proofPlan = BLACKWOOD_MINIMUM_PROOF_PLANS.find(plan => plan.variantId === variant.id);
    expect(proofPlan, `${variant.id} needs a minimum proof plan`).toBeTruthy();
    expect(proofPlan?.supportIds).toHaveLength(2);
    expect(variant.correctSupportIds.length).toBeGreaterThanOrEqual(4);
    expect(new Set(variant.correctSupportIds).size).toBe(variant.correctSupportIds.length);

    if (variant.id !== "blackwood-old-friend") {
      const content = getBlackwoodVariantContent(variant.id);
      expect(content, `${variant.id} needs authored variant content`).not.toBeNull();
      expect(content?.culpritRoleId).toBe(variant.culpritRoleId);
      expect(content?.evidence.length).toBeGreaterThanOrEqual(4);
      const ruleIds = new Set(content?.supportRules.map(rule => rule.id));
      for (const id of variant.correctSupportIds) expect(ruleIds.has(id)).toBe(true);
    }
  });

  it.each(BLACKWOOD_CASE_VARIANTS)("$id is solvable with both 4 and 8 players", variant => {
    for (const playerCount of [4, 8]) {
      const scenario = simulateBlackwoodFairness(playerCount, variant.id);
      expect(scenario.allInnocentsCanReachMinimumProof).toBe(true);
      expect(scenario.optionalRolesRequiredForSolution).toBe(false);
      expect(scenario.seats.filter(seat => !seat.isCulprit).every(seat => seat.proofTurnsNeeded <= seat.personalTurnsAvailable)).toBe(true);
    }
  });

  it("keeps the investigation at four evidence rounds for every supported room size", () => {
    for (const playerCount of [4, 5, 6, 7, 8]) {
      const turns = expectedBlackwoodInvestigationTurns(playerCount);
      expect(turns).toBeGreaterThanOrEqual(playerCount * 4);
      expect(turns % 4).toBe(0);
    }
  });

  it("never live-selects an unreleased branch", () => {
    for (const path of paths) {
      const resolved = resolveBlackwoodVariant({
        adrian_sealed_letter: path.letter,
        adrian_voice_draft: path.voice,
      });
      expect(resolved?.releaseReady).toBe(true);
    }
  });
});
