import { NextResponse } from "next/server";
import {
  buildTriviaLiveHostSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveHostToken,
} from "../../../../games/trivia/play/trivia-live-service";
import { setTriviaLiveHostCookie } from "../../../../games/trivia/play/trivia-live-cookie";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const hostToken = readTriviaLiveHostToken(request, sessionId);

  try {
    const response = NextResponse.json(
      await buildTriviaLiveHostSnapshot(sessionId, new URL(request.url).origin, hostToken),
      { headers: { "Cache-Control": "no-store" } },
    );
    setTriviaLiveHostCookie(response, sessionId, hostToken!);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load the trivia room.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 404 },
    );
  }
}
