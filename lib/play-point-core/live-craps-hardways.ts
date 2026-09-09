export type LiveCrapsHardwayNumber = 4 | 6 | 8 | 10;

export type LiveCrapsHardwayBet = {
  id: string;
  playerId: string;
  number: LiveCrapsHardwayNumber;
  amount: number;
  working: boolean;
};

export type LiveCrapsHardwayReceipt = {
  betId: string;
  playerId: string;
  number: LiveCrapsHardwayNumber;
  stake: number;
  status: "won" | "lost" | "working";
  credit: number;
  profit: number;
  remainsWorking: boolean;
};

export const LIVE_CRAPS_HARDWAY_PROFIT_ODDS: Record<LiveCrapsHardwayNumber, number> = {
  4: 7,
  6: 9,
  8: 9,
  10: 7,
};

function assertDie(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error("Each die must be an integer from 1 through 6.");
}

export function isLiveCrapsHardway(number: LiveCrapsHardwayNumber, die1: number, die2: number) {
  assertDie(die1);
  assertDie(die2);
  return die1 === die2 && die1 + die2 === number;
}

/** Hardways are multi-roll wagers: hard composition wins; an easy version of that number or any 7 loses; all other rolls leave the bet working. */
export function settleLiveCrapsHardways(input: { bets: LiveCrapsHardwayBet[]; die1: number; die2: number }) {
  assertDie(input.die1);
  assertDie(input.die2);
  const total = input.die1 + input.die2;
  const remaining: LiveCrapsHardwayBet[] = [];
  const receipts: LiveCrapsHardwayReceipt[] = [];

  for (const bet of input.bets) {
    if (!bet.working) {
      remaining.push(bet);
      receipts.push({ betId: bet.id, playerId: bet.playerId, number: bet.number, stake: bet.amount, status: "working", credit: 0, profit: 0, remainsWorking: true });
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
