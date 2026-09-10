import type { LiveCrapsPoint } from "./live-craps";

export const LIVE_CRAPS_STARTING_BANKROLL = 1_000;
export type LiveCrapsBetKind = "pass-line" | "dont-pass" | "field" | "place";
export type LiveCrapsBet = { id: string; playerId: string; kind: LiveCrapsBetKind; amount: number; number?: LiveCrapsPoint };
export type LiveCrapsBankroll = { playerId: string; chips: number };
export type LiveCrapsBetSettlementStatus = "won" | "lost" | "push" | "working";
export type LiveCrapsBetSettlement = {
  betId: string;
  playerId: string;
  kind: LiveCrapsBetKind;
  number?: LiveCrapsPoint;
  stake: number;
  status: LiveCrapsBetSettlementStatus;
  credit: number;
  profit: number;
  remainsWorking: boolean;
};

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
  if (input.kind === "place" && input.number === undefined) throw new Error("Place bet requires 4, 5, 6, 8, 9, or 10.");

  return {
    bets: [...input.bets, { id: input.id, playerId: input.playerId, kind: input.kind, amount: input.amount, number: input.number }],
    bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips - input.amount } : item),
  };
}

function profitForPlace(number: LiveCrapsPoint, amount: number) {
  if (number === 4 || number === 10) return Math.floor((amount * 9) / 5);
  if (number === 5 || number === 9) return Math.floor((amount * 7) / 5);
  return Math.floor((amount * 7) / 6);
}

export function settleLiveCrapsBets(input: {
  bets: LiveCrapsBet[];
  bankrolls: LiveCrapsBankroll[];
  total: number;
  pointBefore: LiveCrapsPoint | null;
}) {
  const keep: LiveCrapsBet[] = [];
  const settlements: LiveCrapsBetSettlement[] = [];
  const credits = new Map<string, number>();
  const credit = (playerId: string, amount: number) => credits.set(playerId, (credits.get(playerId) ?? 0) + amount);
  const receipt = (bet: LiveCrapsBet, status: LiveCrapsBetSettlementStatus, amount: number, profit: number, remainsWorking: boolean) => {
    settlements.push({ betId: bet.id, playerId: bet.playerId, kind: bet.kind, number: bet.number, stake: bet.amount, status, credit: amount, profit, remainsWorking });
  };

  for (const bet of input.bets) {
    if (bet.kind === "field") {
      if ([3, 4, 9, 10, 11].includes(input.total)) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
      else if (input.total === 2 || input.total === 12) { credit(bet.playerId, bet.amount * 3); receipt(bet, "won", bet.amount * 3, bet.amount * 2, false); }
      else receipt(bet, "lost", 0, -bet.amount, false);
      continue;
    }

    if (bet.kind === "place") {
      if (input.total === 7) { receipt(bet, "lost", 0, -bet.amount, false); continue; }
      if (input.total === bet.number) {
        // Casino-style place bet: the wager stays working and only profit is paid to the rack.
        const profit = profitForPlace(bet.number!, bet.amount);
        credit(bet.playerId, profit);
        keep.push(bet);
        receipt(bet, "won", profit, profit, true);
      } else {
        keep.push(bet);
        receipt(bet, "working", 0, 0, true);
      }
      continue;
    }

    if (input.pointBefore === null) {
      if (bet.kind === "pass-line") {
        if (input.total === 7 || input.total === 11) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
        else if ([2, 3, 12].includes(input.total)) receipt(bet, "lost", 0, -bet.amount, false);
        else { keep.push(bet); receipt(bet, "working", 0, 0, true); }
      } else {
        if (input.total === 2 || input.total === 3) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
        else if (input.total === 12) { credit(bet.playerId, bet.amount); receipt(bet, "push", bet.amount, 0, false); }
        else if (input.total === 7 || input.total === 11) receipt(bet, "lost", 0, -bet.amount, false);
        else { keep.push(bet); receipt(bet, "working", 0, 0, true); }
      }
      continue;
    }

    if (bet.kind === "pass-line") {
      if (input.total === input.pointBefore) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
      else if (input.total === 7) receipt(bet, "lost", 0, -bet.amount, false);
      else { keep.push(bet); receipt(bet, "working", 0, 0, true); }
    } else {
      if (input.total === 7) { credit(bet.playerId, bet.amount * 2); receipt(bet, "won", bet.amount * 2, bet.amount, false); }
      else if (input.total === input.pointBefore) receipt(bet, "lost", 0, -bet.amount, false);
      else { keep.push(bet); receipt(bet, "working", 0, 0, true); }
    }
  }

  return {
    bets: keep,
    settlements,
    bankrolls: input.bankrolls.map((item) => ({ ...item, chips: item.chips + (credits.get(item.playerId) ?? 0) })),
  };
}
