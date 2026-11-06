import { NextResponse } from "next/server";
import {
  endTriviaLiveSession,
  isTriviaLiveAuthorizationError,
  readTriviaLiveHostToken,
} from "../../../../../games/trivia/play/trivia-live-service";
import { setTriviaLiveHostCookie } from "../../../../../games/trivia/play/trivia-live-cookie";
import { releasePlayAmplifiedSession } from "@/lib/play-point-core/room-registry";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const hostToken = readTriviaLiveHostToken(request, sessionId);

  try {
    const result = await endTriviaLiveSession(sessionId, hostToken);
    if (result.roomCode) await releasePlayAmplifiedSession(result.roomCode);
    const response = NextResponse.json({ success: true, status: "completed", ...result }, {
      headers: { "Cache-Control": "no-store" },
    });
    if (hostToken) setTriviaLiveHostCookie(response, sessionId, hostToken);
    return response;
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to end the trivia session.",
    }, {
      status: isTriviaLiveAuthorizationError(error) ? 401 : 409,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
