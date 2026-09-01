import { describe, expect, it } from "vitest";
import { applyMysteryFollowupLabels, followupLabelForQuestion } from "../lib/play-point-core/mystery-followups";

const baseQuestions = [
  { id: "timeline", label: "Walk us through 10:25 to 10:40." },
  { id: "relationship", label: "What was your relationship with the victim really like?" },
  { id: "door", label: "What do you know about the back door or porch?" },
  { id: "money", label: "Did money connect you to the victim?" },
];

describe("Blackwood evidence-gated follow-ups", () => {
  it("turns a later timeline question into a true follow-up after an earlier location answer", () => {
    const questions = applyMysteryFollowupLabels(baseQuestions, {
      viewerId: "investigator",
      targetId: "suspect",
      targetRoleId: "partner",
      evidenceIndex: 0,
      variantId: "blackwood-old-friend",
      asked: [{ questionerId: "investigator", targetId: "suspect", questionId: "where" }],
    });

    expect(questions.find(question => question.id === "timeline")?.label).toContain("FOLLOW-UP:");
    expect(questions.find(question => question.id === "timeline")?.label).toContain("10:31–10:35");
  });

  it("uses Business Partner wording after that case path locks", () => {
    const questions = applyMysteryFollowupLabels(baseQuestions, {
      viewerId: "investigator",
      targetId: "suspect",
      targetRoleId: "partner",
      evidenceIndex: 2,
      variantId: "blackwood-business-partner",
      asked: [],
    });

    expect(questions.find(question => question.id === "door")?.label).toContain("study");
    expect(questions.find(question => question.id === "money")?.label).toContain("Blackwood Holdings");
  });

  it("uses inheritance wording in the Sister path rather than Old Friend ledger framing", () => {
    const label = followupLabelForQuestion("money", "Did money connect you to the victim?", {
      viewerId: "investigator",
      targetId: "suspect",
      targetRoleId: "sister",
      evidenceIndex: 3,
      variantId: "blackwood-younger-sister",
      asked: [],
    });

    expect(label).toContain("inheritance");
    expect(label).not.toContain("decades-old theft");
  });

  it("uses kitchen/service wording in the Chef path", () => {
    const questions = applyMysteryFollowupLabels([
      { id: "glass", label: "Did you handle or notice a whiskey glass tonight?" },
      { id: "porch_route", label: "Could you have used the back porch after 10:30?" },
    ], {
      viewerId: "investigator",
      targetId: "suspect",
      targetRoleId: "chef",
      evidenceIndex: 2,
      variantId: "blackwood-private-chef",
      asked: [],
    });

    expect(questions.find(question => question.id === "glass")?.label).toContain("kitchen");
    expect(questions.find(question => question.id === "porch_route")?.label).toContain("kitchen");
  });

  it("surfaces a contradiction question when later evidence conflicts with the culprit's earlier alibi", () => {
    const label = followupLabelForQuestion("porch_route", "Could you have used the back porch after 10:30?", {
      viewerId: "investigator",
      targetId: "partner-player",
      targetRoleId: "partner",
      evidenceIndex: 2,
      variantId: "blackwood-business-partner",
      asked: [{ questionerId: "other-player", targetId: "partner-player", questionId: "where" }],
    });

    expect(label).toContain("CONTRADICTION:");
    expect(label).toContain("stayed in the study");
    expect(label).toContain("company records");
  });
});
