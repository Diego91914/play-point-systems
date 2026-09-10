export type LiveCrapsExcitementLevel = "normal" | "big-hit" | "monster" | "table-moment";
export type LiveCrapsHaptic = "none" | "strong" | "celebration";

export type LiveCrapsExcitementInput = {
  playerId: string;
  payout: number;
  bankrollBefore: number;
  atsCompleted?: "small" | "tall" | "all" | null;
  hardwayWin?: boolean;
  shooterRollCount?: number;
};

export type LiveCrapsPlayerExcitement = {
  playerId: string;
  level: LiveCrapsExcitementLevel;
  haptic: LiveCrapsHaptic;
  headline: string | null;
};

// Excitement is intentionally relative to the player's rack so a meaningful hit
// for a short stack still feels meaningful. Exact thresholds can be tuned from play tests.
export function classifyLiveCrapsPlayerExcitement(input: LiveCrapsExcitementInput): LiveCrapsPlayerExcitement {
  const base = Math.max(1, input.bankrollBefore);
  const ratio = input.payout / base;

  if (input.atsCompleted === "all") {
    return { playerId: input.playerId, level: "monster", haptic: "celebration", headline: "MAKE 'EM ALL!" };
  }
  if (input.atsCompleted || input.hardwayWin || ratio >= 0.25) {
    return { playerId: input.playerId, level: "monster", haptic: "celebration", headline: `MONSTER HIT! +${input.payout}` };
  }
  if (ratio >= 0.1) {
    return { playerId: input.playerId, level: "big-hit", haptic: "strong", headline: `BIG HIT! +${input.payout}` };
  }
  return { playerId: input.playerId, level: "normal", haptic: "none", headline: null };
}

export function isLiveCrapsTableMoment(input: { atsAllCompleted?: boolean; shooterRollCount?: number }): boolean {
  return Boolean(input.atsAllCompleted || (input.shooterRollCount ?? 0) >= 10);
}
