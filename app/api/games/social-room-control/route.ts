import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const ROOM_TABLES = {
  "on-my-list": "ppl_on_my_list_rooms",
  "chain-reaction": "ppl_chain_reaction_rooms",
  "how-close": "ppl_how_close_rooms",
  "inside-man": "ppl_inside_man_rooms",
} as const;

type SocialGame = keyof typeof ROOM_TABLES;
type StoredPlayer = { id?: unknown; tokenHash?: unknown };
type StoredState = { hostPlayerId?: unknown; players?: unknown };
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const game = cleanGame(body.game);
    const code = cleanCode(body.code);
    const action = body.action === "quit" ? "quit" : "status";
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
      const { error: deleteError } = await supabase.from(table).delete().eq("code", code);
      if (deleteError) throw new Error(deleteError.message);
      return NextResponse.json({ success: true, ended: true, isHost: true }, { headers: { "Cache-Control": "private, no-store" } });
    }

    return NextResponse.json({ success: true, ended: false, isHost: session.isHost }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to control room.";
    const status = message === "Invalid player session." ? 403 : 400;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
