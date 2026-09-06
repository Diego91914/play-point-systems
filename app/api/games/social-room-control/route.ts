import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { createInitialState } from "@/lib/play-point-core/holdem";
import { configureManagedState } from "@/lib/play-point-core/holdem-management";

const ROOM_TABLES = {
  "on-my-list": "ppl_on_my_list_rooms",
  "chain-reaction": "ppl_chain_reaction_rooms",
  "how-close": "ppl_how_close_rooms",
  "inside-man": "ppl_inside_man_rooms",
  "all-about-you": "ppl_all_about_you_rooms",
  "mystery": "ppl_mystery_rooms",
  holdem: "ppl_holdem_tables",
} as const;

const ALL_ABOUT_YOU_PHOTO_BUCKET = "all-about-you-guest-photos";

type SocialGame = keyof typeof ROOM_TABLES;
type StoredPlayer = { id?: unknown; name?: unknown; seat?: unknown; tokenHash?: unknown };
type StoredState = { hostPlayerId?: unknown; players?: unknown; settings?: any; tournament?: any; guestPhotoPath?: unknown };
type RoomRow = { code: string; state: StoredState };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function tokenMatches(expected: string, token: string) {
  const actual = Buffer.from(hash(token), "hex");
  const stored = Buffer.from(expected, "hex");
  return actual.length === stored.length && timingSafeEqual(actual, stored);
}

function cleanCode(value: unknown) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Invalid room code.");
  return code;
}

function cleanGame(value: unknown): SocialGame {
  if (typeof value !== "string" || !(value in ROOM_TABLES)) throw new Error("Unsupported social game.");
  return value as SocialGame;
}

function authenticate(state: StoredState, playerId: unknown, token: unknown) {
  if (typeof playerId !== "string" || typeof token !== "string") throw new Error("Invalid player session.");
  const players = Array.isArray(state.players) ? (state.players as StoredPlayer[]) : [];
  const player = players.find((candidate) => candidate?.id === playerId);
  if (!player || typeof player.tokenHash !== "string" || !tokenMatches(player.tokenHash, token)) {
    throw new Error("Invalid player session.");
  }
  return { isHost: state.hostPlayerId === playerId };
}

function restartHoldem(code: string, state: StoredState) {
  const players = Array.isArray(state.players) ? (state.players as StoredPlayer[]) : [];
  const host = players.find((player) => player.id === state.hostPlayerId);
  const settings = state.settings ?? {};
  if (!host || typeof host.id !== "string" || typeof host.name !== "string" || typeof host.tokenHash !== "string") {
    throw new Error("Hold'em host is missing.");
  }

  const startingStack = Number(settings.startingStack) || 10000;
  const smallBlind = Number(state.tournament?.baseSmallBlind ?? settings.smallBlind) || 50;
  const bigBlind = Number(state.tournament?.baseBigBlind ?? settings.bigBlind) || 100;
  const maxPlayers = Number(settings.maxPlayers) || 8;
  const base = createInitialState({
    code,
    hostPlayerId: host.id,
    hostName: host.name,
    hostTokenHash: host.tokenHash,
    startingStack,
    smallBlind,
    bigBlind,
    maxPlayers,
  });
  const next = configureManagedState(base, settings.mode, state.tournament?.preset);
  next.players = players.map((player, index) => ({
    id: String(player.id ?? ""),
    name: String(player.name ?? `Player ${index + 1}`),
    seat: Number.isInteger(player.seat) ? Number(player.seat) : index,
    stack: startingStack,
    streetBet: 0,
    contribution: 0,
    status: "waiting" as const,
    holeCards: [],
    acted: false,
    raiseLocked: false,
    tokenHash: String(player.tokenHash ?? ""),
    sittingOut: false,
    handStartStack: startingStack,
    finishPlace: null,
    eliminatedAtHand: null,
  }));
  next.message = "Table reset. Invite anyone new, then deal when everyone is ready.";
  next.updatedAt = new Date().toISOString();
  return next;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const game = cleanGame(body.game);
    const code = cleanCode(body.code);
    const action = body.action === "quit" ? "quit" : body.action === "start-over" ? "start-over" : "status";
    const supabase = getSupabaseServerClient();
    const table = ROOM_TABLES[game];
    const { data, error } = await supabase.from(table).select("code,state").eq("code", code).maybeSingle();
    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json({ success: true, ended: true, isHost: false }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const row = data as RoomRow;
    const session = authenticate(row.state, body.playerId, body.token);

    if (action === "quit") {
      if (!session.isHost) return NextResponse.json({ error: "Only the host can end the game." }, { status: 403 });
      const photoPath = game === "all-about-you" && typeof row.state.guestPhotoPath === "string" ? row.state.guestPhotoPath : null;
      const { error: deleteError } = await supabase.from(table).delete().eq("code", code);
      if (deleteError) throw new Error(deleteError.message);
      if (photoPath) {
        const { error: photoDeleteError } = await supabase.storage.from(ALL_ABOUT_YOU_PHOTO_BUCKET).remove([photoPath]);
        if (photoDeleteError) console.warn("Unable to remove All About You room photo", photoDeleteError.message);
      }
      return NextResponse.json({ success: true, ended: true, isHost: true }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (action === "start-over") {
      if (!session.isHost) return NextResponse.json({ error: "Only the host can start over." }, { status: 403 });
      if (game !== "holdem") return NextResponse.json({ error: "Use the game room restart action." }, { status: 400 });
      const nextState = restartHoldem(code, row.state);
      const { error: updateError } = await supabase.from(table).update({ state: nextState, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }).eq("code", code);
      if (updateError) throw new Error(updateError.message);
      return NextResponse.json({ success: true, ended: false, isHost: true }, { headers: { "Cache-Control": "private, no-store" } });
    }

    return NextResponse.json({ success: true, ended: false, isHost: session.isHost }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to control room.";
    const status = message === "Invalid player session." ? 403 : 400;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
