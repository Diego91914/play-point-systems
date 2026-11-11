import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GAMES_SESSION_COOKIE, gamesSessionOwns, verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  changeStackPlayers, configureStack, initialStackState, normalizeStackState, replayStack, scoreStack, startStack, type StackMatchConfig, type StackState,
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
    stack_size: row.stack_size, status: row.status, scoring_run_id: row.scoring_run_id ?? null,
    game_state: row.game_state,
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

async function latestUndoAction(supabase: ReturnType<typeof getSupabaseServerClient>, room: Record<string, unknown>) {
  if (room.status === "closed") return null;
  try {
    let query = supabase.from("ppl_clear_stack_score_actions")
      .select("action_id,after_state,after_status")
      .eq("room_id", room.id).eq("action_type", "score").is("undone_at", null);
    query = room.scoring_run_id == null ? query.is("game_run_id", null) : query.eq("game_run_id", room.scoring_run_id);
    const { data } = await query.order("result_version", { ascending: false }).limit(1).maybeSingle();
    if (!data || data.after_status !== room.status || canonicalJson(data.after_state) !== canonicalJson(room.game_state)) return null;
    return String(data.action_id);
  } catch {
    // Host recovery remains available if a deployment is being rolled out
    // before the additive undo-history migration is applied.
    return null;
  }
}

function roomFromRpc(value: Record<string, unknown>) {
  return value.room && typeof value.room === "object" ? viewRoom(value.room as Record<string, unknown>) : null;
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
      .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at,scoring_run_id")
      .eq("host_session_id", host)
      .not("spectator_token", "is", null)
      .neq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
  }
  const { data: activeRoom, error: lookupError } = await existingHostRoom();
  if (lookupError) return error("Could not check for an existing active game.", 500);
  if (activeRoom) {
    const undoActionId = await latestUndoAction(supabase, activeRoom);
    return NextResponse.json({ room: { ...viewRoom(activeRoom), undo_action_id: undoActionId }, reused: true }, { headers: noStore });
  }

  const spectatorToken = Array.from(crypto.getRandomValues(new Uint8Array(32)),
    byte => byte.toString(16).padStart(2, "0")).join("");
  const { data, error: dbError } = await supabase.from("ppl_clear_stack_rooms")
    .insert({
      host_session_id: host, distance, stack_size: stackSize,
      spectator_token: spectatorToken,
      game_state: initialStackState(distance, stackSize),
    })
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at,scoring_run_id")
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
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at,scoring_run_id")
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
  const undoActionId = await latestUndoAction(supabase, data);
  const actionId = new URL(request.url).searchParams.get("action_id");
  let actionConfirmed: boolean | null = null;
  if (actionId && /^[0-9a-f-]{36}$/i.test(actionId)) {
    const { data: action } = await supabase.from("ppl_clear_stack_score_actions")
      .select("action_id").eq("room_id", data.id).eq("action_id", actionId).maybeSingle();
    actionConfirmed = !!action;
  }
  return NextResponse.json({ room: { ...viewRoom(data), undo_action_id: undoActionId }, action_confirmed: actionConfirmed }, { headers: noStore });
}

