import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  applyAction,
  createInitialState,
  evaluateBest,
  type HoldemAction,
  type HoldemPlayer,
  type HoldemState,
} from "@/lib/play-point-core/holdem";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_SETTINGS = { startingStack: 10000, smallBlind: 50, bigBlind: 100, maxPlayers: 8 };

type TableRow = { code: string; state: HoldemState; version: number };

function cleanName(value: unknown): string {
  if (typeof value !== "string") throw new Error("Enter your name.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 24) throw new Error("Name must be 1 to 24 characters.");
  return name;
}

function cleanInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function cleanRoomCode(value: unknown): string {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Enter a valid 6-character room code.");
  return code;
}

function createRoomCode(): string {
  let code = "";
  const bytes = randomBytes(6);
  for (const byte of bytes) code += ROOM_ALPHABET[byte % ROOM_ALPHABET.length];
  return code;
}

function createPlayerToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(expectedHash: string, token: string): boolean {
  if (!token) return false;
  const actual = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function readTable(code: string): Promise<TableRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ppl_holdem_tables")
    .select("code, state, version")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(`Unable to load table: ${error.message}`);
  return data as TableRow | null;
}

async function updateTable(row: TableRow, state: HoldemState): Promise<TableRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ppl_holdem_tables")
    .update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 86400000).toISOString() })
    .eq("code", row.code)
    .eq("version", row.version)
    .select("code, state, version")
    .maybeSingle();
  if (error) throw new Error(`Unable to update table: ${error.message}`);
  return data as TableRow | null;
}

function authenticate(state: HoldemState, playerId: string, token: string): HoldemPlayer {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || !tokenMatches(player.tokenHash, token)) throw new Error("Invalid player session.");
  return player;
}

function projectedPlayer(player: HoldemPlayer, state: HoldemState, revealPrivate: boolean) {
  const revealAtShowdown = state.status === "showdown" && player.status !== "folded" && player.status !== "out";
  return {
    id: player.id,
    name: player.name,
    seat: player.seat,
    stack: player.stack,
    streetBet: player.streetBet,
    contribution: player.contribution,
    status: player.status,
    acted: player.acted,
    isDealer: state.dealerSeat === player.seat,
    isSmallBlind: state.smallBlindSeat === player.seat,
    isBigBlind: state.bigBlindSeat === player.seat,
    isTurn: state.actionSeat === player.seat,
    holeCards: revealPrivate || revealAtShowdown ? player.holeCards : [],
  };
}

export function projectTable(state: HoldemState, viewerId: string) {
  const me = state.players.find((player) => player.id === viewerId);
  if (!me) throw new Error("Player not found.");
  const toCall = Math.max(0, state.currentBet - me.streetBet);
  const maxRaiseTo = me.streetBet + me.stack;
  const minRaiseTo = state.currentBet === 0 ? state.settings.bigBlind : state.currentBet + state.lastRaiseSize;
  let bestHand: { name: string; bestFive: string[] } | null = null;
  if (me.holeCards.length === 2 && state.board.length >= 3) {
    const cards = [...me.holeCards, ...state.board];
    if (cards.length >= 5) {
      const best = evaluateBest(cards);
      bestHand = { name: best.name, bestFive: best.cards };
    }
  }
  return {
    code: state.code,
    status: state.status,
    settings: state.settings,
    handNumber: state.handNumber,
    street: state.street,
    board: state.board,
    currentBet: state.currentBet,
    pot: state.players.reduce((sum, player) => sum + player.contribution, 0),
    winners: state.winners,
    message: state.message,
    lastAction: state.lastAction,
    players: state.players
      .slice()
      .sort((a, b) => a.seat - b.seat)
      .map((player) => projectedPlayer(player, state, player.id === viewerId)),
    me: {
      id: me.id,
      name: me.name,
      seat: me.seat,
      stack: me.stack,
      status: me.status,
      holeCards: me.holeCards,
      isHost: state.hostPlayerId === me.id,
      isTurn: state.actionSeat === me.seat,
      toCall,
      minRaiseTo,
      maxRaiseTo,
      raiseLocked: me.raiseLocked,
      bestHand,
    },
    updatedAt: state.updatedAt,
  };
}

