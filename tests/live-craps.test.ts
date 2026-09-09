import { describe, expect, it } from "vitest";
import {
  createLiveCrapsTable,
  correctPendingLiveCrapsRoll,
  getLiveCrapsShooter,
  settlePendingLiveCrapsRoll,
  sitOutLiveCrapsPlayer,
  submitLiveCrapsRoll,
} from "../lib/play-point-core/live-craps";

function table() {
  return createLiveCrapsTable({
    players: [
      { id: "chan", name: "Channing", seat: 0 },
      { id: "gary", name: "Gary", seat: 1 },
      { id: "dave", name: "Dave", seat: 2 },
      { id: "jon", name: "Jon", seat: 3 },
    ],
  });
}

describe("Live Craps physical roll foundation", () => {
  it("starts with the first seat shooting and the point off", () => {
    const state = table();
    expect(getLiveCrapsShooter(state)?.id).toBe("chan");
    expect(state.point).toBeNull();
  });

  it("accepts only the current shooter and two real die faces", () => {
    const state = table();
    expect(() => submitLiveCrapsRoll(state, { shooterId: "gary", die1: 3, die2: 4 })).toThrow(/current shooter/i);
    expect(() => submitLiveCrapsRoll(state, { shooterId: "chan", die1: 0, die2: 7 })).toThrow(/1 through 6/i);
  });

  it("records both dice so hardway-capable combinations remain distinguishable", () => {
    const pending = submitLiveCrapsRoll(table(), { shooterId: "chan", die1: 4, die2: 4, submittedAt: "2026-09-09T00:00:00.000Z" });
    expect(pending.pendingRoll).toMatchObject({ die1: 4, die2: 4, total: 8 });
  });

  it("allows a shooter to correct a mistap before settlement", () => {
    let state = submitLiveCrapsRoll(table(), { shooterId: "chan", die1: 4, die2: 2 });
    state = correctPendingLiveCrapsRoll(state, { shooterId: "chan", die1: 4, die2: 3 });
    expect(state.pendingRoll?.total).toBe(7);
  });

  it("keeps the point off after a come-out natural", () => {
    let state = submitLiveCrapsRoll(table(), { shooterId: "chan", die1: 5, die2: 6 });
    state = settlePendingLiveCrapsRoll(state);
    expect(state.point).toBeNull();
    expect(state.history.at(-1)?.outcome).toBe("natural");
    expect(getLiveCrapsShooter(state)?.id).toBe("chan");
  });

  it("establishes a point on 4, 5, 6, 8, 9, or 10", () => {
    let state = submitLiveCrapsRoll(table(), { shooterId: "chan", die1: 3, die2: 3 });
    state = settlePendingLiveCrapsRoll(state);
    expect(state.point).toBe(6);
    expect(state.history.at(-1)?.outcome).toBe("point-established");
  });

  it("making the point clears it and keeps the same shooter", () => {
    let state = submitLiveCrapsRoll(table(), { shooterId: "chan", die1: 3, die2: 3 });
    state = settlePendingLiveCrapsRoll(state);
    state = submitLiveCrapsRoll(state, { shooterId: "chan", die1: 2, die2: 4 });
    state = settlePendingLiveCrapsRoll(state);

    expect(state.point).toBeNull();
    expect(state.history.at(-1)?.outcome).toBe("point-made");
    expect(getLiveCrapsShooter(state)?.id).toBe("chan");
  });

  it("seven-out clears the point and passes the dice clockwise", () => {
    let state = submitLiveCrapsRoll(table(), { shooterId: "chan", die1: 3, die2: 3 });
    state = settlePendingLiveCrapsRoll(state);
    state = submitLiveCrapsRoll(state, { shooterId: "chan", die1: 3, die2: 4 });
    state = settlePendingLiveCrapsRoll(state);

    expect(state.point).toBeNull();
    expect(state.history.at(-1)?.outcome).toBe("seven-out");
    expect(getLiveCrapsShooter(state)?.id).toBe("gary");
  });

  it("does not permit a second roll while one is awaiting settlement", () => {
    const state = submitLiveCrapsRoll(table(), { shooterId: "chan", die1: 2, die2: 2 });
    expect(() => submitLiveCrapsRoll(state, { shooterId: "chan", die1: 5, die2: 5 })).toThrow(/already pending/i);
  });

  it("skips a sitting-out player when the dice pass", () => {
    let state = table();
    state = sitOutLiveCrapsPlayer(state, "gary");
    state = submitLiveCrapsRoll(state, { shooterId: "chan", die1: 3, die2: 3 });
    state = settlePendingLiveCrapsRoll(state);
    state = submitLiveCrapsRoll(state, { shooterId: "chan", die1: 3, die2: 4 });
    state = settlePendingLiveCrapsRoll(state);
    expect(getLiveCrapsShooter(state)?.id).toBe("dave");
  });
});
