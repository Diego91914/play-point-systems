import { randomUUID } from "node:crypto";
import { createLiveCrapsRoom, joinLiveCrapsRoom, startLiveCrapsRoom, closeLiveCrapsRoom, projectLiveCrapsRoom, type LiveCrapsRoom } from "./live-craps-room";
import { beginLiveCrapsRoomRoll, initializeLiveCrapsRoomRuntime, settleLiveCrapsRoomPhysicalRoll, settleLiveCrapsRoomVirtualRoll, tickLiveCrapsRoom, type LiveCrapsRoomRuntime } from "./live-craps-room-actions";

export type LiveCrapsStoredRoom = { runtime: LiveCrapsRoomRuntime | null; room: LiveCrapsRoom; version: number; updatedAt: string };
export type LiveCrapsRoomCommand =
  | { type: "join"; playerId: string; name: string }
  | { type: "start"; actorPlayerId: string; nowMs?: number }
  | { type: "tick"; nowMs?: number }
  | { type: "begin-roll"; actorPlayerId: string }
  | { type: "settle-physical"; actorPlayerId: string; die1: number; die2: number; nowMs?: number }
  | { type: "settle-virtual"; actorPlayerId: string; nowMs?: number }
  | { type: "close"; actorPlayerId: string };

const rooms = new Map<string, LiveCrapsStoredRoom>();
function code(value: string) { return value.trim().toUpperCase(); }
function stamp(nowMs = Date.now()) { return new Date(nowMs).toISOString(); }

export function createStoredLiveCrapsRoom(input: Parameters<typeof createLiveCrapsRoom>[0]) {
  const room = createLiveCrapsRoom(input);
  if (rooms.has(room.code)) throw new Error("Live Craps room code is already in use.");
  const stored: LiveCrapsStoredRoom = { room, runtime: null, version: 1, updatedAt: room.createdAt };
  rooms.set(room.code, stored);
  return stored;
}

export function getStoredLiveCrapsRoom(roomCode: string) {
  const stored = rooms.get(code(roomCode));
  if (!stored) throw new Error("Live Craps room not found.");
  return stored;
}

export function applyLiveCrapsRoomCommand(roomCode: string, commandId: string, command: LiveCrapsRoomCommand) {
  if (!commandId.trim()) throw new Error("Command id is required.");
  const key = `${code(roomCode)}:${commandId}`;
  const existing = commandResults.get(key);
  if (existing) return existing;
  const stored = getStoredLiveCrapsRoom(roomCode);
  let room = stored.room;
  let runtime = stored.runtime;
  if (command.type === "join") room = joinLiveCrapsRoom(room, command);
  else if (command.type === "start") { room = startLiveCrapsRoom(room, command.actorPlayerId); runtime = initializeLiveCrapsRoomRuntime(room, command.nowMs); room = runtime; }
  else if (command.type === "tick") { if (!runtime) throw new Error("Live Craps has not started."); runtime = tickLiveCrapsRoom(runtime, command.nowMs); room = runtime; }
  else if (command.type === "begin-roll") { if (!runtime) throw new Error("Live Craps has not started."); runtime = beginLiveCrapsRoomRoll(runtime, command.actorPlayerId); room = runtime; }
  else if (command.type === "settle-physical") { if (!runtime) throw new Error("Live Craps has not started."); runtime = settleLiveCrapsRoomPhysicalRoll(runtime, command); room = runtime; }
  else if (command.type === "settle-virtual") { if (!runtime) throw new Error("Live Craps has not started."); runtime = settleLiveCrapsRoomVirtualRoll(runtime, command.actorPlayerId, command.nowMs); room = runtime; }
  else if (command.type === "close") { room = closeLiveCrapsRoom(room, command.actorPlayerId); runtime = runtime ? { ...runtime, phase: "closed" } : null; }
  const next: LiveCrapsStoredRoom = { room, runtime, version: stored.version + 1, updatedAt: stamp(command.type === "tick" ? command.nowMs : undefined) };
  rooms.set(room.code, next); commandResults.set(key, next); return next;
}

const commandResults = new Map<string, LiveCrapsStoredRoom>();
export function newLiveCrapsCommandId() { return randomUUID(); }
export function projectStoredLiveCrapsRoom(roomCode: string, playerId: string) { const stored = getStoredLiveCrapsRoom(roomCode); return { version: stored.version, updatedAt: stored.updatedAt, ...projectLiveCrapsRoom(stored.room, playerId) }; }

// Process-local beta store. Replace with durable transactional persistence before multi-instance production rollout.
export function clearLiveCrapsRoomStoreForTests() { rooms.clear(); commandResults.clear(); }
