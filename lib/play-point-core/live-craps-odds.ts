import type { LiveCrapsBankroll } from "./live-craps-bets";
import type { LiveCrapsPoint } from "./live-craps";

export type LiveCrapsOddsSide = "pass" | "dont-pass";
export type LiveCrapsOddsParentKind = "pass-line" | "dont-pass" | "come" | "dont-come";
export type LiveCrapsOddsWorkingOverride = "table-default" | "on" | "off";
export type LiveCrapsOddsBet = {
  id: string;
  playerId: string;
  parentBetId: string;
  parentKind: LiveCrapsOddsParentKind;
  side: LiveCrapsOddsSide;
  point: LiveCrapsPoint;
  amount: number;
  workingOverride: LiveCrapsOddsWorkingOverride;
};
export type LiveCrapsOddsSettlement = { betId: string; playerId: string; parentBetId: string; status: "won" | "lost" | "working" | "off" | "returned"; stake: number; credit: number; profit: number };

export function maxLiveCrapsPassOdds(lineAmount: number, point: LiveCrapsPoint) {
  if (point === 4 || point === 10) return lineAmount * 3;
  if (point === 5 || point === 9) return lineAmount * 4;
  return lineAmount * 5;
}
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
function expectedSide(parentKind: LiveCrapsOddsParentKind): LiveCrapsOddsSide { return parentKind === "pass-line" || parentKind === "come" ? "pass" : "dont-pass"; }
export function isLiveCrapsOddsWorking(bet: LiveCrapsOddsBet, tablePointBefore: LiveCrapsPoint | null) {
  if (bet.workingOverride === "on") return true;
  if (bet.workingOverride === "off") return false;
  if (tablePointBefore !== null) return true;
  if (bet.parentKind === "come") return false;
  if (bet.parentKind === "dont-come") return true;
  return true;
}
export function setLiveCrapsOddsWorkingOverride(input: { odds: LiveCrapsOddsBet[]; playerId: string; betId: string; workingOverride: LiveCrapsOddsWorkingOverride }) {
  const bet = input.odds.find((item) => item.id === input.betId);
  if (!bet) throw new Error("Odds bet not found.");
  if (bet.playerId !== input.playerId) throw new Error("Only the wager owner may change odds working status.");
  return input.odds.map((item) => item.id === input.betId ? { ...item, workingOverride: input.workingOverride } : item);
}
export function placeLiveCrapsOdds(input: { odds: LiveCrapsOddsBet[]; bankrolls: LiveCrapsBankroll[]; id: string; playerId: string; parentBetId: string; parentKind: LiveCrapsOddsParentKind; side: LiveCrapsOddsSide; point: LiveCrapsPoint; lineAmount: number; amount: number; workingOverride?: LiveCrapsOddsWorkingOverride }) {
  if (!input.id || !input.parentBetId) throw new Error("Odds and parent wager IDs are required.");
  if (input.odds.some((item) => item.id === input.id)) throw new Error("Odds wager id must be unique.");
  if (input.odds.some((item) => item.parentBetId === input.parentBetId)) throw new Error("That parent wager already has odds attached.");
  if (expectedSide(input.parentKind) !== input.side) throw new Error("Odds side does not match the parent wager.");
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("Odds amount must be a positive whole number of chips.");
  const max = input.side === "pass" ? maxLiveCrapsPassOdds(input.lineAmount, input.point) : maxLiveCrapsDontOdds(input.lineAmount);
  if (input.amount > max) throw new Error(`Odds exceed the Standard Table maximum of ${max} chips.`);
  const bankroll = input.bankrolls.find((item) => item.playerId === input.playerId);
  if (!bankroll || bankroll.chips < input.amount) throw new Error("Not enough chips for those odds.");
  return { odds: [...input.odds, { id: input.id, playerId: input.playerId, parentBetId: input.parentBetId, parentKind: input.parentKind, side: input.side, point: input.point, amount: input.amount, workingOverride: input.workingOverride ?? "table-default" }], bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips - input.amount } : item) };
}
export function settleLiveCrapsOdds(input: { odds: LiveCrapsOddsBet[]; bankrolls: LiveCrapsBankroll[]; total: number; tablePointBefore: LiveCrapsPoint | null; survivingParentBetIds?: ReadonlySet<string> }) {
  const keep: LiveCrapsOddsBet[] = [];
  const settlements: LiveCrapsOddsSettlement[] = [];
  const credits = new Map<string, number>();
  const add = (playerId: string, amount: number) => credits.set(playerId, (credits.get(playerId) ?? 0) + amount);
  for (const bet of input.odds) {
    const parentSurvives = input.survivingParentBetIds?.has(bet.parentBetId) ?? true;
    if (!isLiveCrapsOddsWorking(bet, input.tablePointBefore)) {
      if (!parentSurvives) {
        add(bet.playerId, bet.amount);
        settlements.push({ betId: bet.id, playerId: bet.playerId, parentBetId: bet.parentBetId, status: "returned", stake: bet.amount, credit: bet.amount, profit: 0 });
      } else {
        keep.push(bet);
        settlements.push({ betId: bet.id, playerId: bet.playerId, parentBetId: bet.parentBetId, status: "off", stake: bet.amount, credit: 0, profit: 0 });
      }
      continue;
    }
    const wins = bet.side === "pass" ? input.total === bet.point : input.total === 7;
    const loses = bet.side === "pass" ? input.total === 7 : input.total === bet.point;
    if (!wins && !loses) { keep.push(bet); settlements.push({ betId: bet.id, playerId: bet.playerId, parentBetId: bet.parentBetId, status: "working", stake: bet.amount, credit: 0, profit: 0 }); continue; }
    if (loses) { settlements.push({ betId: bet.id, playerId: bet.playerId, parentBetId: bet.parentBetId, status: "lost", stake: bet.amount, credit: 0, profit: -bet.amount }); continue; }
    const profit = bet.side === "pass" ? liveCrapsPassOddsProfit(bet.amount, bet.point) : liveCrapsDontOddsProfit(bet.amount, bet.point);
    const credit = bet.amount + profit;
    add(bet.playerId, credit);
    settlements.push({ betId: bet.id, playerId: bet.playerId, parentBetId: bet.parentBetId, status: "won", stake: bet.amount, credit, profit });
  }
  return { odds: keep, settlements, bankrolls: input.bankrolls.map((item) => ({ ...item, chips: item.chips + (credits.get(item.playerId) ?? 0) })) };
}
