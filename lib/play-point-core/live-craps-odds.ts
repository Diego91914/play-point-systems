import type { LiveCrapsBankroll } from "./live-craps-bets";
import type { LiveCrapsPoint } from "./live-craps";

export type LiveCrapsOddsSide = "pass" | "dont-pass";
export type LiveCrapsOddsBet = { id: string; playerId: string; parentBetId: string; side: LiveCrapsOddsSide; point: LiveCrapsPoint; amount: number };
export type LiveCrapsOddsSettlement = { betId: string; playerId: string; status: "won" | "lost" | "working"; stake: number; credit: number; profit: number };

// Canonical Play Amplified Standard Table: common 3-4-5x odds.
export function maxLiveCrapsPassOdds(lineAmount: number, point: LiveCrapsPoint) {
  if (point === 4 || point === 10) return lineAmount * 3;
  if (point === 5 || point === 9) return lineAmount * 4;
  return lineAmount * 5;
}

// Under 3-4-5x convention the Don't side may lay up to 6x the flat bet at every point,
// producing a maximum win of 3x/4x/5x the flat bet respectively.
export function maxLiveCrapsDontOdds(lineAmount: number) { return lineAmount * 6; }

export function liveCrapsPassOddsProfit(amount: number, point: LiveCrapsPoint) {
  if (point === 4 || point === 10) return amount * 2;
  if (point === 5 || point === 9) return Math.floor((amount * 3) / 2);
  return Math.floor((amount * 6) / 5);
}

export function liveCrapsDontOddsProfit(amount: number, point: LiveCrapsPoint) {
  if (point === 4 || point === 10) return Math.floor(amount / 2);
  if (point === 5 || point === 9) return Math.floor((amount * 2) / 3);
  return Math.floor((amount * 5) / 6);
}

export function placeLiveCrapsOdds(input: { odds: LiveCrapsOddsBet[]; bankrolls: LiveCrapsBankroll[]; id: string; playerId: string; parentBetId: string; side: LiveCrapsOddsSide; point: LiveCrapsPoint; lineAmount: number; amount: number }) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("Odds amount must be a positive whole number of chips.");
  const max = input.side === "pass" ? maxLiveCrapsPassOdds(input.lineAmount, input.point) : maxLiveCrapsDontOdds(input.lineAmount);
  if (input.amount > max) throw new Error(`Odds exceed the Standard Table maximum of ${max} chips.`);
  const bankroll = input.bankrolls.find((item) => item.playerId === input.playerId);
  if (!bankroll || bankroll.chips < input.amount) throw new Error("Not enough chips for those odds.");
  return {
    odds: [...input.odds, { id: input.id, playerId: input.playerId, parentBetId: input.parentBetId, side: input.side, point: input.point, amount: input.amount }],
    bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips - input.amount } : item),
  };
}

export function settleLiveCrapsOdds(input: { odds: LiveCrapsOddsBet[]; bankrolls: LiveCrapsBankroll[]; total: number }) {
  const keep: LiveCrapsOddsBet[] = [];
  const settlements: LiveCrapsOddsSettlement[] = [];
  const credits = new Map<string, number>();
  const add = (playerId: string, amount: number) => credits.set(playerId, (credits.get(playerId) ?? 0) + amount);
  for (const bet of input.odds) {
    const wins = bet.side === "pass" ? input.total === bet.point : input.total === 7;
    const loses = bet.side === "pass" ? input.total === 7 : input.total === bet.point;
    if (!wins && !loses) { keep.push(bet); settlements.push({ betId: bet.id, playerId: bet.playerId, status: "working", stake: bet.amount, credit: 0, profit: 0 }); continue; }
    if (loses) { settlements.push({ betId: bet.id, playerId: bet.playerId, status: "lost", stake: bet.amount, credit: 0, profit: -bet.amount }); continue; }
    const profit = bet.side === "pass" ? liveCrapsPassOddsProfit(bet.amount, bet.point) : liveCrapsDontOddsProfit(bet.amount, bet.point);
    const credit = bet.amount + profit;
    add(bet.playerId, credit);
    settlements.push({ betId: bet.id, playerId: bet.playerId, status: "won", stake: bet.amount, credit, profit });
  }
  return { odds: keep, settlements, bankrolls: input.bankrolls.map((item) => ({ ...item, chips: item.chips + (credits.get(item.playerId) ?? 0) })) };
}
