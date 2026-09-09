import { settleLiveCrapsBets, type LiveCrapsBankroll, type LiveCrapsBet, type LiveCrapsBetSettlement } from "./live-craps-bets";
import { liveCrapsAtsCredit, recordLiveCrapsAtsRoll, type LiveCrapsAtsBet, type LiveCrapsAtsState } from "./live-craps-ats";
import { settlePendingLiveCrapsRoll, submitLiveCrapsRoll, type LiveCrapsTable } from "./live-craps";
import type { LiveCrapsDiceEntry } from "./live-craps-dice-entry";

export type LiveCrapsAtsSettlement = {
  betId: string;
  playerId: string;
  kind: LiveCrapsAtsBet["kind"];
  stake: number;
  status: "won" | "lost";
  credit: number;
  profit: number;
};

export type LiveCrapsPlayerRollResult = {
  playerId: string;
  bankrollBefore: number;
  bankrollAfter: number;
  regularCredit: number;
  regularProfit: number;
  atsCredit: number;
  atsProfit: number;
  totalCredit: number;
  rollProfit: number;
};

export type LiveCrapsPublicPayout = {
  playerId: string;
  playerName: string;
  seat: number;
  payout: number;
  profit: number;
  result: "won" | "lost" | "push-or-working";
};

export type LiveCrapsSettlementState = {
  table: LiveCrapsTable;
  bets: LiveCrapsBet[];
  bankrolls: LiveCrapsBankroll[];
  ats: LiveCrapsAtsState;
};

export type LiveCrapsSettlementResult = LiveCrapsSettlementState & {
  roll: { id: string; shooterId: string; die1: number; die2: number; total: number };
  regularSettlements: LiveCrapsBetSettlement[];
  atsSettlements: LiveCrapsAtsSettlement[];
  playerResults: LiveCrapsPlayerRollResult[];
  publicPayouts: LiveCrapsPublicPayout[];
};

function atsSettlement(bet: LiveCrapsAtsBet, status: "won" | "lost"): LiveCrapsAtsSettlement {
  const credit = status === "won" ? liveCrapsAtsCredit(bet) : 0;
  return {
    betId: bet.id,
    playerId: bet.playerId,
    kind: bet.kind,
    stake: bet.amount,
    status,
    credit,
    profit: status === "won" ? credit - bet.amount : -bet.amount,
  };
}

function sumForPlayer<T>(items: T[], playerId: string, value: (item: T) => number) {
  return items.reduce((sum, item) => {
    const owned = item as T & { playerId: string };
    return owned.playerId === playerId ? sum + value(item) : sum;
  }, 0);
}

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
  const atsSettlements: LiveCrapsAtsSettlement[] = [
    ...atsResult.wins.map((bet) => atsSettlement(bet, "won")),
    ...atsResult.losses.map((bet) => atsSettlement(bet, "lost")),
  ];
  const atsCredits = new Map<string, number>();
  for (const receipt of atsSettlements) {
    if (receipt.credit > 0) atsCredits.set(receipt.playerId, (atsCredits.get(receipt.playerId) ?? 0) + receipt.credit);
  }

  const bankrolls = regular.bankrolls.map((bankroll) => ({ ...bankroll, chips: bankroll.chips + (atsCredits.get(bankroll.playerId) ?? 0) }));
  const table = settlePendingLiveCrapsRoll(submitted);
  const history = table.history[table.history.length - 1];
  const nextShooter = table.players.find((player) => player.seat === table.shooterSeat)!;
  const ats = history.outcome === "seven-out" ? { shooterId: nextShooter.id, covered: [], bets: [] } : atsResult.state;

  const playerResults = bankrolls.map((bankroll) => {
    const bankrollBefore = before.get(bankroll.playerId) ?? bankroll.chips;
    const regularCredit = sumForPlayer(regular.settlements, bankroll.playerId, (receipt) => receipt.credit);
    const regularProfit = sumForPlayer(regular.settlements, bankroll.playerId, (receipt) => receipt.profit);
    const atsCredit = sumForPlayer(atsSettlements, bankroll.playerId, (receipt) => receipt.credit);
    const atsProfit = sumForPlayer(atsSettlements, bankroll.playerId, (receipt) => receipt.profit);
    return {
      playerId: bankroll.playerId,
      bankrollBefore,
      bankrollAfter: bankroll.chips,
      regularCredit,
      regularProfit,
      atsCredit,
      atsProfit,
      totalCredit: regularCredit + atsCredit,
      rollProfit: regularProfit + atsProfit,
    };
  });

  const publicPayouts = table.players
    .map((player) => {
      const result = playerResults.find((item) => item.playerId === player.id)!;
      return {
        playerId: player.id,
        playerName: player.name,
        seat: player.seat,
        payout: result.totalCredit,
        profit: result.rollProfit,
        result: result.rollProfit > 0 ? "won" as const : result.rollProfit < 0 ? "lost" as const : "push-or-working" as const,
      };
    })
    .sort((a, b) => a.seat - b.seat);

  return {
    table,
    bets: regular.bets,
    bankrolls,
    ats,
    roll: { id: history.id, shooterId: history.shooterId, die1: history.die1, die2: history.die2, total: history.total },
    regularSettlements: regular.settlements,
    atsSettlements,
    playerResults,
    publicPayouts,
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
    publicPayouts: result.publicPayouts,
    personal,
    personalSettlements: result.regularSettlements.filter((receipt) => receipt.playerId === playerId),
    personalAtsSettlements: result.atsSettlements.filter((receipt) => receipt.playerId === playerId),
    personalBets: result.bets.filter((bet) => bet.playerId === playerId),
  };
}
