import { settleLiveCrapsBets, type LiveCrapsBankroll, type LiveCrapsBet } from "./live-craps-bets";
import { liveCrapsAtsCredit, recordLiveCrapsAtsRoll, type LiveCrapsAtsState } from "./live-craps-ats";
import { settlePendingLiveCrapsRoll, submitLiveCrapsRoll, type LiveCrapsTable } from "./live-craps";
import type { LiveCrapsDiceEntry } from "./live-craps-dice-entry";

export type LiveCrapsPlayerRollResult = {
  playerId: string;
  bankrollBefore: number;
  bankrollAfter: number;
  netDelta: number;
  atsCredit: number;
};

export type LiveCrapsSettlementState = {
  table: LiveCrapsTable;
  bets: LiveCrapsBet[];
  bankrolls: LiveCrapsBankroll[];
  ats: LiveCrapsAtsState;
};

export type LiveCrapsSettlementResult = LiveCrapsSettlementState & {
  roll: { id: string; shooterId: string; die1: number; die2: number; total: number };
  playerResults: LiveCrapsPlayerRollResult[];
};

export function settleConfirmedLiveCrapsPhysicalRoll(state: LiveCrapsSettlementState, entry: LiveCrapsDiceEntry): LiveCrapsSettlementResult {
  if (!entry.confirmed || entry.die1 === null || entry.die2 === null) throw new Error("Physical dice must be confirmed before settlement.");
  const shooter = state.table.players.find((player) => player.seat === state.table.shooterSeat);
  if (!shooter || shooter.id !== entry.shooterId) throw new Error("Confirmed dice do not belong to the current shooter.");
  if (state.ats.shooterId !== entry.shooterId) throw new Error("ATS state does not belong to the current shooter.");

  const before = new Map(state.bankrolls.map((bankroll) => [bankroll.playerId, bankroll.chips]));
  const pointBefore = state.table.point;
  const submitted = submitLiveCrapsRoll(state.table, { shooterId: entry.shooterId, die1: entry.die1, die2: entry.die2 });
  const pending = submitted.pendingRoll!;

  const regular = settleLiveCrapsBets({ bets: state.bets, bankrolls: state.bankrolls, total: pending.total, pointBefore });
  const atsResult = recordLiveCrapsAtsRoll(state.ats, pending.total);
  const atsCredits = new Map<string, number>();
  for (const win of atsResult.wins) atsCredits.set(win.playerId, (atsCredits.get(win.playerId) ?? 0) + liveCrapsAtsCredit(win));

  const bankrolls = regular.bankrolls.map((bankroll) => ({ ...bankroll, chips: bankroll.chips + (atsCredits.get(bankroll.playerId) ?? 0) }));
  const table = settlePendingLiveCrapsRoll(submitted);
  const history = table.history[table.history.length - 1];

  // A seven-out ends the old shooter's ATS hand. Start a clean tracker for the new shooter.
  const nextShooter = table.players.find((player) => player.seat === table.shooterSeat)!;
  const ats = history.outcome === "seven-out"
    ? { shooterId: nextShooter.id, covered: [], bets: [] }
    : atsResult.state;

  const playerResults = bankrolls.map((bankroll) => {
    const bankrollBefore = before.get(bankroll.playerId) ?? bankroll.chips;
    return {
      playerId: bankroll.playerId,
      bankrollBefore,
      bankrollAfter: bankroll.chips,
      netDelta: bankroll.chips - bankrollBefore,
      atsCredit: atsCredits.get(bankroll.playerId) ?? 0,
    };
  });

  return {
    table,
    bets: regular.bets,
    bankrolls,
    ats,
    roll: { id: history.id, shooterId: history.shooterId, die1: history.die1, die2: history.die2, total: history.total },
    playerResults,
  };
}

export function projectLiveCrapsSettlementForPlayer(result: LiveCrapsSettlementResult, playerId: string) {
  const personal = result.playerResults.find((item) => item.playerId === playerId);
  if (!personal) throw new Error("Player result not found.");
  return {
    roll: result.roll,
    point: result.table.point,
    shooterSeat: result.table.shooterSeat,
    atsCovered: [...result.ats.covered],
    personal,
    personalBets: result.bets.filter((bet) => bet.playerId === playerId),
  };
}
