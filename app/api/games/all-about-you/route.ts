import { NextRequest, NextResponse } from "next/server";
import {
  createAllAboutYouRoom,
  getAllAboutYouRoom,
  joinAllAboutYouRoom,
  recoverAllAboutYouHost,
} from "@/lib/play-point-core/all-about-you-server";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";

const ENTRY_ROLE_COOKIE = "pps-all-about-you-entry-role";

type EntryRole = "star" | "player";
type StoredPlayer = { id: string; name: string };
type StoredState = {
  status?: string;
  guestId?: string | null;
  players?: StoredPlayer[];
  message?: string;
  [key: string]: unknown;
};
type StoredRow = { state: StoredState; version: number };

function entryRole(request: NextRequest): EntryRole {
  return request.cookies.get(ENTRY_ROLE_COOKIE)?.value === "star" ? "star" : "player";
}

async function applyEntryRole(code: string, playerId: string, role: EntryRole) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ppl_all_about_you_rooms")
    .select("state,version")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Room not found.");

  const row = data as StoredRow;
  const state = { ...row.state };
  if (state.status !== "lobby") throw new Error("The Star can only be assigned before the game starts.");

  if (role === "star") {
    if (state.guestId && state.guestId !== playerId) throw new Error("Someone else is already marked as the Star for this room.");
    state.guestId = playerId;
    const name = state.players?.find(player => player.id === playerId)?.name ?? "Guest of Honor";
    state.message = `${name} is tonight's Guest of Honor.`;
  } else if (state.guestId === playerId) {
    state.guestId = null;
    state.message = "The Star has not been assigned yet. Whoever the game is about can choose “I’m the Star” when entering.";
  }

  const { data: saved, error: saveError } = await supabase
    .from("ppl_all_about_you_rooms")
    .update({
      state,
      version: row.version + 1,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    })
    .eq("code", code)
    .eq("version", row.version)
    .select("version")
    .maybeSingle();
  if (saveError) throw new Error(saveError.message);
  if (!saved) throw new Error("The room changed while the Star was being assigned. Try again.");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const role = entryRole(request);

    if (body.intent === "create") {
      const claims = await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);
      if (!claims) return NextResponse.json({ error: "Sign in to host All About You." }, { status: 401 });
      if (!canHostDuringPrelaunch(claims)) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
      const created = await createAllAboutYouRoom(body.name, claims.sub);
      await applyEntryRole(created.code, created.playerId, role);
      const refreshed = await getAllAboutYouRoom(created.code, created.playerId, created.token);
      return NextResponse.json({ success: true, code: created.code, playerId: created.playerId, token: created.token, state: refreshed.state });
    }

    if (body.intent === "rejoin_host") {
      const claims = await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);
      if (!claims) return NextResponse.json({ error: "Sign in with the account that created this room." }, { status: 401 });
      if (!canHostDuringPrelaunch(claims)) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
      return NextResponse.json({ success: true, ...await recoverAllAboutYouHost(body.code, claims.sub) });
    }

    if (body.intent === "join") {
      if (role === "star") {
        const supabase = getSupabaseServerClient();
        const { data } = await supabase.from("ppl_all_about_you_rooms").select("state").eq("code", String(body.code ?? "").trim().toUpperCase()).maybeSingle();
        const currentStar = (data as { state?: StoredState } | null)?.state?.guestId;
        if (currentStar) throw new Error("Someone else is already marked as the Star for this room.");
      }
      const joined = await joinAllAboutYouRoom(body.code, body.name);
      await applyEntryRole(joined.code, joined.playerId, role);
      const refreshed = await getAllAboutYouRoom(joined.code, joined.playerId, joined.token);
      return NextResponse.json({ success: true, code: joined.code, playerId: joined.playerId, token: joined.token, state: refreshed.state });
    }

    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open game." }, { status: 400 });
  }
}
