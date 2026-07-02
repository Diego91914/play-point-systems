import { NextResponse } from "next/server";
import { buildTriviaLiveHostSnapshot, resolveTriviaLiveQuestion } from "../../../../../games/trivia/play/trivia-live-session";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  try {
    resolveTriviaLiveQuestion(sessionId);
    return NextResponse.json(buildTriviaLiveHostSnapshot(sessionId, new URL(request.url).origin));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to resolve the trivia question.",
      },
      { status: 400 },
    );
  }
}
