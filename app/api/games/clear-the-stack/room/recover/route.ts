import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

export async function POST(request: Request) {
  const claims = await verifyGamesSessionToken((await cookies()).get(GAMES_SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in to recover your room." }, { status: 401 });
  if (!canHostDuringPrelaunch(claims, "game.clear_the_stack")) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{6}$/.test(code)) return NextResponse.json({ error: "Enter a six-character room code." }, { status: 400 });
  // Owner comes only from the verified platform session, never request input.
  const { data: room, error } = await getSupabaseServerClient().rpc("ppl_recover_clear_stack_room", { p_owner: claims.sub, p_code: code });
  if (error) {
    const status = error.code === "42501" ? 404 : ["23505", "55000"].includes(error.code) ? 409 : 500;
    const message = status === 404 ? "Room not found or not owned by this account." : status === 409 ? "Room is closed or its code is already in use." : "Could not recover room. Try again.";
    return NextResponse.json({ error: message }, { status });
  }
  if (!room) return NextResponse.json({ error: "Could not recover room. Try again." }, { status: 500 });
  return NextResponse.json({ room }, { headers: { "Cache-Control": "no-store" } });
}