export function projectPublicTable(state: HoldemState) {
  return {
    code: state.code,
    status: state.status,
    settings: state.settings,
    handNumber: state.handNumber,
    street: state.street,
    board: state.board,
    currentBet: state.currentBet,
    pot: state.players.reduce((sum, player) => sum + player.contribution, 0),
    winners: state.winners,
    message: state.message,
    lastAction: state.lastAction,
    players: state.players
      .slice()
      .sort((a, b) => a.seat - b.seat)
      .map((player) => projectedPlayer(player, state, false)),
    updatedAt: state.updatedAt,
  };
}

export async function createTable(input: { name: unknown; startingStack?: unknown; smallBlind?: unknown; bigBlind?: unknown; maxPlayers?: unknown }) {
  const name = cleanName(input.name);
  const startingStack = cleanInteger(input.startingStack, DEFAULT_SETTINGS.startingStack, 1000, 1000000);
  const smallBlind = cleanInteger(input.smallBlind, DEFAULT_SETTINGS.smallBlind, 1, 100000);
  const bigBlind = cleanInteger(input.bigBlind, DEFAULT_SETTINGS.bigBlind, 2, 200000);
  const maxPlayers = cleanInteger(input.maxPlayers, DEFAULT_SETTINGS.maxPlayers, 2, 8);
  if (bigBlind <= smallBlind) throw new Error("Big blind must be larger than small blind.");
  if (startingStack < bigBlind * 10) throw new Error("Starting stack must be at least 10 big blinds.");

  const supabase = getSupabaseServerClient();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createRoomCode();
    const token = createPlayerToken();
    const playerId = randomUUID();
    const state = createInitialState({ code, hostPlayerId: playerId, hostName: name, hostTokenHash: hashToken(token), startingStack, smallBlind, bigBlind, maxPlayers });
    const { error } = await supabase.from("ppl_holdem_tables").insert({ code, state });
    if (!error) return { playerId, token, table: projectTable(state, playerId) };
    if (error.code !== "23505") throw new Error(`Unable to create table: ${error.message}`);
  }
  throw new Error("Unable to generate a room code. Try again.");
}

export async function joinTable(codeInput: unknown, nameInput: unknown) {
  const code = cleanRoomCode(codeInput);
  const name = cleanName(nameInput);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const row = await readTable(code);
    if (!row) throw new Error("Table not found.");
    const state = structuredClone(row.state);
    if (state.status !== "lobby") throw new Error("This table has already started.");
    if (state.players.length >= state.settings.maxPlayers) throw new Error("This table is full.");
    if (state.players.some((player) => player.name.toLowerCase() === name.toLowerCase())) throw new Error("That name is already seated at this table.");

    const occupied = new Set(state.players.map((player) => player.seat));
    const seat = Array.from({ length: state.settings.maxPlayers }, (_, index) => index).find((candidate) => !occupied.has(candidate));
    if (seat == null) throw new Error("This table is full.");
    const playerId = randomUUID();
    const token = createPlayerToken();
    state.players.push({ id: playerId, name, seat, stack: state.settings.startingStack, streetBet: 0, contribution: 0, status: "waiting", holeCards: [], acted: false, raiseLocked: false, tokenHash: hashToken(token) });
    state.message = `${name} joined the table.`;
    state.updatedAt = new Date().toISOString();
    const saved = await updateTable(row, state);
    if (saved) return { playerId, token, table: projectTable(saved.state, playerId) };
  }
  throw new Error("The table changed while you were joining. Try again.");
}

export async function getTableForPlayer(codeInput: string, playerId: string, token: string) {
  const code = cleanRoomCode(codeInput);
  const row = await readTable(code);
  if (!row) throw new Error("Table not found.");
  authenticate(row.state, playerId, token);
  return projectTable(row.state, playerId);
}

export async function getPublicTable(codeInput: string) {
  const code = cleanRoomCode(codeInput);
  const row = await readTable(code);
  if (!row) throw new Error("Table not found.");
  return projectPublicTable(row.state);
}

export async function performTableAction(codeInput: string, playerId: string, token: string, action: HoldemAction) {
  const code = cleanRoomCode(codeInput);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const row = await readTable(code);
    if (!row) throw new Error("Table not found.");
    const player = authenticate(row.state, playerId, token);
    if (action.type === "start_hand" && row.state.hostPlayerId !== player.id) throw new Error("Only the host can deal the next hand.");
    const nextState = applyAction(row.state, player.id, action);
    const saved = await updateTable(row, nextState);
    if (saved) return projectTable(saved.state, player.id);
  }
  throw new Error("The table changed before your action could be saved. Try again.");
}
