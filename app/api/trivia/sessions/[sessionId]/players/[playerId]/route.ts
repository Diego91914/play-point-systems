import { NextResponse } from "next/server";
import { buildTriviaLivePlayerSnapshot } from "../../../../../../games/trivia/play/trivia-live-session";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string; playerId: string }> },
) {
  const { sessionId, playerId } = await context.params;

  try {
    return NextResponse.json(buildTriviaLivePlayerSnapshot(sessionId, playerId));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load that player session.",
      },
      { status: 404 },
    );
  }
}
