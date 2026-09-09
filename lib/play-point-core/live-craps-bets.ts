import type { LiveCrapsPoint } from "./live-craps";

export const LIVE_CRAPS_STARTING_BANKROLL = 1_000;
export type LiveCrapsBetKind = "pass-line" | "dont-pass" | "field" | "place";
export type LiveCrapsBet = { id: string; playerId: string; kind: LiveCrapsBetKind; amount: number; number?: LiveCrapsPoint };
export type LiveCrapsBankroll = { playerId: string; chips: number };

export function createLiveCrapsBankrolls(playerIds: string[], starting = LIVE_CRAPS_STARTING_BANKROLL): LiveCrapsBankroll[] {
  if (!Number.isInteger(starting) || starting <= 0) throw new Error("Starting bankroll must be a positive integer.");
  return playerIds.map((playerId) => ({ playerId, chips: starting }));
}

export function placeLiveCrapsBet(input: {
  bets: LiveCrapsBet[];
  bankrolls: LiveCrapsBankroll[];
  playerId: string;
  kind: LiveCrapsBetKind;
  amount: number;
  point: LiveCrapsPoint | null;
  number?: LiveCrapsPoint;
  id: string;
}) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("Bet amount must be a positive whole number of chips.");
  const bankroll = input.bankrolls.find((item) => item.playerId === input.playerId);
  if (!bankroll) throw new Error("Player bankroll not found.");
  if (bankroll.chips < input.amount) throw new Error("Not enough chips for that bet.");
  if ((input.kind === "pass-line" || input.kind === "dont-pass") && input.point !== null) throw new Error("Line bets can only be placed on the come-out roll in v1.");
  if (input.kind === "place" && (!input.number || input.number === 7)) throw new Error("Place bet requires 4, 5, 6, 8, 9, or 10.");

  return {
    bets: [...input.bets, { id: input.id, playerId: input.playerId, kind: input.kind, amount: input.amount, number: input.number }],
    bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips - input.amount } : item),
  };
}

function profitForPlace(number: LiveCrapsPoint, amount: number) {
  // Whole-chip settlement; UI should constrain recommended bet units to avoid rounding.
  if (number === 4 || number === 10) return Math.floor((amount * 9) / 5);
  if (number === 5 || number === 9) return Math.floor((amount * 7) / 5);
  return Math.floor((amount * 7) / 6); // 6 or 8
}

export function settleLiveCrapsBets(input: {
  bets: LiveCrapsBet[];
  bankrolls: LiveCrapsBankroll[];
  total: number;
  pointBefore: LiveCrapsPoint | null;
}) {
  const keep: LiveCrapsBet[] = [];
  const credits = new Map<string, number>();
  const credit = (playerId: string, amount: number) => credits.set(playerId, (credits.get(playerId) ?? 0) + amount);

  for (const bet of input.bets) {
    if (bet.kind === "field") {
      if ([3, 4, 9, 10, 11].includes(input.total)) credit(bet.playerId, bet.amount * 2);
      else if (input.total === 2 || input.total === 12) credit(bet.playerId, bet.amount * 3);
      continue;
    }

    if (bet.kind === "place") {
      if (input.total === 7) continue;
      if (input.total === bet.number) credit(bet.playerId, bet.amount + profitForPlace(bet.number!, bet.amount));
      else keep.push(bet);
      continue;
    }

    if (input.pointBefore === null) {
      if (bet.kind === "pass-line") {
        if (input.total === 7 || input.total === 11) credit(bet.playerId, bet.amount * 2);
        else if ([2, 3, 12].includes(input.total)) { /* loses */ }
        else keep.push(bet);
      } else {
        if (input.total === 2 || input.total === 3) credit(bet.playerId, bet.amount * 2);
        else if (input.total === 12) credit(bet.playerId, bet.amount); // push
        else if (input.total === 7 || input.total === 11) { /* loses */ }
        else keep.push(bet);
      }
      continue;
    }

    if (bet.kind === "pass-line") {
      if (input.total === input.pointBefore) credit(bet.playerId, bet.amount * 2);
      else if (input.total === 7) { /* loses */ }
      else keep.push(bet);
    } else {
      if (input.total === 7) credit(bet.playerId, bet.amount * 2);
      else if (input.total === input.pointBefore) { /* loses */ }
      else keep.push(bet);
    }
  }

  return {
    bets: keep,
    bankrolls: input.bankrolls.map((item) => ({ ...item, chips: item.chips + (credits.get(item.playerId) ?? 0) })),
  };
}
