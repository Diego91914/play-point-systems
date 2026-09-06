import { NextRequest, NextResponse } from "next/server";
import { createAllAboutYouRoom, joinAllAboutYouRoom, recoverAllAboutYouHost } from "@/lib/play-point-core/all-about-you-server";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.intent === "create") {
      const claims = await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);
      if (!claims) return NextResponse.json({ error: "Sign in to host All About You." }, { status: 401 });
      return NextResponse.json({ success: true, ...await createAllAboutYouRoom(body.name, claims.sub) });
    }
    if (body.intent === "rejoin_host") {
      const claims = await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);
      if (!claims) return NextResponse.json({ error: "Sign in with the account that created this room." }, { status: 401 });
      return NextResponse.json({ success: true, ...await recoverAllAboutYouHost(body.code, claims.sub) });
    }
    if (body.intent === "join") return NextResponse.json({ success: true, ...await joinAllAboutYouRoom(body.code, body.name) });
    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open game." }, { status: 400 });
  }
}
