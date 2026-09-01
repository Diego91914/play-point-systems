import { describe, expect, it } from "vitest";
import { BLACKWOOD_ALT_TIMELINES } from "../lib/play-point-core/blackwood-timelines";
import { BLACKWOOD_CASE_VARIANTS } from "../lib/play-point-core/mystery-case-variants";
import { getBlackwoodVariantContent } from "../lib/play-point-core/mystery-variant-content";

const ALT_IDS = ["blackwood-business-partner", "blackwood-younger-sister", "blackwood-private-chef"];
const CORE_ROLES = ["murderer", "partner", "sister", "chef"];

describe("Blackwood alternate timelines", () => {
  it("authors a complete core-role timeline for every alternate truth", () => {
    for (const variantId of ALT_IDS) {
      const timelines = BLACKWOOD_ALT_TIMELINES[variantId];
      expect(timelines?.map(item => item.roleId).sort()).toEqual([...CORE_ROLES].sort());
    }
  });

  it("places each alternate culprit in the library during the 10:31–10:35 death window", () => {
    for (const variantId of ALT_IDS) {
      const variant = BLACKWOOD_CASE_VARIANTS.find(item => item.id === variantId)!;
      const culprit = BLACKWOOD_ALT_TIMELINES[variantId].find(item => item.roleId === variant.culpritRoleId)!;
      expect(culprit.beats.some(beat => beat.time.includes("10:31–10:35") && beat.location === "library")).toBe(true);
    }
  });

  it("keeps authored culprit truth and timeline pointed at the same fatal window", () => {
    for (const variantId of ALT_IDS) {
      const variant = BLACKWOOD_CASE_VARIANTS.find(item => item.id === variantId)!;
      const truth = getBlackwoodVariantContent(variantId)?.roleTruths.find(item => item.roleId === variant.culpritRoleId);
      expect(truth?.privateTruth.join(" ")).toMatch(/10:31–10:35/);
    }
  });

  it("does not make the Younger Sister witness herself on the porch", () => {
    const sister = BLACKWOOD_ALT_TIMELINES["blackwood-younger-sister"].find(item => item.roleId === "sister")!;
    expect(sister.beats.join(" ")).not.toMatch(/dark-clothed figure/i);
  });

  it("keeps the Chef motive tied to fraud exposure rather than firing alone", () => {
    const chef = BLACKWOOD_ALT_TIMELINES["blackwood-private-chef"].find(item => item.roleId === "chef")!;
    expect(chef.beats.map(item => item.truth).join(" ")).toMatch(/fraud exposure/i);
  });
});
