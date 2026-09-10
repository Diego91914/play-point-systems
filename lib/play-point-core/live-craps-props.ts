import type { LiveCrapsBankroll } from "./live-craps-bets";

// Canonical Standard Table center propositions. Optional/legacy props belong in named future layouts, not this engine surface.
export type LiveCrapsPropKind = "any-seven" | "any-craps" | "two" | "three" | "eleven" | "twelve" | "horn" | "ce";
export type LiveCrapsPropBet = { id: string; playerId: string; kind: LiveCrapsPropKind; amount: number };
export type LiveCrapsPropSettlement = { betId: string; playerId: string; kind: LiveCrapsPropKind; stake: number; credit: number; profit: number; status: "won" | "lost" };

const STANDARD_PROP_KINDS = new Set<LiveCrapsPropKind>(["any-seven", "any-craps", "two", "three", "eleven", "twelve", "horn", "ce"]);

function assertAmount(amount: number, divisor = 1) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Prop wager must be a positive whole number of chips.");
  if (amount % divisor !== 0) throw new Error(`This combination wager must be made in ${divisor}-chip units.`);
}

export function validateLiveCrapsPropBet(bet: LiveCrapsPropBet) {
  if (!bet.id.trim() || !bet.playerId.trim()) throw new Error("Prop wager identity is required.");
  if (!STANDARD_PROP_KINDS.has(bet.kind)) throw new Error("That proposition is not available on the Standard Table.");
  if (bet.kind === "horn") assertAmount(bet.amount, 4);
  else if (bet.kind === "ce") assertAmount(bet.amount, 2);
  else assertAmount(bet.amount);
  return bet;
}

export function placeLiveCrapsPropBet(input: { bets: LiveCrapsPropBet[]; bankrolls: LiveCrapsBankroll[]; bet: LiveCrapsPropBet }) {
  validateLiveCrapsPropBet(input.bet);
  if (input.bets.some((bet) => bet.id === input.bet.id)) throw new Error("Prop wager id must be unique.");
  const bankroll = input.bankrolls.find((item) => item.playerId === input.bet.playerId);
  if (!bankroll) throw new Error("Player bankroll not found.");
  if (bankroll.chips < input.bet.amount) throw new Error("Not enough chips for that wager.");
  return {
    bets: [...input.bets, input.bet],
    bankrolls: input.bankrolls.map((item) => item.playerId === input.bet.playerId ? { ...item, chips: item.chips - input.bet.amount } : item),
  };
}

function singleProfit(kind: Exclude<LiveCrapsPropKind, "horn" | "ce">, stake: number, total: number) {
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

export function settleLiveCrapsPropBet(bet: LiveCrapsPropBet, die1: number, die2: number): LiveCrapsPropSettlement {
  validateLiveCrapsPropBet(bet);
  if (![die1, die2].every((die) => Number.isInteger(die) && die >= 1 && die <= 6)) throw new Error("Each die must be 1 through 6.");
  const total = die1 + die2;
  const profit = bet.kind === "horn" ? hornProfit(bet.amount, total) : bet.kind === "ce" ? ceProfit(bet.amount, total) : singleProfit(bet.kind, bet.amount, total);
  const won = profit >= 0;
  return { betId: bet.id, playerId: bet.playerId, kind: bet.kind, stake: bet.amount, status: won ? "won" : "lost", profit, credit: won ? bet.amount + profit : 0 };
}

// Props are one-roll wagers: all are removed after this settlement. Credits are applied exactly once here.
export function settleLiveCrapsPropBets(input: { bets: LiveCrapsPropBet[]; bankrolls: LiveCrapsBankroll[]; die1: number; die2: number }) {
  const settlements = input.bets.map((bet) => settleLiveCrapsPropBet(bet, input.die1, input.die2));
  const credits = new Map<string, number>();
  for (const receipt of settlements) if (receipt.credit) credits.set(receipt.playerId, (credits.get(receipt.playerId) ?? 0) + receipt.credit);
  return {
    bets: [] as LiveCrapsPropBet[],
    settlements,
    bankrolls: input.bankrolls.map((item) => ({ ...item, chips: item.chips + (credits.get(item.playerId) ?? 0) })),
  };
}
