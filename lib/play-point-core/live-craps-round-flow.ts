import { randomUUID } from "node:crypto";
import { commitVirtualLiveCrapsRoll, type LiveCrapsCommittedRoll, type LiveCrapsDiceMode } from "./live-craps-dice-mode";
import { advanceLiveCrapsDiceOutClock, beginLiveCrapsDiceEntry, markLiveCrapsDiceEntered, type LiveCrapsActionClockState } from "./live-craps-dice-out";

export type LiveCrapsRollFlowState = {
  mode: LiveCrapsDiceMode;
  clock: LiveCrapsActionClockState;
  pendingRoll: LiveCrapsCommittedRoll | null;
};

export function advanceLiveCrapsToDiceOut(state: LiveCrapsRollFlowState, nowMs = Date.now()): LiveCrapsRollFlowState {
  return { ...state, clock: advanceLiveCrapsDiceOutClock(state.clock, nowMs) };
}

/** Server-authoritative virtual roll: the result is committed before any client reveal animation begins. */
export function beginVirtualLiveCrapsRoll(state: LiveCrapsRollFlowState, shooterId: string, rollId = randomUUID()): LiveCrapsRollFlowState {
  if (state.mode !== "virtual") throw new Error("Table is not using virtual dice.");
  if (state.clock.phase !== "dice-out") throw new Error("Virtual dice may roll only after Dice Out.");
  if (state.clock.shooterId !== shooterId) throw new Error("Only the current shooter may roll.");
  if (state.pendingRoll) throw new Error("A roll is already pending.");
  const pendingRoll = commitVirtualLiveCrapsRoll({ rollId, shooterId });
  return { ...state, pendingRoll, clock: { ...state.clock, phase: "settling" } };
}

/** Physical mode opens exact two-die entry only for the current shooter after Dice Out. */
export function beginPhysicalLiveCrapsRollEntry(state: LiveCrapsRollFlowState, shooterId: string): LiveCrapsRollFlowState {
  if (state.mode !== "physical") throw new Error("Table is not using physical dice.");
  return { ...state, clock: beginLiveCrapsDiceEntry(state.clock, shooterId) };
}

export function commitPhysicalLiveCrapsRoll(state: LiveCrapsRollFlowState, input: { shooterId: string; rollId?: string; die1: 1|2|3|4|5|6; die2: 1|2|3|4|5|6; now?: Date }): LiveCrapsRollFlowState {
  if (state.mode !== "physical") throw new Error("Table is not using physical dice.");
  if (state.clock.phase !== "dice-entry") throw new Error("Physical dice may be entered only during dice entry.");
  if (state.clock.shooterId !== input.shooterId) throw new Error("Only the current shooter may enter dice.");
  if (state.pendingRoll) throw new Error("A roll is already pending.");
  const rollId = input.rollId ?? randomUUID();
  const pendingRoll: LiveCrapsCommittedRoll = { rollId, shooterId: input.shooterId, source: "physical", die1: input.die1, die2: input.die2, total: input.die1 + input.die2, committedAt: (input.now ?? new Date()).toISOString() };
  return { ...state, pendingRoll, clock: markLiveCrapsDiceEntered(state.clock, input.shooterId) };
}

/** Clear only after authoritative settlement has persisted the roll id and resulting bankroll/table state. */
export function clearSettledLiveCrapsRoll(state: LiveCrapsRollFlowState, settledRollId: string): LiveCrapsRollFlowState {
  if (!state.pendingRoll || state.pendingRoll.rollId !== settledRollId) throw new Error("Settlement does not match the pending roll.");
  return { ...state, pendingRoll: null };
}
