import { describe, expect, it } from "vitest";
import {
  BLACKWOOD_CASE_VARIANTS,
  blackwoodBranchProgress,
  resolveBlackwoodVariant,
} from "../lib/play-point-core/mystery-case-variants";
import { getBlackwoodVariantContent } from "../lib/play-point-core/mystery-variant-content";
import { getVariantAnswerOverride } from "../lib/play-point-core/mystery-variant-runtime";

const paths = [
  { letter: "open", voice: "listen", expected: "blackwood-old-friend" },
  { letter: "open", voice: "leave", expected: "blackwood-younger-sister" },
  { letter: "seal", voice: "listen", expected: "blackwood-private-chef" },
  { letter: "seal", voice: "leave", expected: "blackwood-business-partner" },
] as const;

describe("Blackwood hidden branching", () => {
  it("does not resolve before both hidden branch points exist", () => {
    expect(blackwoodBranchProgress({})).toEqual({ completed: 0, required: 2, readyToResolve: false });
    expect(blackwoodBranchProgress({ adrian_sealed_letter: "open" })).toEqual({ completed: 1, required: 2, readyToResolve: false });
    expect(resolveBlackwoodVariant({ adrian_sealed_letter: "open" })).toBeNull();
  });

  it("maps the two binary choices to four unique authored paths", () => {
    const winners = paths.map(path => {
      const signals = { adrian_sealed_letter: path.letter, adrian_voice_draft: path.voice };
      const ranked = [...BLACKWOOD_CASE_VARIANTS].sort((a, b) => b.branchFit(signals) - a.branchFit(signals));
      expect(ranked[0].branchFit(signals)).toBeGreaterThan(0);
      expect(ranked[0].id).toBe(path.expected);
      return ranked[0].id;
    });
    expect(new Set(winners).size).toBe(4);
  });

  it("never exposes an unfinished alternate truth in a live game", () => {
    for (const path of paths) {
      const resolved = resolveBlackwoodVariant({ adrian_sealed_letter: path.letter, adrian_voice_draft: path.voice });
      expect(resolved?.releaseReady).toBe(true);
      expect(resolved?.id).toBe("blackwood-old-friend");
    }
  });
});

describe("Blackwood alternate content release gates", () => {
  const alternates = BLACKWOOD_CASE_VARIANTS.filter(variant => variant.id !== "blackwood-old-friend");

  it.each(alternates)("$id has a complete authored content pack", variant => {
    const content = getBlackwoodVariantContent(variant.id);
    expect(content).not.toBeNull();
    expect(content?.culpritRoleId).toBe(variant.culpritRoleId);
    expect(content?.roleTruths.some(role => role.roleId === variant.culpritRoleId)).toBe(true);
    expect(content?.evidence.length).toBeGreaterThanOrEqual(4);
    expect(content?.supportRules.length).toBeGreaterThanOrEqual(4);

    const authoredSupportIds = new Set(content?.supportRules.map(rule => rule.id));
    for (const supportId of variant.correctSupportIds) expect(authoredSupportIds.has(supportId)).toBe(true);
  });

  it.each(alternates)("$id gives the culprit a variant-specific interrogation cover", variant => {
    const where = getVariantAnswerOverride(variant.id, variant.culpritRoleId, "where");
    const motive = getVariantAnswerOverride(variant.id, variant.culpritRoleId, "motive");
    const after = getVariantAnswerOverride(variant.id, variant.culpritRoleId, "after");
    expect(where?.mustReveal).toBeTruthy();
    expect(where?.mayHide).toBeTruthy();
    expect(motive?.mustReveal).toBeTruthy();
    expect(after?.mustReveal).toBeTruthy();
  });

  it("keeps alternate support IDs unique across authored paths", () => {
    const ids = alternates.flatMap(variant => variant.correctSupportIds.map(id => `${variant.id}:${id}`));
    const raw = ids.map(item => item.split(":")[1]);
    expect(new Set(raw).size).toBe(raw.length);
  });
});