export async function PATCH(request: Request) {
  const host = await hostIdentity();
  if (!host) return error("Only the host can control this game.", 401);
  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const version = Number(body.version);
  const actionId = String(body.action_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(version) || version < 0
    || (["makes", "undo"].includes(String(body.action)) && !/^[0-9a-f-]{36}$/i.test(actionId)))
    return error("Invalid room or version.", 400);

  const supabase = getSupabaseServerClient();
  const { data: room, error: readError } = await supabase.from("ppl_clear_stack_rooms")
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at,scoring_run_id")
    .eq("id", id).eq("host_session_id", host).maybeSingle();
  if (readError || !room) return error("Host room not found.", 404);
  if (["makes", "undo"].includes(String(body.action))) {
    const { data: duplicateAction } = await supabase.from("ppl_clear_stack_score_actions")
      .select("action_id").eq("room_id", id).eq("action_id", actionId).maybeSingle();
    if (duplicateAction) {
      const undoActionId = await latestUndoAction(supabase, room);
      return NextResponse.json({ room: { ...viewRoom(room), undo_action_id: undoActionId }, duplicate: true }, { headers: noStore });
    }
  }
  if (room.status === "closed") {
    if (body.action === "close") return NextResponse.json({ room: viewRoom(room), ended: true, alreadyEnded: true }, { headers: noStore });
    return error("Host room not found.", 404);
  }
  if (room.state_version !== version) return error("Game updated elsewhere. Reload and try again.", 409);

  const state = normalizeStackState(room.game_state, room.distance, room.stack_size);
  const matchBody = body.match && typeof body.match === "object" ? {
    mode: String(body.match.mode), setsToPlay: Number(body.match.setsToPlay),
  } as StackMatchConfig : undefined;
  let next: StackState = state;
  let status = room.status as string;
  try {
    if (body.action === "configure") {
      if (room.status !== "open") return error("Setup can only change before the game begins.", 409);
      next = configureStack(state, Number(body.distance), Number(body.stackSize), matchBody);
      status = "open";
    } else if (body.action === "start") {
      next = startStack(state, body.names, Number(body.distance), Number(body.stackSize), matchBody);
      status = "playing";
    } else if (body.action === "undo") {
      const { data: result, error: rpcError } = await supabase.rpc("ppl_clear_stack_undo_score", {
        p_room_id: id, p_host_session_id: host, p_expected_version: version, p_action_id: actionId,
      });
      if (rpcError) return error("Undo could not be saved. Refresh the game before trying again.", 500);
      const value = result as Record<string, unknown>;
      const updated = roomFromRpc(value);
      if (!value.ok) {
        const undoActionId = updated ? await latestUndoAction(supabase, value.room as Record<string, unknown>) : null;
        return NextResponse.json({ error: String(value.error ?? "Undo failed."), ...(updated ? { room: { ...updated, undo_action_id: undoActionId } } : {}) },
          { status: Number(value.status ?? 409), headers: noStore });
      }
      if (!updated) return error("Undo response was incomplete. Refresh the game.", 500);
      const undoActionId = await latestUndoAction(supabase, value.room as Record<string, unknown>);
      return NextResponse.json({ room: { ...updated, undo_action_id: undoActionId }, duplicate: value.duplicate === true }, { headers: noStore });
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

  if (body.action === "makes") {
    const { data: result, error: rpcError } = await supabase.rpc("ppl_clear_stack_commit_score", {
      p_room_id: id, p_host_session_id: host, p_expected_version: version,
      p_action_id: actionId, p_next_state: next, p_next_status: status,
    });
    if (rpcError) return error("Score could not be confirmed. Refresh the game before scoring again.", 503);
    const value = result as Record<string, unknown>;
    const updated = roomFromRpc(value);
    if (!value.ok) {
      const undoActionId = updated ? await latestUndoAction(supabase, value.room as Record<string, unknown>) : null;
      return NextResponse.json({ error: String(value.error ?? "Score could not be saved."), ...(updated ? { room: { ...updated, undo_action_id: undoActionId } } : {}) },
        { status: Number(value.status ?? 409), headers: noStore });
    }
    if (!updated) return error("Score response was incomplete. Refresh the game.", 500);
    const undoActionId = await latestUndoAction(supabase, value.room as Record<string, unknown>);
    return NextResponse.json({ room: { ...updated, undo_action_id: undoActionId }, duplicate: value.duplicate === true }, { headers: noStore });
  }

  const { data: updated, error: updateError } = await supabase.from("ppl_clear_stack_rooms")
    .update({
      game_state: next, status,
      distance: next.distance, stack_size: next.stackSize,
      ...(body.action === "start" || body.action === "replay" ? { scoring_run_id: crypto.randomUUID() } : {}),
      state_version: version + 1, updated_at: new Date().toISOString(),
    })
    .eq("id", id).eq("host_session_id", host).eq("state_version", version)
    .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at,scoring_run_id")
    .maybeSingle();
  if (updateError) return error("Failed to save game state. Please retry.", 500);
  if (!updated) {
    if (body.action === "close") {
      const { data: afterRace, error: rereadError } = await supabase.from("ppl_clear_stack_rooms")
        .select("id,code,spectator_token,state_version,distance,stack_size,status,game_state,updated_at,scoring_run_id")
        .eq("id", id).eq("host_session_id", host).maybeSingle();
      if (!rereadError && afterRace?.status === "closed") {
        return NextResponse.json({ room: viewRoom(afterRace), ended: true, alreadyEnded: true }, { headers: noStore });
      }
    }
    return error("Another update occurred. Reload game state.", 409);
  }
  return NextResponse.json({ room: viewRoom(updated) }, { headers: noStore });
}
