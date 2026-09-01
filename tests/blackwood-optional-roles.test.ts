import { describe, expect, it } from "vitest";
import { getVariantAnswerOverride, getVariantRoleMemory } from "../lib/play-point-core/mystery-variant-runtime";

describe("Blackwood optional roles stay variant-safe", () => {
  it.each([
    "blackwood-business-partner",
    "blackwood-younger-sister",
    "blackwood-private-chef",
  ])("removes the Variant A delayed-ledger message for the lawyer in %s", variantId => {
    const memory = getVariantRoleMemory(variantId, "lawyer", [
      "At 10:35 Adrian's phone told you to check the blue ledger.",
      "You did not kill Adrian.",
    ]);

    expect(memory.join(" ").toLowerCase()).not.toContain("10:35 adrian's phone");
    expect(memory.join(" ").toLowerCase()).not.toContain("check the blue ledger");

    const heard = getVariantAnswerOverride(variantId, "lawyer", "heard");
    expect(heard?.mustReveal.toLowerCase()).not.toContain("blue ledger");
  });

  it("keeps the Cousin's Business Partner observation truthful without manufacturing an alibi", () => {
    const memory = getVariantRoleMemory("blackwood-business-partner", "cousin", []);
    expect(memory.join(" ")).toContain("10:33");
    expect(memory.join(" ").toLowerCase()).toContain("cannot say where");

    const heard = getVariantAnswerOverride("blackwood-business-partner", "cousin", "heard");
    expect(heard?.mustReveal.toLowerCase()).toContain("did not see where");
  });

  it("keeps alternate optional-role ledger answers neutral rather than steering to the Old Friend", () => {
    for (const roleId of ["lawyer", "assistant", "cousin", "neighbor"]) {
      const answer = getVariantAnswerOverride("blackwood-private-chef", roleId, "ledger");
      expect(answer?.mustReveal.toLowerCase()).not.toContain("old friend");
      expect(answer?.mustReveal.toLowerCase()).not.toContain("last chance");
    }
  });
});
