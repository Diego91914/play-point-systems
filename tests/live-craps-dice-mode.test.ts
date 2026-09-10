import { describe, expect, test } from "vitest";
import {
  canChangeLiveCrapsDiceMode,
  changeLiveCrapsDiceMode,
  commitVirtualLiveCrapsRoll,
  projectCommittedRollForReveal,
} from "../lib/play-point-core/live-craps-dice-mode";

describe("Live Craps dice modes", () => {
  test("allows a mode change only with point off, no pending roll, and betting unlocked", () => {
    const open = {
      mode: "physical" as const,
      point: null,
      pendingRollId: null,
      bettingLocked: false,
    };

    expect(canChangeLiveCrapsDiceMode(open)).toBe(true);
    expect(changeLiveCrapsDiceMode(open, "virtual").mode).toBe("virtual");
    expect(canChangeLiveCrapsDiceMode({ ...open, point: 6 as const })).toBe(false);
    expect(canChangeLiveCrapsDiceMode({ ...open, pendingRollId: "roll-1" })).toBe(false);
    expect(canChangeLiveCrapsDiceMode({ ...open, bettingLocked: true })).toBe(false);
  });

  test("rejects changing modes during an active point cycle", () => {
    expect(() => changeLiveCrapsDiceMode({ mode: "physical", point: 8, pendingRollId: null, bettingLocked: false }, "virtual")).toThrow(/point off/i);
  });

  test("commits both die faces and total before reveal", () => {
    const roll = commitVirtualLiveCrapsRoll({ rollId: "roll-1", shooterId: "p1", now: new Date("2026-09-09T12:00:00.000Z") });
    expect(roll.source).toBe("virtual");
    expect(roll.die1).toBeGreaterThanOrEqual(1);
    expect(roll.die1).toBeLessThanOrEqual(6);
    expect(roll.die2).toBeGreaterThanOrEqual(1);
    expect(roll.die2).toBeLessThanOrEqual(6);
    expect(roll.total).toBe(roll.die1 + roll.die2);
    expect(roll.committedAt).toBe("2026-09-09T12:00:00.000Z");
  });

  test("is replay-safe for an already committed roll id", () => {
    const original = commitVirtualLiveCrapsRoll({ rollId: "roll-1", shooterId: "p1" });
    const replay = commitVirtualLiveCrapsRoll({ rollId: "roll-1", shooterId: "p1", existing: original });
    expect(replay).toEqual(original);
  });

  test("rejects replaying an existing roll for another shooter", () => {
    const original = commitVirtualLiveCrapsRoll({ rollId: "roll-1", shooterId: "p1" });
    expect(() => commitVirtualLiveCrapsRoll({ rollId: "roll-1", shooterId: "p2", existing: original })).toThrow(/another shooter/i);
  });

  test("reveal projection exposes the authoritative committed result", () => {
    const roll = commitVirtualLiveCrapsRoll({ rollId: "roll-2", shooterId: "p2" });
    expect(projectCommittedRollForReveal(roll)).toEqual({ rollId: roll.rollId, shooterId: roll.shooterId, source: "virtual", die1: roll.die1, die2: roll.die2, total: roll.total });
  });
});
