import { describe, expect, it } from "vitest";
import { createLiveCrapsTable } from "../lib/play-point-core/live-craps";
import { createLiveCrapsBankrolls, placeLiveCrapsBet } from "../lib/play-point-core/live-craps-bets";
import { createLiveCrapsAtsState } from "../lib/play-point-core/live-craps-ats";
import { confirmLiveCrapsDiceEntry, createLiveCrapsDiceEntry, selectLiveCrapsDie } from "../lib/play-point-core/live-craps-dice-entry";
import { projectLiveCrapsSettlementForPlayer, settleConfirmedLiveCrapsPhysicalRoll, type LiveCrapsSettlementState } from "../lib/play-point-core/live-craps-settlement";

const table = () => createLiveCrapsTable({ players: [{ id: "a", name: "A", seat: 0 }, { id: "b", name: "B", seat: 1 }] });
let rollSequence = 0;
const confirmed = (die1: number, die2: number) => {
  let entry = createLiveCrapsDiceEntry("a");
  entry = selectLiveCrapsDie(entry, 1, die1);
  entry = selectLiveCrapsDie(entry, 2, die2);
  return { ...confirmLiveCrapsDiceEntry(entry, "a"), rollId: `test-roll-${++rollSequence}` };
};
const state = (overrides: Partial<LiveCrapsSettlementState> = {}): LiveCrapsSettlementState => ({
  table: table(), bets: [], comeBets: [], odds: [], buyLayBets: [], hardwayBets: [], propBets: [], bankrolls: createLiveCrapsBankrolls(["a", "b"]), ats: createLiveCrapsAtsState("a"), processedRollIds: [], ...overrides,
});

describe("Live Craps unified settlement", () => {
  it("settles a confirmed physical roll and updates point", () => {
    const base = state();
    const placed = placeLiveCrapsBet({ bets: [], bankrolls: base.bankrolls, playerId: "b", kind: "pass-line", amount: 25, point: null, id: "p" });
    const result = settleConfirmedLiveCrapsPhysicalRoll({ ...base, bets: placed.bets, bankrolls: placed.bankrolls }, confirmed(3, 3));
    expect(result.roll.total).toBe(6);
    expect(result.table.point).toBe(6);
    expect(result.bets).toHaveLength(1);
  });

  it("returns personalized results without another player's bets", () => {
    const base = state();
    const first = placeLiveCrapsBet({ bets: [], bankrolls: base.bankrolls, playerId: "a", kind: "field", amount: 10, point: null, id: "a-field" });
    const second = placeLiveCrapsBet({ bets: first.bets, bankrolls: first.bankrolls, playerId: "b", kind: "pass-line", amount: 20, point: null, id: "b-pass" });
    const result = settleConfirmedLiveCrapsPhysicalRoll({ ...base, bets: second.bets, bankrolls: second.bankrolls }, confirmed(3, 4));
    const view = projectLiveCrapsSettlementForPlayer(result, "a");
    expect(view.personal.playerId).toBe("a");
    expect(view.personalBets.every((bet) => bet.playerId === "a")).toBe(true);
    expect(view.personalComeBets.every((bet) => bet.playerId === "a")).toBe(true);
    expect(view.personalOdds.every((bet) => bet.playerId === "a")).toBe(true);
  });

  it("rotates shooter and resets ATS after seven-out", () => {
    const established = settleConfirmedLiveCrapsPhysicalRoll(state(), confirmed(3, 3));
    const seven = settleConfirmedLiveCrapsPhysicalRoll({ ...established, table: established.table, ats: established.ats }, confirmed(3, 4));
    expect(seven.table.shooterSeat).toBe(1);
    expect(seven.ats.shooterId).toBe("b");
    expect(seven.ats.covered).toEqual([]);
  });

  it("loses an established Come flat bet on a come-out 7 while default-off Come odds are returned", () => {
    const t = { ...table(), point: null as null };
    const result = settleConfirmedLiveCrapsPhysicalRoll(state({
      table: t,
      bankrolls: [{ playerId: "a", chips: 970 }, { playerId: "b", chips: 1000 }],
      comeBets: [{ id: "come-9", playerId: "a", kind: "come", amount: 10, point: 9 }],
      odds: [{ id: "odds-9", playerId: "a", parentBetId: "come-9", parentKind: "come", side: "pass", point: 9, amount: 20, workingOverride: null }],
    }), confirmed(3, 4));
    expect(result.comeSettlements[0]).toMatchObject({ betId: "come-9", status: "lost", profit: -10 });
    expect(result.oddsSettlements[0]).toMatchObject({ betId: "odds-9", status: "returned", credit: 20, profit: 0 });
    expect(result.odds).toHaveLength(0);
  });

  it("settles Come flat and working odds together when the Come number hits", () => {
    const t = { ...table(), point: 6 as const };
    const result = settleConfirmedLiveCrapsPhysicalRoll(state({
      table: t,
      bankrolls: [{ playerId: "a", chips: 970 }, { playerId: "b", chips: 1000 }],
      comeBets: [{ id: "come-9", playerId: "a", kind: "come", amount: 10, point: 9 }],
      odds: [{ id: "odds-9", playerId: "a", parentBetId: "come-9", parentKind: "come", side: "pass", point: 9, amount: 20, workingOverride: null }],
    }), confirmed(4, 5));
    expect(result.comeSettlements[0]).toMatchObject({ status: "won", credit: 20, profit: 10 });
    expect(result.oddsSettlements[0]).toMatchObject({ status: "won", credit: 50, profit: 30 });
    expect(result.playerResults[0]).toMatchObject({ comeCredit: 20, oddsCredit: 50, rollProfit: 40 });
    expect(result.comeBets).toHaveLength(0);
    expect(result.odds).toHaveLength(0);
  });

  it("rejects unconfirmed dice", () => {
    expect(() => settleConfirmedLiveCrapsPhysicalRoll(state(), createLiveCrapsDiceEntry("a"))).toThrow(/confirmed/i);
  });
});
