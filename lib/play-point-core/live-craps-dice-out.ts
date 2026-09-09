export const LIVE_CRAPS_ACTION_SECONDS = [10, 15, 20] as const;
export type LiveCrapsActionSeconds = typeof LIVE_CRAPS_ACTION_SECONDS[number];
export type LiveCrapsActionPhase = "awaiting-settlement" | "post-roll-betting" | "dice-out" | "dice-entry" | "settling";

export type LiveCrapsActionClockState = {
  phase: LiveCrapsActionPhase;
  durationSeconds: LiveCrapsActionSeconds;
  startedAtMs: number | null;
  deadlineMs: number | null;
  shooterId: string | null;
  settledRollId: string | null;
};

export function createLiveCrapsDiceOutState(durationSeconds: LiveCrapsActionSeconds = 15): LiveCrapsActionClockState {
  if (!LIVE_CRAPS_ACTION_SECONDS.includes(durationSeconds)) throw new Error("Action clock must be 10, 15, or 20 seconds.");
  return { phase: "awaiting-settlement", durationSeconds, startedAtMs: null, deadlineMs: null, shooterId: null, settledRollId: null };
}

/** Starts immediately after authoritative settlement. This is the betting/dealer-action clock; Dice Out happens when it expires. */
export function startLiveCrapsPostRollActionWindow(state: LiveCrapsActionClockState, input: { shooterId: string; settledRollId: string; nowMs?: number }): LiveCrapsActionClockState {
  if (state.phase !== "awaiting-settlement" && state.phase !== "settling") throw new Error("Post-roll action window requires a completed settlement.");
  if (!input.shooterId || !input.settledRollId) throw new Error("Shooter and settled roll are required.");
  const nowMs = input.nowMs ?? Date.now();
  return { ...state, phase: "post-roll-betting", startedAtMs: nowMs, deadlineMs: nowMs + state.durationSeconds * 1000, shooterId: input.shooterId, settledRollId: input.settledRollId };
}

export function getLiveCrapsDiceOutRemaining(state: LiveCrapsActionClockState, nowMs = Date.now()) {
  if (state.phase !== "post-roll-betting" || state.deadlineMs === null) return 0;
  return Math.max(0, Math.ceil((state.deadlineMs - nowMs) / 1000));
}

export function assertLiveCrapsActionWindowOpen(state: LiveCrapsActionClockState, nowMs = Date.now()) {
  if (state.phase !== "post-roll-betting" || state.deadlineMs === null || nowMs >= state.deadlineMs) throw new Error("Betting and dealer actions are locked. Dice Out.");
}

/** At zero the server atomically locks betting/actions and declares Dice Out. There is no second countdown. */
export function advanceLiveCrapsDiceOutClock(state: LiveCrapsActionClockState, nowMs = Date.now()): LiveCrapsActionClockState {
  if (state.phase !== "post-roll-betting" || state.deadlineMs === null || nowMs < state.deadlineMs) return state;
  return { ...state, phase: "dice-out" };
}

export function beginLiveCrapsDiceEntry(state: LiveCrapsActionClockState, shooterId: string): LiveCrapsActionClockState {
  if (state.phase !== "dice-out") throw new Error("Dice entry begins only after the action clock expires and Dice Out is called.");
  if (state.shooterId !== shooterId) throw new Error("Only the current shooter may begin dice entry.");
  return { ...state, phase: "dice-entry" };
}

export function markLiveCrapsDiceEntered(state: LiveCrapsActionClockState, shooterId: string): LiveCrapsActionClockState {
  if (state.phase !== "dice-entry") throw new Error("Dice may only be entered during dice entry.");
  if (state.shooterId !== shooterId) throw new Error("Only the current shooter may enter dice.");
  return { ...state, phase: "settling" };
}

/** Settlement proof is required before a new action window can begin, preventing an entered roll from being skipped. */
export function completeLiveCrapsSettlement(state: LiveCrapsActionClockState, input: { rollId: string; nextShooterId: string; nowMs?: number }): LiveCrapsActionClockState {
  if (state.phase !== "settling") throw new Error("A roll must be awaiting settlement.");
  if (!input.rollId || !input.nextShooterId) throw new Error("Settlement roll and next shooter are required.");
  return startLiveCrapsPostRollActionWindow({ ...state, phase: "settling" }, { shooterId: input.nextShooterId, settledRollId: input.rollId, nowMs: input.nowMs });
}

export function setLiveCrapsDiceOutDuration(state: LiveCrapsActionClockState, durationSeconds: LiveCrapsActionSeconds): LiveCrapsActionClockState {
  if (state.phase === "dice-out" || state.phase === "dice-entry" || state.phase === "settling") throw new Error("Action clock duration can only change while no roll is in flight.");
  if (!LIVE_CRAPS_ACTION_SECONDS.includes(durationSeconds)) throw new Error("Action clock must be 10, 15, or 20 seconds.");
  return { ...state, durationSeconds };
}

// Backward-compatible name for callers while UI routes migrate. Semantics are now post-roll action window, not a Dice Out countdown.
export const LIVE_CRAPS_DICE_OUT_SECONDS = LIVE_CRAPS_ACTION_SECONDS;
