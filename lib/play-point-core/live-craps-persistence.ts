import "server-only";

import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "./quick-score-supabase";
import type { LiveCrapsStoredRoom } from "./live-craps-room-store";

const ROOM_TTL_MS = 8 * 60 * 60 * 1000;

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function persistenceError(prefix: string, error: { message?: string } | null) {
  return new Error(`${prefix}: ${error?.message ?? "unknown persistence error"}`);
}

export type DurableLiveCrapsRoom = {
  roomCode: string;
  version: number;
  state: LiveCrapsStoredRoom;
};

export async function createDurableLiveCrapsRoom(
  stored: LiveCrapsStoredRoom,
  playerId: string,
  token: string,
) {
  const supabase = getSupabaseServerClient();
  const expiresAt = new Date(Date.now() + ROOM_TTL_MS).toISOString();
  const { data, error } = await supabase.rpc("ppl_live_craps_create_room", {
    p_room_code: stored.room.code,
    p_state: stored,
    p_token_hash: hashToken(token),
    p_player_id: playerId,
    p_expires_at: expiresAt,
  });
  if (error) throw persistenceError("Failed to create durable Live Craps room", error);
  return { roomCode: normalizeCode(stored.room.code), version: Number(data ?? 1), state: stored } satisfies DurableLiveCrapsRoom;
}

export async function loadDurableLiveCrapsRoom(roomCode: string): Promise<DurableLiveCrapsRoom> {
  const supabase = getSupabaseServerClient();
  const code = normalizeCode(roomCode);
  const { data, error } = await supabase
    .from("ppl_live_craps_rooms")
    .select("room_code, version, state, expires_at")
    .eq("room_code", code)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw persistenceError("Failed to load durable Live Craps room", error);
  if (!data) throw new Error("Live Craps room not found.");
  return {
    roomCode: data.room_code,
    version: Number(data.version),
    state: data.state as LiveCrapsStoredRoom,
  };
}

export async function commitDurableLiveCrapsCommand(input: {
  roomCode: string;
  expectedVersion: number;
  commandId: string;
  state: LiveCrapsStoredRoom;
}): Promise<{ applied: boolean; version: number; state: LiveCrapsStoredRoom }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("ppl_live_craps_commit_command", {
    p_room_code: normalizeCode(input.roomCode),
    p_expected_version: input.expectedVersion,
    p_command_id: input.commandId,
    p_state: input.state,
  });
  if (error) {
    if (error.message?.includes("LIVE_CRAPS_VERSION_CONFLICT")) {
      throw new Error("LIVE_CRAPS_VERSION_CONFLICT");
    }
    throw persistenceError("Failed to commit durable Live Craps command", error);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Live Craps persistence returned no command result.");
  return {
    applied: Boolean(row.applied),
    version: Number(row.version),
    state: row.state as LiveCrapsStoredRoom,
  };
}

export async function addDurableLiveCrapsPlayerSession(roomCode: string, playerId: string, token: string) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.rpc("ppl_live_craps_add_player_session", {
    p_room_code: normalizeCode(roomCode),
    p_player_id: playerId,
    p_token_hash: hashToken(token),
  });
  if (error) throw persistenceError("Failed to create Live Craps player session", error);
}

export async function verifyDurableLiveCrapsPlayerSession(roomCode: string, playerId: string, token: string) {
  if (!playerId.trim() || !token.trim()) return false;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("ppl_live_craps_touch_player_session", {
    p_room_code: normalizeCode(roomCode),
    p_player_id: playerId,
    p_token_hash: hashToken(token),
  });
  if (error) throw persistenceError("Failed to verify Live Craps player session", error);
  return data === true;
}
