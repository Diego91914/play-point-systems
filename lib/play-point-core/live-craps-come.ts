import type { LiveCrapsBankroll } from "./live-craps-bets";
import type { LiveCrapsPoint } from "./live-craps";

export type LiveCrapsComeKind = "come" | "dont-come";
export type LiveCrapsComeBet = { id: string; playerId: string; kind: LiveCrapsComeKind; amount: number; point: LiveCrapsPoint | null };
export type LiveCrapsComeSettlement = { betId: string; playerId: string; kind: LiveCrapsComeKind; point: LiveCrapsPoint | null; status: "won" | "lost" | "push" | "point-established" | "working"; credit: number; profit: number; remainsWorking: boolean };

const POINTS = [4, 5, 6, 8, 9, 10] as const;
function isPoint(total: number): total is LiveCrapsPoint { return (POINTS as readonly number[]).includes(total); }

export function placeLiveCrapsComeBet(input: { bets: LiveCrapsComeBet[]; bankrolls: LiveCrapsBankroll[]; playerId: string; kind: LiveCrapsComeKind; amount: number; tablePoint: LiveCrapsPoint | null; id: string }) {
  if (input.tablePoint === null) throw new Error("Come and Don't Come bets require an established table point.");
  if (!input.id.trim()) throw new Error("Come wager id is required.");
  if (input.bets.some((bet) => bet.id === input.id)) throw new Error("Come wager id must be unique.");
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("Bet amount must be a positive whole number of chips.");
  const rack = input.bankrolls.find((b) => b.playerId === input.playerId);
  if (!rack || rack.chips < input.amount) throw new Error("Not enough chips for that bet.");
  return { bets: [...input.bets, { id: input.id, playerId: input.playerId, kind: input.kind, amount: input.amount, point: null }], bankrolls: input.bankrolls.map((b) => b.playerId === input.playerId ? { ...b, chips: b.chips - input.amount } : b) };
}

export function settleLiveCrapsComeBets(input: { bets: LiveCrapsComeBet[]; bankrolls: LiveCrapsBankroll[]; total: number }) {
  const keep: LiveCrapsComeBet[] = [];
  const settlements: LiveCrapsComeSettlement[] = [];
  const credits = new Map<string, number>();
  const credit = (playerId: string, amount: number) => credits.set(playerId, (credits.get(playerId) ?? 0) + amount);
  const receipt = (bet: LiveCrapsComeBet, status: LiveCrapsComeSettlement["status"], amount: number, profit: number, remainsWorking: boolean, point: LiveCrapsPoint | null = bet.point) => settlements.push({ betId: bet.id, playerId: bet.playerId, kind: bet.kind, point, status, credit: amount, profit, remainsWorking });

  for (const bet of input.bets) {
    if (bet.point === null) {
      if (bet.kind === "come") {
        if (input.total === 7 || input.total === 11) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
        else if ([2, 3, 12].includes(input.total)) receipt(bet, "lost", 0, -bet.amount, false);
        else if (isPoint(input.total)) { const moved = { ...bet, point: input.total }; keep.push(moved); receipt(bet, "point-established", 0, 0, true, input.total); }
      } else {
        if (input.total === 2 || input.total === 3) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
        else if (input.total === 12) { credit(bet.playerId, bet.amount); receipt(bet, "push", bet.amount, 0, false); }
        else if (input.total === 7 || input.total === 11) receipt(bet, "lost", 0, -bet.amount, false);
        else if (isPoint(input.total)) { const moved = { ...bet, point: input.total }; keep.push(moved); receipt(bet, "point-established", 0, 0, true, input.total); }
      }
      continue;
    }

    if (bet.kind === "come") {
      if (input.total === bet.point) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
      else if (input.total === 7) receipt(bet, "lost", 0, -bet.amount, false);
      else { keep.push(bet); receipt(bet, "working", 0, 0, true); }
    } else {
      if (input.total === 7) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
      else if (input.total === bet.point) receipt(bet, "lost", 0, -bet.amount, false);
      else { keep.push(bet); receipt(bet, "working", 0, 0, true); }
    }
  }

  return { bets: keep, settlements, bankrolls: input.bankrolls.map((b) => ({ ...b, chips: b.chips + (credits.get(b.playerId) ?? 0) })) };
}
