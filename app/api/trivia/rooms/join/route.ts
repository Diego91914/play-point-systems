import { NextResponse } from "next/server";
import { buildTriviaLivePlayerSnapshot, joinTriviaLiveSession } from "../../../../games/trivia/play/trivia-live-service";
import { setTriviaLivePlayerCookie } from "../../../../games/trivia/play/trivia-live-cookie";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    roomCode?: string;
    playerName?: string;
  };

  if (!body.roomCode) {
    return NextResponse.json({ error: "A room code is required." }, { status: 400 });
  }

  if (!body.playerName) {
    return NextResponse.json({ error: "A player name is required." }, { status: 400 });
  }

  try {
    const joined = await joinTriviaLiveSession(body.roomCode, body.playerName);
    const response = NextResponse.json(
      await buildTriviaLivePlayerSnapshot(joined.sessionId, joined.playerId, joined.playerToken),
      { headers: { "Cache-Control": "no-store" } },
    );
    setTriviaLivePlayerCookie(response, joined.playerId, joined.playerToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to join the trivia room.",
      },
      { status: 400 },
    );
  }
}
