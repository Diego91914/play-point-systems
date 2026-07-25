import { NextResponse } from "next/server";
import {
  buildTriviaLiveHostSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveBearerToken,
  startTriviaLiveSession,
} from "../../../../../games/trivia/play/trivia-live-session";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const hostToken = readTriviaLiveBearerToken(request);

  try {
    startTriviaLiveSession(sessionId, hostToken);
    return NextResponse.json(buildTriviaLiveHostSnapshot(sessionId, new URL(request.url).origin, hostToken), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to start the trivia room.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 400 },
    );
  }
}
