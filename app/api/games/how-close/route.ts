import { NextRequest, NextResponse } from "next/server";
import { createHowCloseRoom, joinHowCloseRoom } from "@/lib/play-point-core/how-close-server";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { releasePlayAmplifiedSession, reservePlayAmplifiedSession } from "@/lib/play-point-core/room-registry";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.intent === "create") {
      const claims = await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);
      if (!claims) return NextResponse.json({ error: "Sign in to host How Close Are We?." }, { status: 401 });
      if (!canHostDuringPrelaunch(claims, "game.how_close")) {
        return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
      }

      const session = await reservePlayAmplifiedSession({
        gameSku: "game.how_close",
        joinHref: "/games/how-close?code={code}",
        participationModel: "OPEN_LOBBY",
      });
      try {
        const room = await createHowCloseRoom(body.name, session.code);
        return NextResponse.json({ success: true, ...room });
      } catch (error) {
        await releasePlayAmplifiedSession(session.code).catch(() => undefined);
        throw error;
      }
    }

    if (body.intent === "join") {
      return NextResponse.json({ success: true, ...(await joinHowCloseRoom(body.code, body.name)) });
    }
    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open game." }, { status: 400 });
  }
}
