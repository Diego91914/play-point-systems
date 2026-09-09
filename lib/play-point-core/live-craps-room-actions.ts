import { randomUUID } from "node:crypto";
import { advanceLiveCrapsDiceOutClock, beginLiveCrapsDiceEntry, completeLiveCrapsSettlement, markLiveCrapsDiceEntered, startLiveCrapsPostRollActionWindow } from "./live-craps-dice-out";
import { commitVirtualLiveCrapsRoll, type LiveCrapsCommittedRoll } from "./live-craps-dice-mode";
import { createLiveCrapsDiceEntry, confirmLiveCrapsDiceEntry, selectLiveCrapsDie } from "./live-craps-dice-entry";
import { getLiveCrapsShooter } from "./live-craps";
import { settleConfirmedLiveCrapsPhysicalRoll } from "./live-craps-settlement";
import type { LiveCrapsRoom } from "./live-craps-room";

export type LiveCrapsRoomRuntime = LiveCrapsRoom & { committedRoll: LiveCrapsCommittedRoll | null };

export function initializeLiveCrapsRoomRuntime(room: LiveCrapsRoom, nowMs = Date.now()): LiveCrapsRoomRuntime {
  if (room.phase !== "playing") throw new Error("Live Craps must be started before play begins.");
  const shooter = getLiveCrapsShooter(room.game.table);
  if (!shooter) throw new Error("Live Craps shooter is missing.");
  const actionClock = startLiveCrapsPostRollActionWindow(room.actionClock, { shooterId: shooter.id, settledRollId: "room-start", nowMs });
  return { ...room, actionClock, committedRoll: null };
}

export function tickLiveCrapsRoom(runtime: LiveCrapsRoomRuntime, nowMs = Date.now()): LiveCrapsRoomRuntime {
  return { ...runtime, actionClock: advanceLiveCrapsDiceOutClock(runtime.actionClock, nowMs) };
}

export function beginLiveCrapsRoomRoll(runtime: LiveCrapsRoomRuntime, actorPlayerId: string): LiveCrapsRoomRuntime {
  if (runtime.phase !== "playing") throw new Error("Live Craps room is not playing.");
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (!shooter || shooter.id !== actorPlayerId) throw new Error("Only the current shooter may roll.");
  if (runtime.actionClock.phase !== "dice-out") throw new Error("Dice are not out yet.");
  if (runtime.committedRoll) throw new Error("A Live Craps roll is already committed.");
  const rollId = `roll-${runtime.game.table.nextRollSequence}`;
  if (runtime.diceMode === "virtual") {
    const committedRoll = commitVirtualLiveCrapsRoll({ rollId, shooterId: shooter.id });
    return { ...runtime, actionClock: beginLiveCrapsDiceEntry(runtime.actionClock, shooter.id), committedRoll };
  }
  return { ...runtime, actionClock: beginLiveCrapsDiceEntry(runtime.actionClock, shooter.id) };
}

function settleEntry(runtime: LiveCrapsRoomRuntime, entry: ReturnType<typeof confirmLiveCrapsDiceEntry>, rollId: string, nowMs = Date.now()): LiveCrapsRoomRuntime {
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (!shooter || shooter.id !== entry.shooterId) throw new Error("Confirmed dice do not belong to the current shooter.");
  const entryWithRollId = { ...entry, rollId };
  const actionClock = markLiveCrapsDiceEntered(runtime.actionClock, shooter.id);
  const result = settleConfirmedLiveCrapsPhysicalRoll(runtime.game, entryWithRollId);
  const nextShooter = getLiveCrapsShooter(result.table);
  if (!nextShooter) throw new Error("Next shooter is missing after settlement.");
  return { ...runtime, game: result, actionClock: completeLiveCrapsSettlement(actionClock, { rollId: result.roll.id, nextShooterId: nextShooter.id, nowMs }), committedRoll: null };
}

export function settleLiveCrapsRoomPhysicalRoll(runtime: LiveCrapsRoomRuntime, input: { actorPlayerId: string; die1: number; die2: number; nowMs?: number }): LiveCrapsRoomRuntime {
  if (runtime.diceMode !== "physical") throw new Error("Physical dice entry is unavailable in virtual mode.");
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (!shooter || shooter.id !== input.actorPlayerId) throw new Error("Only the current shooter may enter physical dice.");
  let entry = createLiveCrapsDiceEntry(shooter.id);
  entry = selectLiveCrapsDie(entry, 1, input.die1);
  entry = selectLiveCrapsDie(entry, 2, input.die2);
  entry = confirmLiveCrapsDiceEntry(entry, input.actorPlayerId);
  return settleEntry(runtime, entry, `roll-${runtime.game.table.nextRollSequence}`, input.nowMs);
}

export function settleLiveCrapsRoomVirtualRoll(runtime: LiveCrapsRoomRuntime, actorPlayerId: string, nowMs = Date.now()): LiveCrapsRoomRuntime {
  if (runtime.diceMode !== "virtual") throw new Error("Virtual roll settlement is unavailable in physical mode.");
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (!shooter || shooter.id !== actorPlayerId) throw new Error("Only the current shooter may reveal the virtual roll.");
  const committed = runtime.committedRoll;
  if (!committed || committed.shooterId !== shooter.id) throw new Error("No authoritative virtual roll is committed.");
  let entry = createLiveCrapsDiceEntry(shooter.id);
  entry = selectLiveCrapsDie(entry, 1, committed.die1);
  entry = selectLiveCrapsDie(entry, 2, committed.die2);
  entry = confirmLiveCrapsDiceEntry(entry, actorPlayerId);
  return settleEntry(runtime, entry, committed.rollId, nowMs);
}

export function createLiveCrapsActionId(prefix = "action") { return `${prefix}-${randomUUID()}`; }
