import { NextResponse } from "next/server";
import {
  buildTriviaLiveHostSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveHostToken,
  resolveTriviaLiveQuestion,
} from "../../../../../games/trivia/play/trivia-live-service";
import { setTriviaLiveHostCookie } from "../../../../../games/trivia/play/trivia-live-cookie";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const hostToken = readTriviaLiveHostToken(request, sessionId);

  try {
    await resolveTriviaLiveQuestion(sessionId, hostToken);
    const response = NextResponse.json(await buildTriviaLiveHostSnapshot(sessionId, new URL(request.url).origin, hostToken), {
      headers: { "Cache-Control": "no-store" },
    });
    setTriviaLiveHostCookie(response, sessionId, hostToken!);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to resolve the trivia question.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 400 },
    );
  }
}
