import { randomUUID } from "node:crypto";
import {
  applyLiveCrapsRoomCommand,
  createStoredLiveCrapsRoom,
  getStoredLiveCrapsRoom,
  projectStoredLiveCrapsRoom,
  type LiveCrapsRoomCommand,
  type LiveCrapsStoredRoom,
} from "./live-craps-room-store";
import {
  commitDurableLiveCrapsCommand,
  commitDurableLiveCrapsJoin,
  createDurableLiveCrapsRoom,
  loadDurableLiveCrapsRoom,
  verifyDurableLiveCrapsPlayerSession,
  type DurableLiveCrapsRoom,
} from "./live-craps-persistence";
import type { LiveCrapsDiceMode } from "./live-craps-dice-mode";
import type { LiveCrapsBetKind } from "./live-craps-bets";
import type { LiveCrapsPoint } from "./live-craps";

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function hydrateLocal(durable: DurableLiveCrapsRoom) {
  let local: LiveCrapsStoredRoom;
  try {
    local = getStoredLiveCrapsRoom(durable.roomCode);
  } catch {
    const host = durable.state.room.game.table.players.find(
      (player) => player.id === durable.state.room.hostPlayerId,
    );
    local = createStoredLiveCrapsRoom({
      code: durable.roomCode,
      hostPlayerId: durable.state.room.hostPlayerId,
      hostName: host?.name ?? "Host",
      diceMode: durable.state.room.diceMode,
      createdAt: durable.state.room.createdAt,
    });
  }
  Object.assign(local, durable.state);
  return local;
}

async function loadAndHydrate(code: string) {
  const durable = await loadDurableLiveCrapsRoom(code);
  hydrateLocal(durable);
  return durable;
}

