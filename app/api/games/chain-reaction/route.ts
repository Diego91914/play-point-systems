import { NextRequest, NextResponse } from "next/server";
import { createChainRoom, joinChainRoom } from "@/lib/play-point-core/chain-reaction-server";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.intent === "create") {
      const claims = await verifyGamesSessionToken(
        request.cookies.get(GAMES_SESSION_COOKIE)?.value
      );
      if (!claims) {
        return NextResponse.json(
          { error: "Sign in to host a Chain Reaction game." },
          { status: 401 }
        );
      }
      return NextResponse.json({
        success: true,
        ...(await createChainRoom(body.name)),
      });
    }

    if (body.intent === "join") {
      return NextResponse.json({
        success: true,
        ...(await joinChainRoom(body.code, body.name)),
      });
    }

    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open Chain Reaction.",
      },
      { status: 400 }
    );
  }
}
