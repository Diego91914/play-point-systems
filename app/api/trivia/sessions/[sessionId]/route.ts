import { NextResponse } from "next/server";
import { buildTriviaLiveHostSnapshot } from "../../../../games/trivia/play/trivia-live-session";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  try {
    return NextResponse.json(buildTriviaLiveHostSnapshot(sessionId, new URL(request.url).origin));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load the trivia room.",
      },
      { status: 404 },
    );
  }
}
