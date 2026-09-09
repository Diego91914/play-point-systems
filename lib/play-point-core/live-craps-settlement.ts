import { settleLiveCrapsBets, type LiveCrapsBankroll, type LiveCrapsBet, type LiveCrapsBetSettlement } from "./live-craps-bets";
import { liveCrapsAtsCredit, recordLiveCrapsAtsRoll, type LiveCrapsAtsBet, type LiveCrapsAtsState } from "./live-craps-ats";
import { settleLiveCrapsComeBets, type LiveCrapsComeBet, type LiveCrapsComeSettlement } from "./live-craps-come";
import { settleLiveCrapsOdds, type LiveCrapsOddsBet, type LiveCrapsOddsSettlement } from "./live-craps-odds";
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
  comeCredit: number;
  comeProfit: number;
  oddsCredit: number;
  oddsProfit: number;
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
  comeBets: LiveCrapsComeBet[];
  odds: LiveCrapsOddsBet[];
  bankrolls: LiveCrapsBankroll[];
  ats: LiveCrapsAtsState;
};

export type LiveCrapsSettlementResult = LiveCrapsSettlementState & {
  roll: { id: string; shooterId: string; die1: number; die2: number; total: number };
  regularSettlements: LiveCrapsBetSettlement[];
  comeSettlements: LiveCrapsComeSettlement[];
  oddsSettlements: LiveCrapsOddsSettlement[];
  atsSettlements: LiveCrapsAtsSettlement[];
  playerResults: LiveCrapsPlayerRollResult[];
  publicPayouts: LiveCrapsPublicPayout[];
};

function atsSettlement(bet: LiveCrapsAtsBet, status: "won" | "lost"): LiveCrapsAtsSettlement {
  const credit = status === "won" ? liveCrapsAtsCredit(bet) : 0;
  return { betId: bet.id, playerId: bet.playerId, kind: bet.kind, stake: bet.amount, status, credit, profit: status === "won" ? credit - bet.amount : -bet.amount };
}

function sumForPlayer<T extends { playerId: string }>(items: T[], playerId: string, value: (item: T) => number) {
  return items.reduce((sum, item) => item.playerId === playerId ? sum + value(item) : sum, 0);
}

function liveCrapsComeOut(pointBefore: LiveCrapsTable["point"]) { return pointBefore === null; }

