import { describe, expect, it } from "vitest";
import { followupLabelForQuestion } from "../lib/play-point-core/mystery-followups";

const asked = [
  { questionerId: "questioner", targetId: "target", questionId: "where" },
];

describe("Blackwood follow-up viewer consistency", () => {
  it("shows the same follow-up prompt to questioner, target, and another viewer", () => {
    const labels = ["questioner", "target", "spectator"].map(viewerId =>
      followupLabelForQuestion("timeline", "Walk us through the timeline.", {
        viewerId,
        targetId: "target",
        targetRoleId: "partner",
        evidenceIndex: 1,
        variantId: "blackwood-business-partner",
        asked,
      }),
    );

    expect(new Set(labels).size).toBe(1);
    expect(labels[0]).toBe("FOLLOW-UP: The death window is now 10:31–10:35. Walk us through those exact minutes again.");
  });

  it("keeps contradiction wording identical for every viewer", () => {
    const labels = ["questioner", "target", "spectator"].map(viewerId =>
      followupLabelForQuestion("porch_route", "What about the rear route?", {
        viewerId,
        targetId: "target",
        targetRoleId: "chef",
        evidenceIndex: 2,
        variantId: "blackwood-private-chef",
        asked,
      }),
    );

    expect(new Set(labels).size).toBe(1);
    expect(labels[0]).toMatch(/^CONTRADICTION:/);
    expect(labels[0]).toMatch(/service gap/i);
  });
});
