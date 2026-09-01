import { describe, expect, it } from "vitest";
import { applyMysteryFollowupLabels } from "../lib/play-point-core/mystery-followups";
import { getVariantAnswerOverride } from "../lib/play-point-core/mystery-variant-runtime";

function label(questionId: string, evidenceIndex: number) {
  return applyMysteryFollowupLabels(
    [{ id: questionId, label: "fallback" }],
    {
      viewerId: "viewer",
      targetId: "chef-player",
      targetRoleId: "chef",
      variantId: "blackwood-private-chef",
      evidenceIndex,
      asked: [],
    },
  )[0].label;
}

describe("Private Chef financial reveal timing", () => {
  it("does not spoil household-account evidence before the final financial card", () => {
    for (const evidenceIndex of [0, 1, 2]) {
      for (const questionId of ["money", "old_money", "ledger", "ledger_entry", "final_pressure"]) {
        expect(label(questionId, evidenceIndex)).not.toMatch(/household|account charges|service accounts/i);
      }
    }
  });

  it("allows financial followups to sharpen after the household-charge evidence is revealed", () => {
    expect(label("money", 3)).toMatch(/household-account/i);
    expect(label("ledger", 3)).toMatch(/household-account charges/i);
    expect(label("final_pressure", 3)).toMatch(/household accounts/i);
  });

  it("keeps innocent core-role answers from revealing the late account evidence early", () => {
    const partner = getVariantAnswerOverride("blackwood-private-chef", "partner", "money");
    const oldFriend = getVariantAnswerOverride("blackwood-private-chef", "murderer", "ledger");
    expect(partner?.mustReveal).not.toMatch(/household|account charges|food-account/i);
    expect(oldFriend?.mustReveal).not.toMatch(/household|account charges|food-account/i);
  });
});
