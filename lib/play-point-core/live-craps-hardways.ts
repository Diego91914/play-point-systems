export type LiveCrapsHardwayNumber = 4 | 6 | 8 | 10;
export type LiveCrapsHardwayWorkingOverride = "table-default" | "on" | "off";

export type LiveCrapsHardwayBet = {
  id: string;
  playerId: string;
  number: LiveCrapsHardwayNumber;
  amount: number;
  workingOverride: LiveCrapsHardwayWorkingOverride;
};

export type LiveCrapsHardwayReceipt = {
  betId: string;
  playerId: string;
  number: LiveCrapsHardwayNumber;
  stake: number;
  status: "won" | "lost" | "working" | "off";
  credit: number;
  profit: number;
  remainsWorking: boolean;
};

export const LIVE_CRAPS_HARDWAY_PROFIT_ODDS: Record<LiveCrapsHardwayNumber, number> = { 4: 7, 6: 9, 8: 9, 10: 7 };

function assertDie(value: number) { if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error("Each die must be an integer from 1 through 6."); }

export function isLiveCrapsHardway(number: LiveCrapsHardwayNumber, die1: number, die2: number) {
  assertDie(die1); assertDie(die2);
  return die1 === die2 && die1 + die2 === number;
}

// Play Amplified Standard follows the MGM convention: Hardways are OFF on a come-out unless the owner calls them ON.
export function isLiveCrapsHardwayWorking(bet: LiveCrapsHardwayBet, tablePointBefore: number | null) {
  if (bet.workingOverride === "on") return true;
  if (bet.workingOverride === "off") return false;
  return tablePointBefore !== null;
}

export function setLiveCrapsHardwayWorkingOverride(input: { bets: LiveCrapsHardwayBet[]; playerId: string; betId: string; workingOverride: LiveCrapsHardwayWorkingOverride }) {
  const bet = input.bets.find((item) => item.id === input.betId);
  if (!bet) throw new Error("Hardway bet not found.");
  if (bet.playerId !== input.playerId) throw new Error("Only the wager owner may change Hardway working status.");
  return input.bets.map((item) => item.id === input.betId ? { ...item, workingOverride: input.workingOverride } : item);
}

export function settleLiveCrapsHardways(input: { bets: LiveCrapsHardwayBet[]; die1: number; die2: number; tablePointBefore: number | null }) {
  assertDie(input.die1); assertDie(input.die2);
  const total = input.die1 + input.die2;
  const remaining: LiveCrapsHardwayBet[] = [];
  const receipts: LiveCrapsHardwayReceipt[] = [];

  for (const bet of input.bets) {
    if (!isLiveCrapsHardwayWorking(bet, input.tablePointBefore)) {
      remaining.push(bet);
      receipts.push({ betId: bet.id, playerId: bet.playerId, number: bet.number, stake: bet.amount, status: "off", credit: 0, profit: 0, remainsWorking: true });
      continue;
    }
    if (isLiveCrapsHardway(bet.number, input.die1, input.die2)) {
      const profit = bet.amount * LIVE_CRAPS_HARDWAY_PROFIT_ODDS[bet.number];
      remaining.push(bet);
      receipts.push({ betId: bet.id, playerId: bet.playerId, number: bet.number, stake: bet.amount, status: "won", credit: profit, profit, remainsWorking: true });
      continue;
    }
    if (total === 7 || total === bet.number) {
      receipts.push({ betId: bet.id, playerId: bet.playerId, number: bet.number, stake: bet.amount, status: "lost", credit: 0, profit: -bet.amount, remainsWorking: false });
      continue;
    }
    remaining.push(bet);
    receipts.push({ betId: bet.id, playerId: bet.playerId, number: bet.number, stake: bet.amount, status: "working", credit: 0, profit: 0, remainsWorking: true });
  }
  return { bets: remaining, receipts };
}
