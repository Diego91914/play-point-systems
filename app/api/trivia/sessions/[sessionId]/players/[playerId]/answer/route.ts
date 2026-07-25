import { NextResponse } from "next/server";
import {
  buildTriviaLivePlayerSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveBearerToken,
  submitTriviaLiveAnswer,
} from "../../../../../../../games/trivia/play/trivia-live-session";
import type { RuntimeResponse } from "../../../../../../../games/trivia/play/trivia-runtime-types";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string; playerId: string }> },
) {
  const { sessionId, playerId } = await context.params;
  const body = (await request.json()) as {
    response?: RuntimeResponse;
  };
  const playerToken = readTriviaLiveBearerToken(request);

  if (!body.response) {
    return NextResponse.json({ error: "A response is required." }, { status: 400 });
  }

  try {
    submitTriviaLiveAnswer(sessionId, playerId, body.response, playerToken);
    return NextResponse.json(buildTriviaLivePlayerSnapshot(sessionId, playerId, playerToken), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to submit that answer.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 400 },
    );
  }
}
