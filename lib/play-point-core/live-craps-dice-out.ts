export const LIVE_CRAPS_DICE_OUT_SECONDS = [10, 15, 20] as const;
export type LiveCrapsDiceOutSeconds = typeof LIVE_CRAPS_DICE_OUT_SECONDS[number];
export type LiveCrapsDiceOutPhase = "betting-open" | "dice-out" | "waiting-for-roll" | "dice-entered";

export type LiveCrapsDiceOutState = {
  phase: LiveCrapsDiceOutPhase;
  durationSeconds: LiveCrapsDiceOutSeconds;
  startedAtMs: number | null;
  shooterId: string | null;
};

export function createLiveCrapsDiceOutState(durationSeconds: LiveCrapsDiceOutSeconds = 15): LiveCrapsDiceOutState {
  if (!LIVE_CRAPS_DICE_OUT_SECONDS.includes(durationSeconds)) throw new Error("Dice Out timer must be 10, 15, or 20 seconds.");
  return { phase: "betting-open", durationSeconds, startedAtMs: null, shooterId: null };
}

export function startLiveCrapsDiceOut(state: LiveCrapsDiceOutState, shooterId: string, nowMs = Date.now()): LiveCrapsDiceOutState {
  if (state.phase !== "betting-open") throw new Error("Dice Out can only start while betting is open.");
  if (!shooterId) throw new Error("Current shooter is required for Dice Out.");
  return { ...state, phase: "dice-out", startedAtMs: nowMs, shooterId };
}

export function getLiveCrapsDiceOutRemaining(state: LiveCrapsDiceOutState, nowMs = Date.now()) {
  if (state.phase !== "dice-out" || state.startedAtMs === null) return 0;
  const elapsed = Math.max(0, nowMs - state.startedAtMs);
  return Math.max(0, Math.ceil((state.durationSeconds * 1000 - elapsed) / 1000));
}

export function advanceLiveCrapsDiceOutClock(state: LiveCrapsDiceOutState, nowMs = Date.now()): LiveCrapsDiceOutState {
  if (state.phase !== "dice-out") return state;
  if (getLiveCrapsDiceOutRemaining(state, nowMs) > 0) return state;
  return { ...state, phase: "waiting-for-roll" };
}

export function markLiveCrapsDiceEntered(state: LiveCrapsDiceOutState, shooterId: string): LiveCrapsDiceOutState {
  if (state.phase !== "dice-out" && state.phase !== "waiting-for-roll") throw new Error("Dice may only be entered after Dice Out.");
  if (state.shooterId !== shooterId) throw new Error("Only the current shooter may enter the physical dice.");
  return { ...state, phase: "dice-entered" };
}

export function reopenLiveCrapsBetting(state: LiveCrapsDiceOutState): LiveCrapsDiceOutState {
  if (state.phase !== "dice-entered") throw new Error("Betting reopens only after the entered roll is settled.");
  return { ...state, phase: "betting-open", startedAtMs: null, shooterId: null };
}

export function setLiveCrapsDiceOutDuration(state: LiveCrapsDiceOutState, durationSeconds: LiveCrapsDiceOutSeconds): LiveCrapsDiceOutState {
  if (state.phase !== "betting-open") throw new Error("Dice Out duration can only change between rolls.");
  if (!LIVE_CRAPS_DICE_OUT_SECONDS.includes(durationSeconds)) throw new Error("Dice Out timer must be 10, 15, or 20 seconds.");
  return { ...state, durationSeconds };
}
