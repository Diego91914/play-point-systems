import { NextRequest, NextResponse } from "next/server";
import { createTable, joinTable } from "@/lib/play-point-core/holdem-server";
import {
  gamesSessionOwns,
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { reservePlayAmplifiedSession } from "@/lib/play-point-core/room-registry";

const HOLDEM_SKU = "game.phone_holdem";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body?.intent === "create") {
      const claims = await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);
      if (!claims) {
        return NextResponse.json({ error: "Sign in to host Phone Hold'em." }, { status: 401 });
      }
      if (!canHostDuringPrelaunch(claims, HOLDEM_SKU)) {
        return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
      }
      if (!gamesSessionOwns(claims, HOLDEM_SKU)) {
        return NextResponse.json({ error: "Phone Hold'em is not owned by this account." }, { status: 403 });
      }
      const session = await reservePlayAmplifiedSession({ gameSku: HOLDEM_SKU, joinHref: "/games/holdem?code={code}", participationModel: "OPEN_LOBBY" });
      const room = await createTable({ ...body, reservedCode: session.code });
      return NextResponse.json({ success: true, ...room });
    }

    if (body?.intent === "join") {
      return NextResponse.json({ success: true, ...(await joinTable(body.code, body.name)) });
    }

    return NextResponse.json({ error: "Unknown poker request." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open poker table.";
    const status = message === "Table not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
