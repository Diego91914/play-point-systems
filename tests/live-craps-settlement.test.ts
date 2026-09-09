import { describe, expect, it } from "vitest";
import { createLiveCrapsTable } from "../lib/play-point-core/live-craps";
import { createLiveCrapsBankrolls, placeLiveCrapsBet } from "../lib/play-point-core/live-craps-bets";
import { createLiveCrapsAtsState } from "../lib/play-point-core/live-craps-ats";
import { confirmLiveCrapsDiceEntry, createLiveCrapsDiceEntry, selectLiveCrapsDie } from "../lib/play-point-core/live-craps-dice-entry";
import { projectLiveCrapsSettlementForPlayer, settleConfirmedLiveCrapsPhysicalRoll } from "../lib/play-point-core/live-craps-settlement";

const table = () => createLiveCrapsTable({ players: [{ id: "a", name: "A", seat: 0 }, { id: "b", name: "B", seat: 1 }] });
const confirmed = (die1: number, die2: number) => {
  let entry = createLiveCrapsDiceEntry("a");
  entry = selectLiveCrapsDie(entry, 1, die1);
  entry = selectLiveCrapsDie(entry, 2, die2);
  return confirmLiveCrapsDiceEntry(entry, "a");
};

describe("Live Craps unified settlement", () => {
  it("settles a confirmed physical roll and updates point", () => {
    const t = table();
    let bankrolls = createLiveCrapsBankrolls(["a", "b"]);
    const placed = placeLiveCrapsBet({ bets: [], bankrolls, playerId: "b", kind: "pass-line", amount: 25, point: null, id: "p" });
    bankrolls = placed.bankrolls;
    const result = settleConfirmedLiveCrapsPhysicalRoll({ table: t, bets: placed.bets, bankrolls, ats: createLiveCrapsAtsState("a") }, confirmed(3, 3));
    expect(result.roll.total).toBe(6);
    expect(result.table.point).toBe(6);
    expect(result.bets).toHaveLength(1);
  });

  it("returns personalized results without another player's bets", () => {
    const t = table();
    let bankrolls = createLiveCrapsBankrolls(["a", "b"]);
    const first = placeLiveCrapsBet({ bets: [], bankrolls, playerId: "a", kind: "field", amount: 10, point: null, id: "a-field" });
    const second = placeLiveCrapsBet({ bets: first.bets, bankrolls: first.bankrolls, playerId: "b", kind: "pass-line", amount: 20, point: null, id: "b-pass" });
    const result = settleConfirmedLiveCrapsPhysicalRoll({ table: t, bets: second.bets, bankrolls: second.bankrolls, ats: createLiveCrapsAtsState("a") }, confirmed(3, 4));
    const view = projectLiveCrapsSettlementForPlayer(result, "a");
    expect(view.personal.playerId).toBe("a");
    expect(view.personalBets.every((bet) => bet.playerId === "a")).toBe(true);
  });

  it("rotates shooter and resets ATS after seven-out", () => {
    const established = settleConfirmedLiveCrapsPhysicalRoll({ table: table(), bets: [], bankrolls: createLiveCrapsBankrolls(["a", "b"]), ats: createLiveCrapsAtsState("a") }, confirmed(3, 3));
    const seven = settleConfirmedLiveCrapsPhysicalRoll({ table: established.table, bets: established.bets, bankrolls: established.bankrolls, ats: established.ats }, confirmed(3, 4));
    expect(seven.table.shooterSeat).toBe(1);
    expect(seven.ats.shooterId).toBe("b");
    expect(seven.ats.covered).toEqual([]);
  });

  it("rejects unconfirmed dice", () => {
    expect(() => settleConfirmedLiveCrapsPhysicalRoll({ table: table(), bets: [], bankrolls: createLiveCrapsBankrolls(["a", "b"]), ats: createLiveCrapsAtsState("a") }, createLiveCrapsDiceEntry("a"))).toThrow(/confirmed/i);
  });
});
