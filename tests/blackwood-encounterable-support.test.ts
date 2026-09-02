import { describe, expect, it } from "vitest";
import { BLACKWOOD_CASE_VARIANTS } from "@/lib/play-point-core/mystery-case-variants";
import { getBlackwoodVariantContent } from "@/lib/play-point-core/mystery-variant-content";

const ALTERNATES = BLACKWOOD_CASE_VARIANTS.filter(variant => variant.id !== "blackwood-old-friend");

describe("Blackwood alternate support facts are encounterable", () => {
  it("only scores support IDs that exist in the active variant's authored support rules", () => {
    for (const variant of ALTERNATES) {
      const content = getBlackwoodVariantContent(variant.id);
      expect(content).toBeTruthy();
      const authoredIds = new Set(content!.supportRules.map(rule => rule.id));
      for (const supportId of variant.correctSupportIds) {
        expect(authoredIds.has(supportId), `${variant.id} scores missing support ${supportId}`).toBe(true);
      }
    }
  });

  it("never treats hidden branch-artifact contents as scored proof in alternate truths", () => {
    for (const variant of ALTERNATES) {
      expect(variant.correctSupportIds.some(id => /sealed_letter|voice_draft/i.test(id))).toBe(false);
    }
  });

  it("keeps at least two correct support paths available by Evidence 3", () => {
    for (const variant of ALTERNATES) {
      const content = getBlackwoodVariantContent(variant.id)!;
      const correct = new Set(variant.correctSupportIds);
      const earlyCorrect = content.supportRules.filter(rule => correct.has(rule.id) && rule.minEvidence <= 2);
      expect(earlyCorrect.length, `${variant.id} needs two encounterable proof links by Evidence 3`).toBeGreaterThanOrEqual(2);
    }
  });

  it("does not score the Chef's deliberately generic voice draft as household-account proof", () => {
    const chef = BLACKWOOD_CASE_VARIANTS.find(variant => variant.id === "blackwood-private-chef")!;
    expect(chef.correctSupportIds).not.toContain("voice_draft_service_warning");
  });
});
