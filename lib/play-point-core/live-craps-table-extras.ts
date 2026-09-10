export type LiveCrapsExtraBetKind = "big-6" | "big-8" | "put" | "over-7" | "under-7";
export type LiveCrapsPutNumber = 4 | 5 | 6 | 8 | 9 | 10;

export type LiveCrapsExtraBet = {
  id: string;
  playerId: string;
  kind: LiveCrapsExtraBetKind;
  amount: number;
  number?: LiveCrapsPutNumber;
  working: boolean;
};

export type LiveCrapsExtraSettlement = {
  betId: string;
  playerId: string;
  kind: LiveCrapsExtraBetKind;
  amount: number;
  status: "won" | "lost" | "working";
  credit: number;
  profit: number;
  remainsWorking: boolean;
};

function assertStake(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Wager must be a positive whole number of chips.");
}

export function createLiveCrapsExtraBet(input: Omit<LiveCrapsExtraBet, "working"> & { working?: boolean }): LiveCrapsExtraBet {
  assertStake(input.amount);
  if (input.kind === "put") {
    if (![4, 5, 6, 8, 9, 10].includes(input.number ?? 0)) throw new Error("Put bet requires 4, 5, 6, 8, 9, or 10.");
  } else if (input.number !== undefined) {
    throw new Error("Only Put bets use a number in this wager family.");
  }
  return { ...input, working: input.working ?? true };
}

export function settleLiveCrapsExtraBet(bet: LiveCrapsExtraBet, total: number): LiveCrapsExtraSettlement {
  if (!Number.isInteger(total) || total < 2 || total > 12) throw new Error("Roll total must be 2 through 12.");
  const base = { betId: bet.id, playerId: bet.playerId, kind: bet.kind, amount: bet.amount };
  if (!bet.working) return { ...base, status: "working", credit: 0, profit: 0, remainsWorking: true };

  if (bet.kind === "over-7" || bet.kind === "under-7") {
    const won = bet.kind === "over-7" ? total > 7 : total < 7;
    return won
      ? { ...base, status: "won", credit: bet.amount * 2, profit: bet.amount, remainsWorking: false }
      : { ...base, status: "lost", credit: 0, profit: -bet.amount, remainsWorking: false };
  }

  const target = bet.kind === "big-6" ? 6 : bet.kind === "big-8" ? 8 : bet.number!;
  if (total === target) return { ...base, status: "won", credit: bet.amount, profit: bet.amount, remainsWorking: true };
  if (total === 7) return { ...base, status: "lost", credit: 0, profit: -bet.amount, remainsWorking: false };
  return { ...base, status: "working", credit: 0, profit: 0, remainsWorking: true };
}

/** Horn High is a five-unit server macro: Horn plus one extra unit on the selected high number. */
export function expandLiveCrapsHornHigh(amount: number, high: 2 | 3 | 11 | 12) {
  assertStake(amount);
  if (amount % 5 !== 0) throw new Error("Horn High must be wagered in five-chip units.");
  const unit = amount / 5;
  return ([2, 3, 11, 12] as const).map((number) => ({ number, amount: unit + (number === high ? unit : 0) }));
}
