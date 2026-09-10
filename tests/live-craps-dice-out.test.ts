import { describe, expect, it } from "vitest";
import { advanceLiveCrapsDiceOutClock, assertLiveCrapsActionWindowOpen, beginLiveCrapsDiceEntry, completeLiveCrapsSettlement, createLiveCrapsDiceOutState, getLiveCrapsDiceOutRemaining, markLiveCrapsDiceEntered, setLiveCrapsDiceOutDuration, startLiveCrapsPostRollActionWindow } from "../lib/play-point-core/live-craps-dice-out";

describe("Live Craps post-roll action clock", () => {
  it("defaults to the locked 15 second standard", () => {
    expect(createLiveCrapsDiceOutState().durationSeconds).toBe(15);
  });

  it("supports only 10, 15, and 20 second table settings", () => {
    expect(setLiveCrapsDiceOutDuration(createLiveCrapsDiceOutState(), 10).durationSeconds).toBe(10);
    expect(setLiveCrapsDiceOutDuration(createLiveCrapsDiceOutState(), 20).durationSeconds).toBe(20);
  });

  it("starts immediately after settlement and counts toward Dice Out", () => {
    const state = startLiveCrapsPostRollActionWindow(createLiveCrapsDiceOutState(15), { shooterId: "shooter", settledRollId: "r1", nowMs: 1_000 });
    expect(state.phase).toBe("post-roll-betting");
    expect(state.deadlineMs).toBe(16_000);
    expect(getLiveCrapsDiceOutRemaining(state, 1_000)).toBe(15);
    expect(getLiveCrapsDiceOutRemaining(state, 6_001)).toBe(10);
  });

  it("accepts actions before deadline and rejects them at deadline", () => {
    const state = startLiveCrapsPostRollActionWindow(createLiveCrapsDiceOutState(10), { shooterId: "a", settledRollId: "r1", nowMs: 0 });
    expect(() => assertLiveCrapsActionWindowOpen(state, 9_999)).not.toThrow();
    expect(() => assertLiveCrapsActionWindowOpen(state, 10_000)).toThrow(/locked/i);
  });

  it("calls Dice Out at zero with no second countdown", () => {
    const state = startLiveCrapsPostRollActionWindow(createLiveCrapsDiceOutState(10), { shooterId: "a", settledRollId: "r1", nowMs: 0 });
    expect(advanceLiveCrapsDiceOutClock(state, 9_999).phase).toBe("post-roll-betting");
    expect(advanceLiveCrapsDiceOutClock(state, 10_000).phase).toBe("dice-out");
  });

  it("blocks dice entry before Dice Out and allows only the shooter after it", () => {
    const live = startLiveCrapsPostRollActionWindow(createLiveCrapsDiceOutState(), { shooterId: "a", settledRollId: "r1", nowMs: 0 });
    expect(() => beginLiveCrapsDiceEntry(live, "a")).toThrow(/only after/i);
    const diceOut = advanceLiveCrapsDiceOutClock(live, 15_000);
    expect(() => beginLiveCrapsDiceEntry(diceOut, "b")).toThrow(/only the current shooter/i);
    expect(beginLiveCrapsDiceEntry(diceOut, "a").phase).toBe("dice-entry");
  });

  it("requires an entered roll to reach settlement before the next action window", () => {
    const live = startLiveCrapsPostRollActionWindow(createLiveCrapsDiceOutState(), { shooterId: "a", settledRollId: "r1", nowMs: 0 });
    const diceOut = advanceLiveCrapsDiceOutClock(live, 15_000);
    const entry = beginLiveCrapsDiceEntry(diceOut, "a");
    const settling = markLiveCrapsDiceEntered(entry, "a");
    expect(settling.phase).toBe("settling");
    const next = completeLiveCrapsSettlement(settling, { rollId: "r2", nextShooterId: "a", nowMs: 20_000 });
    expect(next.phase).toBe("post-roll-betting");
    expect(next.settledRollId).toBe("r2");
  });
});
