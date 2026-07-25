import { NextResponse } from "next/server";
import {
  buildTriviaLiveHostSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveBearerToken,
} from "../../../../games/trivia/play/trivia-live-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  try {
    return NextResponse.json(
      await buildTriviaLiveHostSnapshot(sessionId, new URL(request.url).origin, readTriviaLiveBearerToken(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load the trivia room.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 404 },
    );
  }
}
