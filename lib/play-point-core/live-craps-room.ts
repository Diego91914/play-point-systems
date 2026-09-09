import { createLiveCrapsTable, getLiveCrapsShooter, type LiveCrapsPlayer, type LiveCrapsTable } from "./live-craps";
import { LIVE_CRAPS_STARTING_BANKROLL, type LiveCrapsBankroll } from "./live-craps-bets";
import { createLiveCrapsAtsState, type LiveCrapsAtsState } from "./live-craps-ats";
import { createLiveCrapsDiceOutState, type LiveCrapsActionClockState, type LiveCrapsActionSeconds } from "./live-craps-dice-out";
import type { LiveCrapsDiceMode } from "./live-craps-dice-mode";
import type { LiveCrapsSettlementState } from "./live-craps-settlement";

export type LiveCrapsRoomPhase = "lobby" | "playing" | "closed";
export type LiveCrapsRoom = {
  code: string;
  hostPlayerId: string;
  phase: LiveCrapsRoomPhase;
  diceMode: LiveCrapsDiceMode;
  beginnerMode: boolean;
  tableMinimum: 10;
  actionClock: LiveCrapsActionClockState;
  game: LiveCrapsSettlementState;
  createdAt: string;
};

function normalizeCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(normalized)) throw new Error("Live Craps room code must be 4 to 8 letters or numbers.");
  return normalized;
}

export function createLiveCrapsRoom(input: {
  code: string;
  hostPlayerId: string;
  hostName: string;
  diceMode?: LiveCrapsDiceMode;
  actionSeconds?: LiveCrapsActionSeconds;
  createdAt?: string;
}): LiveCrapsRoom {
  if (!input.hostPlayerId.trim()) throw new Error("Host player id is required.");
  const table = createLiveCrapsTable({ players: [{ id: input.hostPlayerId, name: input.hostName, seat: 0 }] });
  const shooter = getLiveCrapsShooter(table)!;
  return {
    code: normalizeCode(input.code), hostPlayerId: input.hostPlayerId, phase: "lobby",
    diceMode: input.diceMode ?? "physical", beginnerMode: true, tableMinimum: 10,
    actionClock: createLiveCrapsDiceOutState(input.actionSeconds ?? 15),
    game: { table, bets: [], comeBets: [], odds: [], buyLayBets: [], hardwayBets: [], propBets: [], bankrolls: [{ playerId: input.hostPlayerId, chips: LIVE_CRAPS_STARTING_BANKROLL }], ats: createLiveCrapsAtsState(shooter.id), settledRollIds: [] },
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function joinLiveCrapsRoom(room: LiveCrapsRoom, input: { playerId: string; name: string }): LiveCrapsRoom {
  if (room.phase !== "lobby") throw new Error("Players may join this Live Craps room only while it is in the lobby.");
  if (!input.playerId.trim()) throw new Error("Player id is required.");
  if (room.game.table.players.some((player) => player.id === input.playerId)) return room;
  if (room.game.table.players.length >= 12) throw new Error("Live Craps supports at most 12 players.");
  const used = new Set(room.game.table.players.map((player) => player.seat)); let seat = 0; while (used.has(seat)) seat += 1;
  const player: LiveCrapsPlayer = { id: input.playerId, name: input.name.trim() || "Player", seat, sittingOut: false };
  return { ...room, game: { ...room.game, table: { ...room.game.table, players: [...room.game.table.players, player].sort((a,b)=>a.seat-b.seat) }, bankrolls: [...room.game.bankrolls, { playerId: input.playerId, chips: LIVE_CRAPS_STARTING_BANKROLL }] } };
}

export function startLiveCrapsRoom(room: LiveCrapsRoom, actorPlayerId: string): LiveCrapsRoom {
  if (actorPlayerId !== room.hostPlayerId) throw new Error("Only the host may start Live Craps.");
  if (room.phase !== "lobby") throw new Error("Live Craps room is not in the lobby.");
  if (room.game.table.players.length < 1) throw new Error("Live Craps needs at least one player.");
  return { ...room, phase: "playing" };
}

export function closeLiveCrapsRoom(room: LiveCrapsRoom, actorPlayerId: string): LiveCrapsRoom {
  if (actorPlayerId !== room.hostPlayerId) throw new Error("Only the host may close Live Craps.");
  return { ...room, phase: "closed" };
}

export function projectLiveCrapsRoom(room: LiveCrapsRoom, viewerPlayerId: string) {
  const player = room.game.table.players.find((candidate) => candidate.id === viewerPlayerId);
  if (!player) throw new Error("Viewer is not a member of this Live Craps room.");
  const bankroll = room.game.bankrolls.find((candidate) => candidate.playerId === viewerPlayerId);
  const shooter = getLiveCrapsShooter(room.game.table);
  return {
    code: room.code, phase: room.phase, diceMode: room.diceMode, beginnerMode: room.beginnerMode,
    tableMinimum: room.tableMinimum, actionClock: room.actionClock,
    point: room.game.table.point, shooterId: shooter?.id ?? null, shooterName: shooter?.name ?? null,
    players: room.game.table.players.map(({ id, name, seat, sittingOut }) => ({ id, name, seat, sittingOut })),
    me: { id: player.id, seat: player.seat, isHost: player.id === room.hostPlayerId, chips: bankroll?.chips ?? 0 },
    myBets: room.game.bets.filter((bet) => bet.playerId === viewerPlayerId),
    myComeBets: room.game.comeBets.filter((bet) => bet.playerId === viewerPlayerId),
    myOdds: room.game.odds.filter((bet) => bet.playerId === viewerPlayerId),
    myBuyLayBets: room.game.buyLayBets.filter((bet) => bet.playerId === viewerPlayerId),
    myHardways: room.game.hardwayBets.filter((bet) => bet.playerId === viewerPlayerId),
    myProps: room.game.propBets.filter((bet) => bet.playerId === viewerPlayerId),
    recentRolls: room.game.table.history.slice(-5).map(({ id, shooterId, die1, die2, total, outcome }) => ({ id, shooterId, die1, die2, total, outcome })),
  };
}
