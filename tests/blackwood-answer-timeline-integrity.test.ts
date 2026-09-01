import { describe, expect, it } from "vitest";
import { getVariantAnswerOverride, type MysteryAnswerKey } from "../lib/play-point-core/mystery-variant-runtime";
import { blackwoodTimelineFor } from "../lib/play-point-core/blackwood-timelines";

const CASES = [
  {
    variantId: "blackwood-business-partner",
    culpritRoleId: "partner",
    claimedPlace: /study/i,
    hiddenPlace: /library/i,
    route: /rear route/i,
  },
  {
    variantId: "blackwood-younger-sister",
    culpritRoleId: "sister",
    claimedPlace: /(outside|garden)/i,
    hiddenPlace: /library/i,
    route: /rear route/i,
  },
  {
    variantId: "blackwood-private-chef",
    culpritRoleId: "chef",
    claimedPlace: /kitchen/i,
    hiddenPlace: /library/i,
    route: /rear route/i,
  },
] as const;
const CORE_ROLES = ["murderer", "partner", "sister", "chef"] as const;

function answer(variantId: string, roleId: string, key: MysteryAnswerKey) {
  const result = getVariantAnswerOverride(variantId, roleId, key);
  expect(result, `${variantId}/${roleId}/${key} should be authored`).not.toBeNull();
  return result!;
}

describe("Blackwood interrogation answers agree with canonical timelines", () => {
  it("keeps each alternate culprit's public location claim consistent with the authored cover story", () => {
    for (const item of CASES) {
      const where = answer(item.variantId, item.culpritRoleId, "where");
      expect(where.mustReveal).toMatch(item.claimedPlace);
      expect(where.mayHide).toMatch(item.hiddenPlace);

      const timeline = blackwoodTimelineFor(item.variantId, item.culpritRoleId)!;
      expect(timeline.beats.some(beat => beat.location === "library" && beat.time.includes("10:31–10:35"))).toBe(true);
    }
  });

  it("gives every core role explicit where and timeline answers in every alternate truth", () => {
    for (const item of CASES) {
      for (const roleId of CORE_ROLES) {
        const where = answer(item.variantId, roleId, "where");
        const after = answer(item.variantId, roleId, "after");
        expect(where.mustReveal.length).toBeGreaterThan(10);
        expect(after.mustReveal).toMatch(/10:31|10:35|after/i);
      }
    }
  });

  it("keeps each alternate culprit's post-murder answer tied to the real rear-route movement", () => {
    for (const item of CASES) {
      const after = answer(item.variantId, item.culpritRoleId, "after");
      expect(after.mustReveal).toMatch(/10:31–10:35/);
      expect(after.mayHide).toMatch(item.route);
    }
  });

  it("keeps contradiction answers responsive to the evidence without forcing a confession", () => {
    const partnerDoor = answer("blackwood-business-partner", "partner", "door");
    expect(partnerDoor.mustReveal).toMatch(/rear-route evidence does not prove/i);
    expect(partnerDoor.mayHide).toMatch(/used the rear route/i);

    const sisterDoor = answer("blackwood-younger-sister", "sister", "door");
    expect(sisterDoor.mustReveal).toMatch(/does not prove who used it/i);
    expect(sisterDoor.mayHide).toMatch(/used the rear route yourself/i);

    const chefDoor = answer("blackwood-private-chef", "chef", "door");
    expect(chefDoor.mustReveal).toMatch(/do not prove you left the kitchen/i);
    expect(chefDoor.mayHide).toMatch(/used that route/i);
  });

  it("keeps the Sister's answers compatible with a broken accountant call, not a porch sighting", () => {
    const where = answer("blackwood-younger-sister", "sister", "where");
    const after = answer("blackwood-younger-sister", "sister", "after");
    const door = answer("blackwood-younger-sister", "sister", "door");
    const combined = [where.mustReveal, where.mayHide, after.mustReveal, after.mayHide, door.mustReveal, door.mayHide].filter(Boolean).join(" ");
    expect(combined).toMatch(/call|outside|garden/i);
    expect(combined).not.toMatch(/I saw|I witnessed|dark-clothed figure/i);
  });

  it("keeps the Chef's motive answers anchored to account-fraud exposure, not job loss alone", () => {
    const motive = answer("blackwood-private-chef", "chef", "motive");
    const money = answer("blackwood-private-chef", "chef", "money");
    const secret = answer("blackwood-private-chef", "chef", "secret");
    const hidden = [motive.mayHide, money.mayHide, secret.mayHide].filter(Boolean).join(" ");
    expect(hidden).toMatch(/personal purchases|household-account|household accounts|charges/i);
    expect(hidden).toMatch(/report|career|discovered/i);
  });

  it("keeps innocent Old Friend answers away from the library in every alternate truth", () => {
    for (const item of CASES) {
      const where = answer(item.variantId, "murderer", "where");
      const after = answer(item.variantId, "murderer", "after");
      expect(where.mustReveal).toMatch(/bathroom/i);
      expect(after.mustReveal).toMatch(/bathroom/i);
      expect(where.mustReveal).not.toMatch(/library/i);
      const timeline = blackwoodTimelineFor(item.variantId, "murderer")!;
      expect(timeline.beats.some(beat => /bathroom/i.test(beat.location))).toBe(true);
    }
  });
});
