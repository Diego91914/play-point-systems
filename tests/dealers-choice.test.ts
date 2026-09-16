import { describe, expect, it } from "vitest";
import {
  advanceDealersChoiceDealer,
  createDealersChoiceSession,
  getDealersChoiceNetResult,
  hasDealersChoiceReachedOrbitLimit,
  isDealersChoiceOrbitComplete,
  rebuyDealersChoicePlayer,
  sitOutBustedDealersChoicePlayer,
} from "../lib/play-point-core/dealers-choice";

function table() {
  return createDealersChoiceSession({
    players: [
      { id: "chan", name: "Channing", seat: 0 },
      { id: "gary", name: "Gary", seat: 1 },
      { id: "dave", name: "Dave", seat: 2 },
      { id: "jon", name: "Jon", seat: 3 },
    ],
  });
}

describe("Dealer's Choice session foundation", () => {
  it("starts every player with the same 1,000-chip stack and tracks issuance", () => {
    const session = table();
    expect(session.startingStack).toBe(1_000);
    expect(session.maxRebuys).toBe(2);
    expect(session.format).toEqual({ kind: "three-orbits" });
    expect(session.players.map((player) => player.chips)).toEqual([1_000, 1_000, 1_000, 1_000]);
    expect(session.players.map((player) => player.totalIssued)).toEqual([1_000, 1_000, 1_000, 1_000]);
  });

  it("rejects duplicate seats and tables outside the 2-8 player range", () => {
    expect(() => createDealersChoiceSession({ players: [{ id: "a", name: "A", seat: 0 }] })).toThrow(/at least 2/i);
    expect(() =>
      createDealersChoiceSession({
        players: [
          { id: "a", name: "A", seat: 0 },
          { id: "b", name: "B", seat: 0 },
        ],
      }),
    ).toThrow(/seats must be unique/i);
  });

  it("rebuy issues only the busted player one original stack", () => {
    const session = table();
    session.players[3] = { ...session.players[3], chips: 0 };
    session.players[0] = { ...session.players[0], chips: 1_800 };
    session.players[1] = { ...session.players[1], chips: 1_300 };
    session.players[2] = { ...session.players[2], chips: 900 };

    const result = rebuyDealersChoicePlayer(session, "jon");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.session.players.map((player) => player.chips)).toEqual([1_800, 1_300, 900, 1_000]);
    expect(result.session.players[3].totalIssued).toBe(2_000);
    expect(result.session.players[3].rebuys).toBe(1);
  });

  it("does not let a player rebuy before busting", () => {
    expect(rebuyDealersChoicePlayer(table(), "gary")).toEqual({ ok: false, reason: "PLAYER_NOT_BUSTED" });
  });

  it("enforces the default two-rebuy limit", () => {
    let session = table();
    session.players[1] = { ...session.players[1], chips: 0 };

    const first = rebuyDealersChoicePlayer(session, "gary");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    session = first.session;
    session.players[1] = { ...session.players[1], chips: 0 };

    const second = rebuyDealersChoicePlayer(session, "gary");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    session = second.session;
    session.players[1] = { ...session.players[1], chips: 0 };

    expect(rebuyDealersChoicePlayer(session, "gary")).toEqual({ ok: false, reason: "REBUY_LIMIT_REACHED" });
  });

  it("ranks performance from ending stack minus all chips issued", () => {
    expect(getDealersChoiceNetResult({ chips: 2_200, totalIssued: 1_000 })).toBe(1_200);
    expect(getDealersChoiceNetResult({ chips: 2_400, totalIssued: 3_000 })).toBe(-600);
  });

  it("rotates the dealer clockwise and identifies completed orbits", () => {
    let session = table();
    expect(session.dealerSeat).toBe(0);

    session = advanceDealersChoiceDealer(session);
    expect(session.dealerSeat).toBe(1);
    session = advanceDealersChoiceDealer(session);
    session = advanceDealersChoiceDealer(session);
    session = advanceDealersChoiceDealer(session);

    expect(session.dealerSeat).toBe(0);
    expect(session.completedDealerTurns).toBe(4);
    expect(isDealersChoiceOrbitComplete(session)).toBe(true);
    expect(hasDealersChoiceReachedOrbitLimit(session)).toBe(false);
  });

  it("skips a busted player who chooses to sit out", () => {
    let session = table();
    session.players[1] = { ...session.players[1], chips: 0 };
    session = sitOutBustedDealersChoicePlayer(session, "gary");
    session = advanceDealersChoiceDealer(session);
    expect(session.dealerSeat).toBe(2);
  });

  it("ends a three-orbit session after every original seat has dealt three times", () => {
    let session = table();
    for (let turn = 0; turn < 12; turn += 1) session = advanceDealersChoiceDealer(session);
    expect(hasDealersChoiceReachedOrbitLimit(session)).toBe(true);
  });
});
