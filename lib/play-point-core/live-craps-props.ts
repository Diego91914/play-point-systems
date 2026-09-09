export type LiveCrapsPropKind = "any-seven" | "any-craps" | "two" | "three" | "eleven" | "twelve" | "horn" | "ce" | "world";
export type LiveCrapsPropBet = { id: string; playerId: string; kind: LiveCrapsPropKind; amount: number };
export type LiveCrapsPropSettlement = { betId: string; playerId: string; kind: LiveCrapsPropKind; stake: number; credit: number; profit: number; status: "won" | "lost" };

function assertAmount(amount: number, divisor = 1) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Prop wager must be a positive whole number of chips.");
  if (amount % divisor !== 0) throw new Error(`This combination wager must be made in ${divisor}-chip units.`);
}

export function validateLiveCrapsPropBet(bet: LiveCrapsPropBet) {
  if (!bet.id || !bet.playerId) throw new Error("Prop wager identity is required.");
  if (bet.kind === "horn") assertAmount(bet.amount, 4);
  else if (bet.kind === "ce") assertAmount(bet.amount, 2);
  else if (bet.kind === "world") assertAmount(bet.amount, 5);
  else assertAmount(bet.amount);
  return bet;
}

function singleProfit(kind: Exclude<LiveCrapsPropKind, "horn" | "ce" | "world">, stake: number, total: number) {
  if (kind === "any-seven") return total === 7 ? stake * 4 : -stake;
  if (kind === "any-craps") return total === 2 || total === 3 || total === 12 ? stake * 7 : -stake;
  if (kind === "two") return total === 2 ? stake * 30 : -stake;
  if (kind === "three") return total === 3 ? stake * 15 : -stake;
  if (kind === "eleven") return total === 11 ? stake * 15 : -stake;
  return total === 12 ? stake * 30 : -stake;
}

function hornProfit(amount: number, total: number) {
  const unit = amount / 4;
  if (total === 2 || total === 12) return unit * 30 - unit * 3;
  if (total === 3 || total === 11) return unit * 15 - unit * 3;
  return -amount;
}

function ceProfit(amount: number, total: number) {
  const unit = amount / 2;
  if (total === 11) return unit * 15 - unit;
  if (total === 2 || total === 3 || total === 12) return unit * 7 - unit;
  return -amount;
}

function worldProfit(amount: number, total: number) {
  const unit = amount / 5;
  if (total === 7) return unit * 4 - unit * 4;
  if (total === 2 || total === 12) return unit * 30 - unit * 4;
  if (total === 3 || total === 11) return unit * 15 - unit * 4;
  return -amount;
}

export function settleLiveCrapsPropBet(bet: LiveCrapsPropBet, die1: number, die2: number): LiveCrapsPropSettlement {
  validateLiveCrapsPropBet(bet);
  if (![die1, die2].every((die) => Number.isInteger(die) && die >= 1 && die <= 6)) throw new Error("Each die must be 1 through 6.");
  const total = die1 + die2;
  let profit: number;
  if (bet.kind === "horn") profit = hornProfit(bet.amount, total);
  else if (bet.kind === "ce") profit = ceProfit(bet.amount, total);
  else if (bet.kind === "world") profit = worldProfit(bet.amount, total);
  else profit = singleProfit(bet.kind, bet.amount, total);
  const won = profit >= 0;
  return { betId: bet.id, playerId: bet.playerId, kind: bet.kind, stake: bet.amount, status: won ? "won" : "lost", profit, credit: won ? bet.amount + profit : 0 };
}

export function settleLiveCrapsPropBets(bets: LiveCrapsPropBet[], die1: number, die2: number) {
  return bets.map((bet) => settleLiveCrapsPropBet(bet, die1, die2));
}
