import { randomUUID } from "node:crypto";
import { advanceLiveCrapsDiceOutClock, beginLiveCrapsDiceEntry, beginLiveCrapsVirtualReveal, completeLiveCrapsSettlement, completeLiveCrapsVirtualReveal, markLiveCrapsDiceEntered, startLiveCrapsPostRollActionWindow } from "./live-craps-dice-out";
import { commitVirtualLiveCrapsRoll, type LiveCrapsCommittedRoll } from "./live-craps-dice-mode";
import { createLiveCrapsDiceEntry, confirmLiveCrapsDiceEntry, selectLiveCrapsDie, type LiveCrapsDiceEntry } from "./live-craps-dice-entry";
import { getLiveCrapsShooter } from "./live-craps";
import { settleConfirmedLiveCrapsPhysicalRoll } from "./live-craps-settlement";
import type { LiveCrapsRoom } from "./live-craps-room";

export const LIVE_CRAPS_VIRTUAL_REVEAL_MS = 1600;
export type LiveCrapsRoomRuntime = LiveCrapsRoom & { committedRoll: LiveCrapsCommittedRoll | null; revealAtMs: number | null; settleAtMs: number | null };

export function initializeLiveCrapsRoomRuntime(room: LiveCrapsRoom, nowMs = Date.now()): LiveCrapsRoomRuntime {
  if (room.phase !== "playing") throw new Error("Live Craps must be started before play begins.");
  const shooter = getLiveCrapsShooter(room.game.table);
  if (!shooter) throw new Error("Live Craps shooter is missing.");
  const actionClock = startLiveCrapsPostRollActionWindow(room.actionClock, { shooterId: shooter.id, settledRollId: "room-start", nowMs });
  return { ...room, actionClock, committedRoll: null, revealAtMs: null, settleAtMs: null };
}

function settlementEntry(shooterId: string, die1: number, die2: number, rollId: string): LiveCrapsDiceEntry {
  let entry = createLiveCrapsDiceEntry(shooterId);
  entry = selectLiveCrapsDie(entry, 1, die1);
  entry = selectLiveCrapsDie(entry, 2, die2);
  entry = confirmLiveCrapsDiceEntry(entry, shooterId);
  return Object.assign(entry, { rollId });
}

function shooterHasLineWager(runtime: LiveCrapsRoomRuntime, shooterId: string) {
  return runtime.game.bets.some((bet) => bet.playerId === shooterId && (bet.kind === "pass-line" || bet.kind === "dont-pass"));
}

function keepBettingOpenForShooterLine(runtime: LiveCrapsRoomRuntime, shooterId: string, nowMs: number) {
  if (shooterHasLineWager(runtime, shooterId)) return runtime;
  if (runtime.actionClock.phase !== "post-roll-betting" && runtime.actionClock.phase !== "dice-out") return runtime;
  const durationMs = runtime.actionClock.durationSeconds * 1000;
  return {
    ...runtime,
    actionClock: {
      ...runtime.actionClock,
      phase: "post-roll-betting" as const,
      startedAtMs: nowMs,
      deadlineMs: nowMs + durationMs,
      shooterId,
    },
  };
}

function settleEntry(runtime: LiveCrapsRoomRuntime, entry: LiveCrapsDiceEntry, actionClock: LiveCrapsRoomRuntime["actionClock"], nowMs = Date.now()): LiveCrapsRoomRuntime {
  const result = settleConfirmedLiveCrapsPhysicalRoll(runtime.game, entry);
  const nextShooter = getLiveCrapsShooter(result.table);
  if (!nextShooter) throw new Error("Next shooter is missing after settlement.");
  return { ...runtime, game: result, actionClock: completeLiveCrapsSettlement(actionClock, { rollId: result.roll.id, nextShooterId: nextShooter.id, nowMs }), committedRoll: null, revealAtMs: null, settleAtMs: null };
}