export function settleConfirmedLiveCrapsPhysicalRoll(state: LiveCrapsSettlementState, entry: LiveCrapsDiceEntry): LiveCrapsSettlementResult {
  if (!entry.confirmed || entry.die1 === null || entry.die2 === null) throw new Error("Physical dice must be confirmed before settlement.");
  const shooter = state.table.players.find((player) => player.seat === state.table.shooterSeat);
  if (!shooter || shooter.id !== entry.shooterId) throw new Error("Confirmed dice do not belong to the current shooter.");
  if (state.ats.shooterId !== entry.shooterId) throw new Error("ATS state does not belong to the current shooter.");

  const before = new Map(state.bankrolls.map((bankroll) => [bankroll.playerId, bankroll.chips]));
  const pointBefore = state.table.point;
  const submitted = submitLiveCrapsRoll(state.table, { shooterId: entry.shooterId, die1: entry.die1, die2: entry.die2 });
  const pending = submitted.pendingRoll!;

  // One bankroll flows through every wager family in deterministic order. Each family credits only its own receipts.
  const regular = settleLiveCrapsBets({ bets: state.bets, bankrolls: state.bankrolls, total: pending.total, pointBefore });
  const come = settleLiveCrapsComeBets({ bets: state.comeBets, bankrolls: regular.bankrolls, total: pending.total });
  const odds = settleLiveCrapsOdds({ odds: state.odds, bankrolls: come.bankrolls, total: pending.total, comeOut: liveCrapsComeOut(pointBefore) });

  const atsResult = recordLiveCrapsAtsRoll(state.ats, pending.total);
  const atsSettlements: LiveCrapsAtsSettlement[] = [
    ...atsResult.wins.map((bet) => atsSettlement(bet, "won")),
    ...atsResult.losses.map((bet) => atsSettlement(bet, "lost")),
  ];
  const atsCredits = new Map<string, number>();
  for (const receipt of atsSettlements) if (receipt.credit > 0) atsCredits.set(receipt.playerId, (atsCredits.get(receipt.playerId) ?? 0) + receipt.credit);

  const bankrolls = odds.bankrolls.map((bankroll) => ({ ...bankroll, chips: bankroll.chips + (atsCredits.get(bankroll.playerId) ?? 0) }));
  const table = settlePendingLiveCrapsRoll(submitted);
  const history = table.history[table.history.length - 1];
  const nextShooter = table.players.find((player) => player.seat === table.shooterSeat)!;
  const ats = history.outcome === "seven-out" ? { shooterId: nextShooter.id, covered: [], bets: [] } : atsResult.state;

  // An odds contract cannot outlive the parent flat contract once that parent resolves.
  const survivingParentIds = new Set<string>([
    ...regular.bets.map((bet) => bet.id),
    ...come.bets.map((bet) => bet.id),
  ]);
  const survivingOdds = odds.odds.filter((bet) => survivingParentIds.has(bet.parentBetId));

  const playerResults = bankrolls.map((bankroll) => {
    const bankrollBefore = before.get(bankroll.playerId) ?? bankroll.chips;
    const regularCredit = sumForPlayer(regular.settlements, bankroll.playerId, (r) => r.credit);
    const regularProfit = sumForPlayer(regular.settlements, bankroll.playerId, (r) => r.profit);
    const comeCredit = sumForPlayer(come.settlements, bankroll.playerId, (r) => r.credit);
    const comeProfit = sumForPlayer(come.settlements, bankroll.playerId, (r) => r.profit);
    const oddsCredit = sumForPlayer(odds.settlements, bankroll.playerId, (r) => r.credit);
    const oddsProfit = sumForPlayer(odds.settlements, bankroll.playerId, (r) => r.profit);
    const atsCredit = sumForPlayer(atsSettlements, bankroll.playerId, (r) => r.credit);
    const atsProfit = sumForPlayer(atsSettlements, bankroll.playerId, (r) => r.profit);
    return {
      playerId: bankroll.playerId,
      bankrollBefore,
      bankrollAfter: bankroll.chips,
      regularCredit, regularProfit, comeCredit, comeProfit, oddsCredit, oddsProfit, atsCredit, atsProfit,
      totalCredit: regularCredit + comeCredit + oddsCredit + atsCredit,
      rollProfit: regularProfit + comeProfit + oddsProfit + atsProfit,
    };
  });

  const publicPayouts = table.players.map((player) => {
    const result = playerResults.find((item) => item.playerId === player.id)!;
    return {
      playerId: player.id, playerName: player.name, seat: player.seat, payout: result.totalCredit, profit: result.rollProfit,
      result: result.rollProfit > 0 ? "won" as const : result.rollProfit < 0 ? "lost" as const : "push-or-working" as const,
    };
  }).sort((a, b) => a.seat - b.seat);

  return {
    table, bets: regular.bets, comeBets: come.bets, odds: survivingOdds, bankrolls, ats,
    roll: { id: history.id, shooterId: history.shooterId, die1: history.die1, die2: history.die2, total: history.total },
    regularSettlements: regular.settlements, comeSettlements: come.settlements, oddsSettlements: odds.settlements, atsSettlements,
    playerResults, publicPayouts,
  };
}

export function projectLiveCrapsSettlementForPlayer(result: LiveCrapsSettlementResult, playerId: string) {
  const personal = result.playerResults.find((item) => item.playerId === playerId);
  if (!personal) throw new Error("Player result not found.");
  return {
    roll: result.roll, point: result.table.point, shooterSeat: result.table.shooterSeat, atsCovered: [...result.ats.covered], publicPayouts: result.publicPayouts, personal,
    personalSettlements: result.regularSettlements.filter((r) => r.playerId === playerId),
    personalComeSettlements: result.comeSettlements.filter((r) => r.playerId === playerId),
    personalOddsSettlements: result.oddsSettlements.filter((r) => r.playerId === playerId),
    personalAtsSettlements: result.atsSettlements.filter((r) => r.playerId === playerId),
    personalBets: result.bets.filter((bet) => bet.playerId === playerId),
    personalComeBets: result.comeBets.filter((bet) => bet.playerId === playerId),
    personalOdds: result.odds.filter((bet) => bet.playerId === playerId),
  };
}
