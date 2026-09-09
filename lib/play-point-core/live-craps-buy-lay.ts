import type { LiveCrapsPoint } from "./live-craps";
import type { LiveCrapsBankroll } from "./live-craps-bets";

export type LiveCrapsBuyLayKind = "buy" | "lay";
export type LiveCrapsBuyLayWorkingOverride = "table-default" | "on" | "off";
export type LiveCrapsBuyLayBet = { id: string; playerId: string; kind: LiveCrapsBuyLayKind; number: LiveCrapsPoint; amount: number; workingOverride: LiveCrapsBuyLayWorkingOverride };
export type LiveCrapsBuyLaySettlement = { betId: string; playerId: string; kind: LiveCrapsBuyLayKind; number: LiveCrapsPoint; stake: number; status: "won" | "lost" | "working" | "off"; grossProfit: number; commission: number; netProfit: number; credit: number; remainsWorking: boolean };

function assertAmount(amount: number) { if (!Number.isInteger(amount) || amount <= 0) throw new Error("Buy/Lay amount must be a positive whole number of chips."); }
export function buyProfit(number: LiveCrapsPoint, amount: number) { if (number === 4 || number === 10) return amount * 2; if (number === 5 || number === 9) return Math.floor(amount * 3 / 2); return Math.floor(amount * 6 / 5); }
export function layProfit(number: LiveCrapsPoint, amount: number) { if (number === 4 || number === 10) return Math.floor(amount / 2); if (number === 5 || number === 9) return Math.floor(amount * 2 / 3); return Math.floor(amount * 5 / 6); }
export function buyLayCommission(kind: LiveCrapsBuyLayKind, number: LiveCrapsPoint, amount: number) { const base = kind === "buy" ? amount : layProfit(number, amount); return Math.ceil(base * 0.05); }

export function isLiveCrapsBuyLayWorking(bet: LiveCrapsBuyLayBet, tablePointBefore: LiveCrapsPoint | null) {
  if (bet.workingOverride === "on") return true;
  if (bet.workingOverride === "off") return false;
  // Standard table: Buy is OFF on come-out; Lay remains ON.
  return tablePointBefore !== null || bet.kind === "lay";
}

export function setLiveCrapsBuyLayWorkingOverride(input: { bets: LiveCrapsBuyLayBet[]; playerId: string; betId: string; workingOverride: LiveCrapsBuyLayWorkingOverride }) {
  const bet = input.bets.find((item) => item.id === input.betId);
  if (!bet) throw new Error("Buy/Lay bet not found.");
  if (bet.playerId !== input.playerId) throw new Error("Only the wager owner may change working status.");
  return input.bets.map((item) => item.id === input.betId ? { ...item, workingOverride: input.workingOverride } : item);
}

export function placeLiveCrapsBuyLayBet(input: { bets: LiveCrapsBuyLayBet[]; bankrolls: LiveCrapsBankroll[]; id: string; playerId: string; kind: LiveCrapsBuyLayKind; number: LiveCrapsPoint; amount: number; workingOverride?: LiveCrapsBuyLayWorkingOverride }) {
  assertAmount(input.amount);
  if (!input.id || input.bets.some((bet) => bet.id === input.id)) throw new Error("Buy/Lay wager id must be unique.");
  const bankroll = input.bankrolls.find((item) => item.playerId === input.playerId);
  if (!bankroll) throw new Error("Player bankroll not found.");
  if (bankroll.chips < input.amount) throw new Error("Not enough chips for that wager.");
  return { bets: [...input.bets, { id: input.id, playerId: input.playerId, kind: input.kind, number: input.number, amount: input.amount, workingOverride: input.workingOverride ?? "table-default" }], bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips - input.amount } : item) };
}

export function settleLiveCrapsBuyLay(input: { bets: LiveCrapsBuyLayBet[]; bankrolls: LiveCrapsBankroll[]; total: number; tablePointBefore: LiveCrapsPoint | null }) {
  const keep: LiveCrapsBuyLayBet[] = []; const settlements: LiveCrapsBuyLaySettlement[] = []; const credits = new Map<string, number>();
  const credit = (id: string, amount: number) => credits.set(id, (credits.get(id) ?? 0) + amount);
  for (const bet of input.bets) {
    if (!isLiveCrapsBuyLayWorking(bet, input.tablePointBefore)) { keep.push(bet); settlements.push({ betId: bet.id, playerId: bet.playerId, kind: bet.kind, number: bet.number, stake: bet.amount, status: "off", grossProfit: 0, commission: 0, netProfit: 0, credit: 0, remainsWorking: true }); continue; }
    const wins = bet.kind === "buy" ? input.total === bet.number : input.total === 7;
    const loses = bet.kind === "buy" ? input.total === 7 : input.total === bet.number;
    if (!wins && !loses) { keep.push(bet); settlements.push({ betId: bet.id, playerId: bet.playerId, kind: bet.kind, number: bet.number, stake: bet.amount, status: "working", grossProfit: 0, commission: 0, netProfit: 0, credit: 0, remainsWorking: true }); continue; }
    if (loses) { settlements.push({ betId: bet.id, playerId: bet.playerId, kind: bet.kind, number: bet.number, stake: bet.amount, status: "lost", grossProfit: 0, commission: 0, netProfit: -bet.amount, credit: 0, remainsWorking: false }); continue; }
    const grossProfit = bet.kind === "buy" ? buyProfit(bet.number, bet.amount) : layProfit(bet.number, bet.amount);
    const commission = buyLayCommission(bet.kind, bet.number, bet.amount); const netProfit = Math.max(0, grossProfit - commission); const amount = bet.amount + netProfit;
    credit(bet.playerId, amount); settlements.push({ betId: bet.id, playerId: bet.playerId, kind: bet.kind, number: bet.number, stake: bet.amount, status: "won", grossProfit, commission, netProfit, credit: amount, remainsWorking: false });
  }
  return { bets: keep, settlements, bankrolls: input.bankrolls.map((item) => ({ ...item, chips: item.chips + (credits.get(item.playerId) ?? 0) })) };
}
