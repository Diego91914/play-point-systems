import { NextResponse } from "next/server";
import { buildTriviaLivePlayerSnapshot, joinTriviaLiveSession } from "../../../../games/trivia/play/trivia-live-session";

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
    const joined = joinTriviaLiveSession(body.roomCode, body.playerName);
    return NextResponse.json(
      {
        ...buildTriviaLivePlayerSnapshot(joined.sessionId, joined.playerId, joined.playerToken),
        playerToken: joined.playerToken,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to join the trivia room.",
      },
      { status: 400 },
    );
  }
}
