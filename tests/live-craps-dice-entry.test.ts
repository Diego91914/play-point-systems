import { describe, expect, it } from "vitest";
import { confirmLiveCrapsDiceEntry, createLiveCrapsDiceEntry, getLiveCrapsEnteredTotal, isLiveCrapsHardway, selectLiveCrapsDie } from "../lib/play-point-core/live-craps-dice-entry";

describe("Live Craps shooter dice entry", () => {
  it("captures each physical die independently and calculates total", () => {
    let entry = createLiveCrapsDiceEntry("shooter");
    entry = selectLiveCrapsDie(entry, 1, 4);
    entry = selectLiveCrapsDie(entry, 2, 3);
    expect(getLiveCrapsEnteredTotal(entry)).toBe(7);
  });

  it("preserves composition so hardways remain distinguishable", () => {
    let hard = createLiveCrapsDiceEntry("shooter");
    hard = selectLiveCrapsDie(selectLiveCrapsDie(hard, 1, 4), 2, 4);
    let easy = createLiveCrapsDiceEntry("shooter");
    easy = selectLiveCrapsDie(selectLiveCrapsDie(easy, 1, 3), 2, 5);
    expect(getLiveCrapsEnteredTotal(hard)).toBe(8);
    expect(getLiveCrapsEnteredTotal(easy)).toBe(8);
    expect(isLiveCrapsHardway(hard)).toBe(true);
    expect(isLiveCrapsHardway(easy)).toBe(false);
  });

  it("requires both dice before confirmation", () => {
    const entry = selectLiveCrapsDie(createLiveCrapsDiceEntry("a"), 1, 6);
    expect(() => confirmLiveCrapsDiceEntry(entry, "a")).toThrow(/both physical dice/i);
  });

  it("allows only the shooter to confirm", () => {
    let entry = createLiveCrapsDiceEntry("a");
    entry = selectLiveCrapsDie(selectLiveCrapsDie(entry, 1, 6), 2, 1);
    expect(() => confirmLiveCrapsDiceEntry(entry, "b")).toThrow(/only the current shooter/i);
  });

  it("freezes dice after confirmation", () => {
    let entry = createLiveCrapsDiceEntry("a");
    entry = selectLiveCrapsDie(selectLiveCrapsDie(entry, 1, 2), 2, 2);
    entry = confirmLiveCrapsDiceEntry(entry, "a");
    expect(() => selectLiveCrapsDie(entry, 1, 3)).toThrow(/cannot be changed/i);
  });
});
