import { describe, expect, it } from "vitest";
import { BLACKWOOD_CASE_VARIANTS } from "../lib/play-point-core/mystery-case-variants";
import { getBlackwoodVariantContent } from "../lib/play-point-core/mystery-variant-content";
import { BLACKWOOD_MINIMUM_PROOF_PLANS } from "../lib/play-point-core/mystery-fairness";
import { minimumInvestigatorTurnsPerPlayer } from "../lib/play-point-core/mystery-pacing";

const oldFriendEvidenceLevel: Record<string, number> = {
  bathroom_alibi_break: 2,
  whiskey_cleanup_link: 1,
  porch_route_link: 2,
  ledger_old_friend_link: 3,
};

describe("Blackwood minimum-player conviction fairness", () => {
  it("gives every authored variant an explicit two-link minimum proof plan", () => {
    expect(BLACKWOOD_MINIMUM_PROOF_PLANS).toHaveLength(BLACKWOOD_CASE_VARIANTS.length);
    expect(new Set(BLACKWOOD_MINIMUM_PROOF_PLANS.map(plan => plan.variantId)).size).toBe(BLACKWOOD_CASE_VARIANTS.length);
  });

  it.each(BLACKWOOD_CASE_VARIANTS)("$id minimum proof plan uses real, correct support links", variant => {
    const plan = BLACKWOOD_MINIMUM_PROOF_PLANS.find(item => item.variantId === variant.id);
    expect(plan).toBeTruthy();
    expect(plan?.supportIds).toHaveLength(2);
    for (const id of plan!.supportIds) expect(variant.correctSupportIds).toContain(id);
  });

  it.each(BLACKWOOD_CASE_VARIANTS)("$id minimum proof path is available by Evidence 3 or earlier", variant => {
    const plan = BLACKWOOD_MINIMUM_PROOF_PLANS.find(item => item.variantId === variant.id)!;
    if (variant.id === "blackwood-old-friend") {
      for (const id of plan.supportIds) expect(oldFriendEvidenceLevel[id]).toBeLessThanOrEqual(2);
      return;
    }
    const content = getBlackwoodVariantContent(variant.id)!;
    for (const id of plan.supportIds) {
      const rule = content.supportRules.find(item => item.id === id);
      expect(rule).toBeTruthy();
      expect(rule!.minEvidence).toBeLessThanOrEqual(2);
      expect(rule!.targetRoles.some(role => ["murderer", "partner", "sister", "chef"].includes(role))).toBe(true);
    }
  });

  it.each([4, 5, 6, 7, 8])("%i-player pacing leaves room for two proof questions plus at least one discretionary turn", players => {
    expect(minimumInvestigatorTurnsPerPlayer(players)).toBeGreaterThanOrEqual(3);
  });
});
