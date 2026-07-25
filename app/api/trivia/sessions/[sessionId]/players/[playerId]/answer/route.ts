import { NextResponse } from "next/server";
import {
  buildTriviaLivePlayerSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLivePlayerToken,
  submitTriviaLiveAnswer,
} from "../../../../../../../games/trivia/play/trivia-live-service";
import { setTriviaLivePlayerCookie } from "../../../../../../../games/trivia/play/trivia-live-cookie";
import type { RuntimeResponse } from "../../../../../../../games/trivia/play/trivia-runtime-types";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string; playerId: string }> },
) {
  const { sessionId, playerId } = await context.params;
  const body = (await request.json()) as {
    response?: RuntimeResponse;
  };
  const playerToken = readTriviaLivePlayerToken(request, playerId);

  if (!body.response) {
    return NextResponse.json({ error: "A response is required." }, { status: 400 });
  }

  try {
    await submitTriviaLiveAnswer(sessionId, playerId, body.response, playerToken);
    const response = NextResponse.json(await buildTriviaLivePlayerSnapshot(sessionId, playerId, playerToken), {
      headers: { "Cache-Control": "no-store" },
    });
    setTriviaLivePlayerCookie(response, playerId, playerToken!);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to submit that answer.",
      },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 400 },
    );
  }
}
