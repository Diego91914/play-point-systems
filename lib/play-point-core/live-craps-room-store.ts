import { randomUUID } from "node:crypto";
import { createLiveCrapsRoom, joinLiveCrapsRoom, startLiveCrapsRoom, closeLiveCrapsRoom, projectLiveCrapsRoom, type LiveCrapsRoom } from "./live-craps-room";
import { beginLiveCrapsRoomRoll, initializeLiveCrapsRoomRuntime, settleLiveCrapsRoomPhysicalRoll, settleLiveCrapsRoomVirtualRoll, tickLiveCrapsRoom, type LiveCrapsRoomRuntime } from "./live-craps-room-actions";
import { placeLiveCrapsBet, type LiveCrapsBetKind } from "./live-craps-bets";
import type { LiveCrapsPoint } from "./live-craps";

export type LiveCrapsStoredRoom = { runtime: LiveCrapsRoomRuntime | null; room: LiveCrapsRoom; version: number; updatedAt: string };
export type LiveCrapsRoomCommand =
  | { type: "join"; playerId: string; name: string }
  | { type: "start"; actorPlayerId: string; nowMs?: number }
  | { type: "tick"; nowMs?: number }
  | { type: "place-bet"; actorPlayerId: string; kind: LiveCrapsBetKind; amount: number; number?: LiveCrapsPoint; betId?: string }
  | { type: "undo-bet"; actorPlayerId: string; betId: string }
  | { type: "clear-new-bets"; actorPlayerId: string; betIds: string[] }
  | { type: "begin-roll"; actorPlayerId: string }
  | { type: "settle-physical"; actorPlayerId: string; die1: number; die2: number; nowMs?: number }
  | { type: "settle-virtual"; actorPlayerId: string; nowMs?: number }
  | { type: "close"; actorPlayerId: string };

const rooms = new Map<string, LiveCrapsStoredRoom>();
const commandResults = new Map<string, LiveCrapsStoredRoom>();
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

function assertBettingOpen(room: LiveCrapsRoom) {
  if (room.phase !== "playing") throw new Error("Live Craps must be playing before bets can be changed.");
  if (room.actionClock.phase !== "post-roll-betting") throw new Error("Betting is closed. Dice are out.");
}

function placeStandardBet(room: LiveCrapsRoom, command: Extract<LiveCrapsRoomCommand, { type: "place-bet" }>): LiveCrapsRoom {
  assertBettingOpen(room);
  if (!room.game.table.players.some((player) => player.id === command.actorPlayerId && !player.sittingOut)) throw new Error("Active player not found.");
  const placed = placeLiveCrapsBet({ bets: room.game.bets, bankrolls: room.game.bankrolls, playerId: command.actorPlayerId, kind: command.kind, amount: command.amount, point: room.game.table.point, number: command.number, id: command.betId?.trim() || `bet-${randomUUID()}` });
  return { ...room, game: { ...room.game, bets: placed.bets, bankrolls: placed.bankrolls } };
}

function removeNewBets(room: LiveCrapsRoom, actorPlayerId: string, requestedIds: string[]): LiveCrapsRoom {
  assertBettingOpen(room);
  const ids = new Set(requestedIds.filter(Boolean));
  if (!ids.size) return room;
  const owned = room.game.bets.filter((bet) => ids.has(bet.id) && bet.playerId === actorPlayerId);
  if (owned.length !== ids.size) throw new Error("Only your current betting-window wagers may be removed.");
  const refund = owned.reduce((sum, bet) => sum + bet.amount, 0);
  return { ...room, game: { ...room.game, bets: room.game.bets.filter((bet) => !ids.has(bet.id)), bankrolls: room.game.bankrolls.map((bankroll) => bankroll.playerId === actorPlayerId ? { ...bankroll, chips: bankroll.chips + refund } : bankroll) } };
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
  else if (command.type === "place-bet") room = placeStandardBet(room, command);
  else if (command.type === "undo-bet") room = removeNewBets(room, command.actorPlayerId, [command.betId]);
  else if (command.type === "clear-new-bets") room = removeNewBets(room, command.actorPlayerId, command.betIds);
  else if (command.type === "begin-roll") { if (!runtime) throw new Error("Live Craps has not started."); runtime = beginLiveCrapsRoomRoll(runtime, command.actorPlayerId); room = runtime; }
  else if (command.type === "settle-physical") { if (!runtime) throw new Error("Live Craps has not started."); runtime = settleLiveCrapsRoomPhysicalRoll(runtime, command); room = runtime; }
  else if (command.type === "settle-virtual") { if (!runtime) throw new Error("Live Craps has not started."); runtime = settleLiveCrapsRoomVirtualRoll(runtime, command.actorPlayerId, command.nowMs); room = runtime; }
  else if (command.type === "close") { room = closeLiveCrapsRoom(room, command.actorPlayerId); runtime = runtime ? { ...runtime, phase: "closed" } : null; }
  if (runtime && command.type !== "tick" && command.type !== "start" && command.type !== "begin-roll" && command.type !== "settle-physical" && command.type !== "settle-virtual" && command.type !== "close") { runtime = { ...runtime, game: room.game }; room = runtime; }
  const next: LiveCrapsStoredRoom = { room, runtime, version: stored.version + 1, updatedAt: stamp(command.type === "tick" ? command.nowMs : undefined) };
  rooms.set(room.code, next); commandResults.set(key, next); return next;
}

export function newLiveCrapsCommandId() { return randomUUID(); }
export function projectStoredLiveCrapsRoom(roomCode: string, playerId: string) { const stored = getStoredLiveCrapsRoom(roomCode); return { version: stored.version, updatedAt: stored.updatedAt, ...projectLiveCrapsRoom(stored.room, playerId) }; }

// Process-local beta store. Replace with durable transactional persistence before multi-instance production rollout.
export function clearLiveCrapsRoomStoreForTests() { rooms.clear(); commandResults.clear(); }
