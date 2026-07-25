import { NextResponse } from "next/server";
import {
  buildTriviaLiveHostSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveBearerToken,
  resolveTriviaLiveQuestion,
} from "../../../../../games/trivia/play/trivia-live-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const hostToken = readTriviaLiveBearerToken(request);

  try {
    await resolveTriviaLiveQuestion(sessionId, hostToken);
    return NextResponse.json(await buildTriviaLiveHostSnapshot(sessionId, new URL(request.url).origin, hostToken), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to resolve the trivia question.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 400 },
    );
  }
}
