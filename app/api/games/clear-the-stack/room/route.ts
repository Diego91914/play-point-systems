import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GAMES_SESSION_COOKIE, gamesSessionOwns, verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  changeStackPlayers, configureStack, initialStackState, replayStack, scoreStack, startStack, type StackState,
} from "@/lib/play-point-core/clear-stack-engine";

const SKU = "game.clear_the_stack";
const noStore = { "Cache-Control": "private, no-store" };

async function hostIdentity() {
  const token = (await cookies()).get(GAMES_SESSION_COOKIE)?.value;
  const claims = await verifyGamesSessionToken(token);
  return claims && gamesSessionOwns(claims, SKU) ? claims.sub : null;
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}

function viewRoom(row: Record<string, unknown>) {
  return {
    updated_at: row.updated_at, id: row.id, code: row.code, spectator_token: row.spectator_token,
    state_version: row.state_version, distance: row.distance,
    stack_size: row.stack_size, status: row.status,
    game_state: row.game_state,
  };
}

export async function POST(request: Request) {
  const host = await hostIdentity();
  if (!host) return error("Sign in with an account that owns Clear the Stack.", 401);
  const body = await request.json().catch(() => ({}));
  const distance = Number(body.distance), stackSize = Number(body.stackSize);
  if (!Number.isInteger(distance) || distance < 1 || distance > 100
    || !Number.isInteger(stackSize) || stackSize < 1 || stackSize > 100)
    return error("Choose a valid distance and number of discs.", 400);

  const supabase = getSupabaseServerClient();
  // Never create a second live Clear the Stack room for the same host.
  // The database has an additional unique index to cover concurrent requests.
  async function existingHostRoom() {
    return supabase.from("ppl_clear_stack_rooms")
      .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at")
      .eq("host_session_id", host)
      .not("spectator_token", "is", null)
      .neq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
  }
  const { data: activeRoom, error: lookupError } = await existingHostRoom();
  if (lookupError) return error("Could not check for an existing active game.", 500);
  if (activeRoom) return NextResponse.json({ room: viewRoom(activeRoom), reused: true }, { headers: noStore });

  const spectatorToken = Array.from(crypto.getRandomValues(new Uint8Array(32)),
    byte => byte.toString(16).padStart(2, "0")).join("");
  const { data, error: dbError } = await supabase.from("ppl_clear_stack_rooms")
    .insert({
      host_session_id: host, distance, stack_size: stackSize,
      spectator_token: spectatorToken,
      game_state: initialStackState(distance, stackSize),
    })
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at")
    .single();
  if (dbError?.code === "23505") {
    const { data: concurrent, error: conflictError } = await existingHostRoom();
    if (!conflictError && concurrent)
      return NextResponse.json({ room: viewRoom(concurrent), reused: true }, { headers: noStore });
    return error("An active session was created elsewhere. Reload and resume it.", 409);
  }
  if (dbError || !data) return error("Could not create spectator link. Check the database connection and migration.", 500);
  return NextResponse.json({ room: viewRoom(data), reused: false }, { headers: noStore });
}

export async function GET(request: Request) {
  const host = await hostIdentity();
  if (!host) return error("Host account required.", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return error("Invalid room.", 400);
  const supabase = getSupabaseServerClient();
  let query = supabase.from("ppl_clear_stack_rooms")
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at")
    .eq("host_session_id", host);
  if (id) query = query.eq("id", id);
  else query = query.not("spectator_token", "is", null).neq("status", "closed")
    .order("created_at", { ascending: false }).limit(1);
  const { data, error: dbError } = await query.maybeSingle();
  if (dbError) return error("Could not check your saved game. Retry when connected.", 503);
  if (!data) return id ? error("Host room not found.", 404)
    : NextResponse.json({ room: null }, { headers: noStore });
  // Only an owned, explicitly closed room proves that recovery can be cleared.
  if (data.status === "closed") return error("This host session has ended.", 410);
  return NextResponse.json({ room: viewRoom(data) }, { headers: noStore });
}

export async function PATCH(request: Request) {
  const host = await hostIdentity();
  if (!host) return error("Only the host can control this game.", 401);
  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const version = Number(body.version);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(version) || version < 0)
    return error("Invalid room or version.", 400);

  const supabase = getSupabaseServerClient();
  const { data: room, error: readError } = await supabase.from("ppl_clear_stack_rooms")
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at")
    .eq("id", id).eq("host_session_id", host).maybeSingle();
  if (readError || !room || room.status === "closed") return error("Host room not found.", 404);
  if (room.state_version !== version) return error("Game updated elsewhere. Reload and try again.", 409);

  const state = room.game_state && typeof room.game_state === "object"
    && "phase" in room.game_state
    ? room.game_state as StackState
    : initialStackState(room.distance, room.stack_size);
  let next: StackState = state;
  let status = room.status as string;
  try {
    if (body.action === "configure") {
      if (room.status !== "open") return error("Setup can only change before the game begins.", 409);
      next = configureStack(state, Number(body.distance), Number(body.stackSize));
      status = "open";
    } else if (body.action === "start") {
      next = startStack(state, body.names, Number(body.distance), Number(body.stackSize));
      status = "playing";
    } else if (body.action === "makes") {
      next = scoreStack(state, Number(body.makes));
      status = next.phase === "finished" ? "finished" : "playing";
    } else if (body.action === "replay") {
      next = replayStack(state);
      status = "playing";
    } else if (body.action === "change_players") {
      next = changeStackPlayers(state);
      status = "open";
    } else if (body.action === "close") {
      status = "closed";
    } else {
      return error("Unknown game action.", 400);
    }
  } catch (e) {
    return error(e instanceof Error ? e.message : "Invalid game action.", 400);
  }

  const { data: updated, error: updateError } = await supabase.from("ppl_clear_stack_rooms")
    .update({
      game_state: next, status,
      distance: next.distance, stack_size: next.stackSize,
      state_version: version + 1, updated_at: new Date().toISOString(),
    })
    .eq("id", id).eq("host_session_id", host).eq("state_version", version)
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at")
    .maybeSingle();
  if (updateError) return error("Failed to save game state. Please retry.", 500);
  if (!updated) return error("Another update occurred. Reload game state.", 409);
  return NextResponse.json({ room: viewRoom(updated) }, { headers: noStore });
}
