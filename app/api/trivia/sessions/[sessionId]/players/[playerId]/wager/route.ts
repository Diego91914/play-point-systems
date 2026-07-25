import { NextResponse } from "next/server";
import {
  buildTriviaLivePlayerSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLivePlayerToken,
  submitTriviaLiveWager,
} from "../../../../../../../games/trivia/play/trivia-live-service";
import { setTriviaLivePlayerCookie } from "../../../../../../../games/trivia/play/trivia-live-cookie";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string; playerId: string }> },
) {
  const { sessionId, playerId } = await context.params;
  const body = (await request.json()) as { wager?: number };
  const playerToken = readTriviaLivePlayerToken(request, playerId);

  if (!Number.isSafeInteger(body.wager)) {
    return NextResponse.json({ error: "A whole-number wager is required." }, { status: 400 });
  }

  try {
    await submitTriviaLiveWager(sessionId, playerId, body.wager!, playerToken);
    const response = NextResponse.json(await buildTriviaLivePlayerSnapshot(sessionId, playerId, playerToken), {
      headers: { "Cache-Control": "no-store" },
    });
    setTriviaLivePlayerCookie(response, playerId, playerToken!);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit that wager." },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 400 },
    );
  }
}
