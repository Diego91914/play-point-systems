import { NextResponse } from "next/server";
import {
  buildTriviaLivePlayerSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLivePlayerToken,
} from "../../../../../../games/trivia/play/trivia-live-service";
import { setTriviaLivePlayerCookie } from "../../../../../../games/trivia/play/trivia-live-cookie";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string; playerId: string }> },
) {
  const { sessionId, playerId } = await context.params;
  const playerToken = readTriviaLivePlayerToken(request, playerId);

  try {
    const response = NextResponse.json(
      await buildTriviaLivePlayerSnapshot(sessionId, playerId, playerToken),
      { headers: { "Cache-Control": "no-store" } },
    );
    setTriviaLivePlayerCookie(response, playerId, playerToken!);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load that player session.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 404 },
    );
  }
}
