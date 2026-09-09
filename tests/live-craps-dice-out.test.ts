import { describe, expect, it } from "vitest";
import { advanceLiveCrapsDiceOutClock, createLiveCrapsDiceOutState, getLiveCrapsDiceOutRemaining, markLiveCrapsDiceEntered, reopenLiveCrapsBetting, setLiveCrapsDiceOutDuration, startLiveCrapsDiceOut } from "../lib/play-point-core/live-craps-dice-out";

describe("Live Craps Dice Out", () => {
  it("defaults to the locked 15 second standard", () => {
    expect(createLiveCrapsDiceOutState().durationSeconds).toBe(15);
  });

  it("supports only 10, 15, and 20 second table settings", () => {
    expect(setLiveCrapsDiceOutDuration(createLiveCrapsDiceOutState(), 10).durationSeconds).toBe(10);
    expect(setLiveCrapsDiceOutDuration(createLiveCrapsDiceOutState(), 20).durationSeconds).toBe(20);
  });

  it("starts Dice Out and counts down from the authoritative start time", () => {
    const state = startLiveCrapsDiceOut(createLiveCrapsDiceOutState(15), "shooter", 1_000);
    expect(state.phase).toBe("dice-out");
    expect(getLiveCrapsDiceOutRemaining(state, 1_000)).toBe(15);
    expect(getLiveCrapsDiceOutRemaining(state, 6_001)).toBe(10);
  });

  it("does not penalize at zero and instead waits for the physical roll", () => {
    const state = startLiveCrapsDiceOut(createLiveCrapsDiceOutState(10), "shooter", 0);
    const expired = advanceLiveCrapsDiceOutClock(state, 10_000);
    expect(expired.phase).toBe("waiting-for-roll");
  });

  it("allows the shooter to enter dice before or after countdown expiry", () => {
    const live = startLiveCrapsDiceOut(createLiveCrapsDiceOutState(), "a", 0);
    expect(markLiveCrapsDiceEntered(live, "a").phase).toBe("dice-entered");
    const waiting = advanceLiveCrapsDiceOutClock(live, 15_000);
    expect(markLiveCrapsDiceEntered(waiting, "a").phase).toBe("dice-entered");
  });

  it("does not let another player enter the shooter's dice", () => {
    const state = startLiveCrapsDiceOut(createLiveCrapsDiceOutState(), "a", 0);
    expect(() => markLiveCrapsDiceEntered(state, "b")).toThrow(/only the current shooter/i);
  });

  it("reopens betting only after the entered roll reaches settlement", () => {
    const state = markLiveCrapsDiceEntered(startLiveCrapsDiceOut(createLiveCrapsDiceOutState(), "a", 0), "a");
    expect(reopenLiveCrapsBetting(state).phase).toBe("betting-open");
  });
});