export function tickLiveCrapsRoom(runtime: LiveCrapsRoomRuntime, nowMs = Date.now()): LiveCrapsRoomRuntime {
  if (runtime.actionClock.phase === "revealing" && runtime.settleAtMs !== null && nowMs >= runtime.settleAtMs) {
    const committed = runtime.committedRoll;
    if (!committed) throw new Error("Virtual reveal is missing its authoritative roll.");
    const clock = completeLiveCrapsVirtualReveal(runtime.actionClock, committed.shooterId);
    return settleEntry(runtime, settlementEntry(committed.shooterId, committed.die1, committed.die2, committed.rollId), clock, nowMs);
  }
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (shooter && !shooterHasLineWager(runtime, shooter.id)) {
    const bettingHeld = keepBettingOpenForShooterLine(runtime, shooter.id, nowMs);
    if (bettingHeld !== runtime) return bettingHeld;
  }
  return { ...runtime, actionClock: advanceLiveCrapsDiceOutClock(runtime.actionClock, nowMs) };
}

export function beginLiveCrapsRoomRoll(runtime: LiveCrapsRoomRuntime, actorPlayerId: string, nowMs = Date.now()): LiveCrapsRoomRuntime {
  if (runtime.phase !== "playing") throw new Error("Live Craps room is not playing.");
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (!shooter || shooter.id !== actorPlayerId) throw new Error("Only the current shooter may roll.");
  if (!shooterHasLineWager(runtime, shooter.id)) throw new Error("Shooter must have a Pass Line or Don't Pass wager before rolling.");
  if (runtime.actionClock.phase !== "dice-out") throw new Error("Dice are not out yet.");
  if (runtime.committedRoll) throw new Error("A Live Craps roll is already committed.");
  const rollId = `roll-${runtime.game.table.nextRollSequence}`;
  if (runtime.diceMode === "virtual") {
    const committedRoll = commitVirtualLiveCrapsRoll({ rollId, shooterId: shooter.id, now: new Date(nowMs) });
    return { ...runtime, actionClock: beginLiveCrapsVirtualReveal(runtime.actionClock, shooter.id), committedRoll, revealAtMs: nowMs, settleAtMs: nowMs + LIVE_CRAPS_VIRTUAL_REVEAL_MS };
  }
  return { ...runtime, actionClock: beginLiveCrapsDiceEntry(runtime.actionClock, shooter.id), revealAtMs: null, settleAtMs: null };
}

export function settleLiveCrapsRoomPhysicalRoll(runtime: LiveCrapsRoomRuntime, input: { actorPlayerId: string; die1: number; die2: number; nowMs?: number }): LiveCrapsRoomRuntime {
  if (runtime.diceMode !== "physical") throw new Error("Physical dice entry is unavailable in virtual mode.");
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (!shooter || shooter.id !== input.actorPlayerId) throw new Error("Only the current shooter may enter physical dice.");
  const expectedRollId = `roll-${runtime.game.table.nextRollSequence}`;
  const actionClock = markLiveCrapsDiceEntered(runtime.actionClock, shooter.id);
  return settleEntry(runtime, settlementEntry(shooter.id, input.die1, input.die2, expectedRollId), actionClock, input.nowMs);
}

export function settleLiveCrapsRoomVirtualRoll(runtime: LiveCrapsRoomRuntime, actorPlayerId: string, nowMs = Date.now()): LiveCrapsRoomRuntime {
  if (runtime.diceMode !== "virtual") throw new Error("Virtual settlement is unavailable in physical mode.");
  const shooter = getLiveCrapsShooter(runtime.game.table);
  if (!shooter || shooter.id !== actorPlayerId) throw new Error("Only the current shooter may complete the virtual roll.");
  const committed = runtime.committedRoll;
  if (!committed || committed.shooterId !== shooter.id) throw new Error("No authoritative virtual roll is committed.");
  if (runtime.actionClock.phase !== "revealing" || runtime.settleAtMs === null) throw new Error("Virtual dice are not in reveal state.");
  if (nowMs < runtime.settleAtMs) throw new Error("Virtual dice reveal is still in progress.");
  const actionClock = completeLiveCrapsVirtualReveal(runtime.actionClock, shooter.id);
  return settleEntry(runtime, settlementEntry(shooter.id, committed.die1, committed.die2, committed.rollId), actionClock, nowMs);
}

export function createLiveCrapsActionId(prefix = "action") { return `${prefix}-${randomUUID()}`; }
