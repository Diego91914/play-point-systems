import { randomInt } from "node:crypto";

export type LiveCrapsDiceMode = "physical" | "virtual";

export type LiveCrapsCommittedRoll = {
  rollId: string;
  shooterId: string;
  source: LiveCrapsDiceMode;
  die1: 1 | 2 | 3 | 4 | 5 | 6;
  die2: 1 | 2 | 3 | 4 | 5 | 6;
  total: number;
  committedAt: string;
};

export type LiveCrapsDiceModeState = {
  mode: LiveCrapsDiceMode;
  point: 4 | 5 | 6 | 8 | 9 | 10 | null;
  pendingRollId: string | null;
  bettingLocked: boolean;
};

function dieFace(): 1 | 2 | 3 | 4 | 5 | 6 {
  return randomInt(1, 7) as 1 | 2 | 3 | 4 | 5 | 6;
}

export function canChangeLiveCrapsDiceMode(
  state: LiveCrapsDiceModeState,
): boolean {
  return state.point === null && state.pendingRollId === null && !state.bettingLocked;
}

export function changeLiveCrapsDiceMode(
  state: LiveCrapsDiceModeState,
  nextMode: LiveCrapsDiceMode,
): LiveCrapsDiceModeState {
  if (state.mode === nextMode) return state;
  if (!canChangeLiveCrapsDiceMode(state)) {
    throw new Error(
      "Dice mode may change only with point off, no pending roll, and betting unlocked.",
    );
  }
  return { ...state, mode: nextMode };
}

export function commitVirtualLiveCrapsRoll(input: {
  rollId: string;
  shooterId: string;
  existing?: LiveCrapsCommittedRoll | null;
  now?: Date;
}): LiveCrapsCommittedRoll {
  if (!input.rollId.trim()) throw new Error("rollId is required.");
  if (!input.shooterId.trim()) throw new Error("shooterId is required.");

  if (input.existing) {
    if (input.existing.rollId !== input.rollId) {
      throw new Error("Existing roll does not match requested rollId.");
    }
    if (input.existing.shooterId !== input.shooterId) {
      throw new Error("Existing roll belongs to another shooter.");
    }
    if (input.existing.source !== "virtual") {
      throw new Error("Existing roll was not generated in virtual mode.");
    }
    return input.existing;
  }

  const die1 = dieFace();
  const die2 = dieFace();
  return {
    rollId: input.rollId,
    shooterId: input.shooterId,
    source: "virtual",
    die1,
    die2,
    total: die1 + die2,
    committedAt: (input.now ?? new Date()).toISOString(),
  };
}

export function projectCommittedRollForReveal(
  roll: LiveCrapsCommittedRoll,
): Pick<
  LiveCrapsCommittedRoll,
  "rollId" | "shooterId" | "source" | "die1" | "die2" | "total"
> {
  return {
    rollId: roll.rollId,
    shooterId: roll.shooterId,
    source: roll.source,
    die1: roll.die1,
    die2: roll.die2,
    total: roll.total,
  };
}
