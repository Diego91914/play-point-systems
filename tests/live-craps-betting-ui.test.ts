import { describe, expect, it } from "vitest";
import { aggregateLiveCrapsNewBets, clearNewLiveCrapsBets, getLiveCrapsSeatAnchor, selectLiveCrapsBetAmount, touchLiveCrapsBetZone, undoLiveCrapsBettingAction, type LiveCrapsBettingWindow } from "../lib/play-point-core/live-craps-betting-ui";

const empty = (): LiveCrapsBettingWindow => ({ open: true, selectedAmountByPlayer: {}, newActions: [] });

describe("Live Craps betting UI contract", () => {
  it("requires amount first, then accepts a touched table location", () => {
    expect(() => touchLiveCrapsBetZone(empty(), { id: "1", playerId: "a", seat: 2, zoneId: "place-6" })).toThrow(/select a bet amount/i);
    const selected = selectLiveCrapsBetAmount(empty(), "a", 25);
    const placed = touchLiveCrapsBetZone(selected, { id: "1", playerId: "a", seat: 2, zoneId: "place-6" });
    expect(placed.newActions[0]).toMatchObject({ playerId: "a", seat: 2, zoneId: "place-6", amount: 25 });
  });

  it("adds repeated touches to the same player's same location", () => {
    let state = selectLiveCrapsBetAmount(empty(), "a", 25);
    state = touchLiveCrapsBetZone(state, { id: "1", playerId: "a", seat: 2, zoneId: "place-6" });
    state = touchLiveCrapsBetZone(state, { id: "2", playerId: "a", seat: 2, zoneId: "place-6" });
    expect(aggregateLiveCrapsNewBets(state, "a")).toEqual([{ zoneId: "place-6", amount: 50 }]);
  });

  it("keeps players independent even on the same betting zone", () => {
    let state = selectLiveCrapsBetAmount(empty(), "a", 25);
    state = selectLiveCrapsBetAmount(state, "b", 100);
    state = touchLiveCrapsBetZone(state, { id: "1", playerId: "a", seat: 1, zoneId: "field" });
    state = touchLiveCrapsBetZone(state, { id: "2", playerId: "b", seat: 8, zoneId: "field" });
    expect(aggregateLiveCrapsNewBets(state, "a")[0].amount).toBe(25);
    expect(aggregateLiveCrapsNewBets(state, "b")[0].amount).toBe(100);
    expect(getLiveCrapsSeatAnchor(1)).not.toEqual(getLiveCrapsSeatAnchor(8));
  });

  it("undoes only that player's latest new action", () => {
    let state = selectLiveCrapsBetAmount(empty(), "a", 5);
    state = touchLiveCrapsBetZone(state, { id: "1", playerId: "a", seat: 0, zoneId: "field" });
    state = touchLiveCrapsBetZone(state, { id: "2", playerId: "a", seat: 0, zoneId: "ats-small" });
    state = undoLiveCrapsBettingAction(state, "a");
    expect(state.newActions.map((a) => a.zoneId)).toEqual(["field"]);
  });

  it("clears only the player's current betting-window changes", () => {
    let state = selectLiveCrapsBetAmount(empty(), "a", 5);
    state = selectLiveCrapsBetAmount(state, "b", 5);
    state = touchLiveCrapsBetZone(state, { id: "1", playerId: "a", seat: 0, zoneId: "field" });
    state = touchLiveCrapsBetZone(state, { id: "2", playerId: "b", seat: 1, zoneId: "field" });
    state = clearNewLiveCrapsBets(state, "a");
    expect(state.newActions).toHaveLength(1);
    expect(state.newActions[0].playerId).toBe("b");
  });

  it("rejects touches after betting locks", () => {
    const state = selectLiveCrapsBetAmount({ ...empty(), open: false }, "a", 25);
    expect(() => touchLiveCrapsBetZone(state, { id: "1", playerId: "a", seat: 2, zoneId: "pass-line" })).toThrow(/betting is closed/i);
  });
});