async function applyDurableCommand(
  roomCode: string,
  commandId: string,
  command: LiveCrapsRoomCommand,
  maxAttempts = 4,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const durable = await loadAndHydrate(roomCode);
    const next = applyLiveCrapsRoomCommand(durable.roomCode, commandId, command);
    try {
      const committed = await commitDurableLiveCrapsCommand({
        roomCode: durable.roomCode,
        expectedVersion: durable.version,
        commandId,
        state: next,
      });
      const committedDurable: DurableLiveCrapsRoom = {
        roomCode: durable.roomCode,
        version: committed.version,
        state: committed.state,
      };
      hydrateLocal(committedDurable);
      return committedDurable;
    } catch (error) {
      if (error instanceof Error && error.message === "LIVE_CRAPS_VERSION_CONFLICT") {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Live Craps table changed too quickly. Try that action again.");
}

async function applyDurableJoin(
  roomCode: string,
  commandId: string,
  playerId: string,
  name: string,
  token: string,
  maxAttempts = 4,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const durable = await loadAndHydrate(roomCode);
    const next = applyLiveCrapsRoomCommand(durable.roomCode, commandId, {
      type: "join",
      playerId,
      name,
    });
    try {
      const committed = await commitDurableLiveCrapsJoin({
        roomCode: durable.roomCode,
        expectedVersion: durable.version,
        commandId,
        state: next,
        playerId,
        token,
      });
      const committedDurable: DurableLiveCrapsRoom = {
        roomCode: durable.roomCode,
        version: committed.version,
        state: committed.state,
      };
      hydrateLocal(committedDurable);
      return committedDurable;
    } catch (error) {
      if (error instanceof Error && error.message === "LIVE_CRAPS_VERSION_CONFLICT") {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Live Craps table changed too quickly. Try joining again.");
}

async function projectDurableRoom(code: string, playerId: string) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const durable = await loadAndHydrate(code);
    const beforeVersion = getStoredLiveCrapsRoom(durable.roomCode).version;
    const state = projectStoredLiveCrapsRoom(durable.roomCode, playerId);
    const after = getStoredLiveCrapsRoom(durable.roomCode);
    if (after.version === beforeVersion) return state;

    try {
      const committed = await commitDurableLiveCrapsCommand({
        roomCode: durable.roomCode,
        expectedVersion: durable.version,
        commandId: `read-advance-${durable.version}-${after.version}`,
        state: after,
      });
      hydrateLocal({
        roomCode: durable.roomCode,
        version: committed.version,
        state: committed.state,
      });
      return projectStoredLiveCrapsRoom(durable.roomCode, playerId);
    } catch (error) {
      if (error instanceof Error && error.message === "LIVE_CRAPS_VERSION_CONFLICT") continue;
      throw error;
    }
  }
  throw new Error("Live Craps table changed too quickly. Refresh and try again.");
}

async function assertMember(code: string, playerId: string, token: string) {
  if (!playerId.trim() || !token.trim()) throw new Error("Live Craps player credentials are required.");
  const valid = await verifyDurableLiveCrapsPlayerSession(code, playerId, token);
  if (!valid) throw new Error("Live Craps player session is invalid.");
  await loadAndHydrate(code);
}

export async function createLiveCrapsServerRoom(input: {
  code: string;
  hostPlayerId: string;
  hostName: string;
  diceMode?: LiveCrapsDiceMode;
}) {
  const stored = createStoredLiveCrapsRoom(input);
  const token = randomUUID();
  await createDurableLiveCrapsRoom(stored, input.hostPlayerId, token);
  return {
    code: stored.room.code,
    playerId: input.hostPlayerId,
    token,
    state: projectStoredLiveCrapsRoom(stored.room.code, input.hostPlayerId),
  };
}

export async function joinLiveCrapsServerRoom(code: string, input: { playerId: string; name: string }) {
  const roomCode = normalizeCode(code);
  const token = randomUUID();
  const committed = await applyDurableJoin(
    roomCode,
    `join-${input.playerId}`,
    input.playerId,
    input.name,
    token,
  );
  hydrateLocal(committed);
  return {
    code: roomCode,
    playerId: input.playerId,
    token,
    state: await projectDurableRoom(roomCode, input.playerId),
  };
}

export async function getLiveCrapsRoom(code: string, playerId: string, token: string) {
  await assertMember(code, playerId, token);
  return { state: await projectDurableRoom(code, playerId) };
}

function point(value: unknown): LiveCrapsPoint | undefined {
  const n = Number(value);
  return [4, 5, 6, 8, 9, 10].includes(n) ? (n as LiveCrapsPoint) : undefined;
}

function betKind(value: unknown): LiveCrapsBetKind {
  if (value === "pass-line" || value === "dont-pass" || value === "field" || value === "place") return value;
  throw new Error("Unsupported Standard Table bet.");
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function commandFromAction(
  playerId: string,
  action: string,
  payload: Record<string, unknown>,
): LiveCrapsRoomCommand {
  if (action === "start") return { type: "start", actorPlayerId: playerId };
  if (action === "tick") return { type: "tick" };
  if (action === "place-bet")
    return {
      type: "place-bet",
      actorPlayerId: playerId,
      kind: betKind(payload.kind),
      amount: Number(payload.amount),
      number: point(payload.number),
    };
  if (action === "place-come") {
    if (payload.kind !== "come" && payload.kind !== "dont-come") throw new Error("Come wager kind is invalid.");
    return { type: "place-come", actorPlayerId: playerId, kind: payload.kind, amount: Number(payload.amount) };
  }
  if (action === "place-odds")
    return {
      type: "place-odds",
      actorPlayerId: playerId,
      parentBetId: requiredString(payload.parentBetId, "parentBetId"),
      amount: Number(payload.amount),
    };
  if (action === "undo-bet") return { type: "undo-bet", actorPlayerId: playerId };
  if (action === "clear-new-bets") return { type: "clear-new-bets", actorPlayerId: playerId };
  if (action === "begin-roll") return { type: "begin-roll", actorPlayerId: playerId };
  if (action === "settle-physical")
    return {
      type: "settle-physical",
      actorPlayerId: playerId,
      die1: Number(payload.die1),
      die2: Number(payload.die2),
    };
  if (action === "settle-virtual") return { type: "settle-virtual", actorPlayerId: playerId };
  if (action === "close") return { type: "close", actorPlayerId: playerId };
  throw new Error("Unsupported Live Craps action.");
}

export async function actLiveCrapsRoom(
  code: string,
  playerId: string,
  token: string,
  commandId: string,
  action: string,
  payload: Record<string, unknown> = {},
) {
  await assertMember(code, playerId, token);
  await applyDurableCommand(code, commandId, commandFromAction(playerId, action, payload));
  return { state: await projectDurableRoom(code, playerId) };
}
