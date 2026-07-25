import { NextResponse } from "next/server";
import {
  buildTriviaLivePlayerSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveBearerToken,
} from "../../../../../../games/trivia/play/trivia-live-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string; playerId: string }> },
) {
  const { sessionId, playerId } = await context.params;

  try {
    return NextResponse.json(
      await buildTriviaLivePlayerSnapshot(sessionId, playerId, readTriviaLiveBearerToken(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load that player session.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 404 },
    );
  }
}
