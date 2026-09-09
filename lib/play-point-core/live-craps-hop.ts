export type LiveCrapsDieFace = 1 | 2 | 3 | 4 | 5 | 6;

export type LiveCrapsHopBet = {
  id: string;
  playerId: string;
  dieLow: LiveCrapsDieFace;
  dieHigh: LiveCrapsDieFace;
  stake: number;
};

export type LiveCrapsHopSettlement = {
  betId: string;
  playerId: string;
  stake: number;
  combination: string;
  status: "won" | "lost";
  payoutOdds: 15 | 30;
  credit: number;
  profit: number;
};

function assertFace(value: number): asserts value is LiveCrapsDieFace {
  if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error("Hop dice must be faces 1 through 6.");
}

export function normalizeLiveCrapsHop(die1: number, die2: number): [LiveCrapsDieFace, LiveCrapsDieFace] {
  assertFace(die1);
  assertFace(die2);
  return die1 <= die2 ? [die1, die2] : [die2, die1];
}

export function liveCrapsHopPayoutOdds(die1: number, die2: number): 15 | 30 {
  const [low, high] = normalizeLiveCrapsHop(die1, die2);
  return low === high ? 30 : 15;
}

export function createLiveCrapsHopBet(input: { id: string; playerId: string; die1: number; die2: number; stake: number }): LiveCrapsHopBet {
  if (!input.id || !input.playerId) throw new Error("Hop bet and player IDs are required.");
  if (!Number.isInteger(input.stake) || input.stake <= 0) throw new Error("Hop stake must be a positive whole number of chips.");
  const [dieLow, dieHigh] = normalizeLiveCrapsHop(input.die1, input.die2);
  return { id: input.id, playerId: input.playerId, dieLow, dieHigh, stake: input.stake };
}

export function settleLiveCrapsHopBets(bets: LiveCrapsHopBet[], die1: number, die2: number): LiveCrapsHopSettlement[] {
  const [rolledLow, rolledHigh] = normalizeLiveCrapsHop(die1, die2);
  return bets.map((bet) => {
    const payoutOdds = liveCrapsHopPayoutOdds(bet.dieLow, bet.dieHigh);
    const won = bet.dieLow === rolledLow && bet.dieHigh === rolledHigh;
    return {
      betId: bet.id,
      playerId: bet.playerId,
      stake: bet.stake,
      combination: `${bet.dieLow}-${bet.dieHigh}`,
      status: won ? "won" : "lost",
      payoutOdds,
      credit: won ? bet.stake * (payoutOdds + 1) : 0,
      profit: won ? bet.stake * payoutOdds : -bet.stake,
    };
  });
}
