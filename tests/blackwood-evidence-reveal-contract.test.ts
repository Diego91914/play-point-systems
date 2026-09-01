import { describe, expect, it } from "vitest";
import { applyMysteryFollowupLabels } from "../lib/play-point-core/mystery-followups";

function label(variantId: string, questionId: string, evidenceIndex: number, targetRoleId: string) {
  return applyMysteryFollowupLabels(
    [{ id: questionId, label: "fallback" }],
    {
      viewerId: "viewer",
      targetId: "target",
      targetRoleId,
      variantId,
      evidenceIndex,
      asked: [],
    },
  )[0].label;
}

describe("Blackwood alternate evidence reveal contracts", () => {
  it("keeps the Business Partner's final forensic conclusion out of earlier followups", () => {
    for (const evidenceIndex of [0, 1, 2]) {
      for (const questionId of ["money", "ledger", "ledger_entry", "final_pressure"]) {
        expect(label("blackwood-business-partner", questionId, evidenceIndex, "partner"))
          .not.toMatch(/deliberately diverted|missing page corner|forensic review|private admission/i);
      }
    }
  });

  it("reveals the Sister's inheritance story in stages", () => {
    for (const questionId of ["ledger", "ledger_entry", "final_pressure"]) {
      const beforePaper = label("blackwood-younger-sister", questionId, 0, "sister");
      expect(beforePaper).not.toMatch(/papers|documents|revision|revised/i);

      const afterPaper = label("blackwood-younger-sister", questionId, 1, "sister");
      expect(afterPaper).not.toMatch(/changed inheritance|revision|revised inheritance/i);
    }

    expect(label("blackwood-younger-sister", "ledger", 1, "sister")).toMatch(/inheritance papers/i);
    expect(label("blackwood-younger-sister", "ledger", 3, "sister")).toMatch(/changed inheritance documents/i);
    expect(label("blackwood-younger-sister", "final_pressure", 3, "sister")).toMatch(/inheritance revision/i);
  });

  it("does not let generic dinner followups imply a known inheritance confrontation too early", () => {
    for (const evidenceIndex of [0, 1, 2]) {
      expect(label("blackwood-younger-sister", "drink", evidenceIndex, "sister"))
        .not.toMatch(/inheritance confrontation/i);
      expect(label("blackwood-younger-sister", "whiskey_owner", evidenceIndex, "sister"))
        .not.toMatch(/inheritance confrontation/i);
    }
  });
});
