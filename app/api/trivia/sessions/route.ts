import { NextResponse } from "next/server";
import { createTriviaLiveSession } from "../../../games/trivia/play/trivia-live-service";
import { MAX_TRIVIA_TEAM_COUNT, MIN_TRIVIA_TEAM_COUNT, RUNTIME_DIFFICULTY_FILTERS, TRIVIA_GAME_MODES, type RuntimeDifficultyFilter, type TriviaGameMode } from "../../../games/trivia/play/trivia-runtime-types";
import { TRIVIA_PACING_MODES, type TriviaPacingMode } from "../../../games/trivia/play/trivia-live-timing";
import { setTriviaLiveHostCookie } from "../../../games/trivia/play/trivia-live-cookie";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    category?: string;
    difficultyFilter?: RuntimeDifficultyFilter;
    pacingMode?: TriviaPacingMode;
    gameMode?: TriviaGameMode;
    teamCount?: number;
    topicIds?: string[];
  };

  if (
    !body.category
    || body.category.length > 64
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.category)
  ) {
    return NextResponse.json({ error: "A valid published category is required." }, { status: 400 });
  }

  if (body.topicIds !== undefined && !Array.isArray(body.topicIds)) {
    return NextResponse.json({ error: "Topic selections are invalid." }, { status: 400 });
  }

  const topicIds = [...new Set(body.topicIds ?? [])];
  if (
    topicIds.length > 20
    || topicIds.some((topic) => topic.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic))
  ) {
    return NextResponse.json({ error: "Topic selections are invalid." }, { status: 400 });
  }

  if (!body.difficultyFilter || !RUNTIME_DIFFICULTY_FILTERS.includes(body.difficultyFilter)) {
    return NextResponse.json({ error: "A valid difficulty filter is required." }, { status: 400 });
  }

  if (!body.pacingMode || !TRIVIA_PACING_MODES.includes(body.pacingMode)) {
    return NextResponse.json({ error: "A valid pacing mode is required." }, { status: 400 });
  }

  const gameMode = body.gameMode ?? "individual";
  if (!TRIVIA_GAME_MODES.includes(gameMode)) {
    return NextResponse.json({ error: "A valid game mode is required." }, { status: 400 });
  }

  const teamCount = body.teamCount ?? MIN_TRIVIA_TEAM_COUNT;
  if (!Number.isInteger(teamCount) || teamCount < MIN_TRIVIA_TEAM_COUNT || teamCount > MAX_TRIVIA_TEAM_COUNT) {
    return NextResponse.json({ error: `Team count must be between ${MIN_TRIVIA_TEAM_COUNT} and ${MAX_TRIVIA_TEAM_COUNT}.` }, { status: 400 });
  }

  try {
    const room = await createTriviaLiveSession(
      body.category,
      body.difficultyFilter,
      body.pacingMode,
      gameMode,
      teamCount,
      topicIds,
    );
    const response = NextResponse.json({ sessionId: room.sessionId, roomCode: room.roomCode }, {
      headers: { "Cache-Control": "no-store" },
    });
    setTriviaLiveHostCookie(response, room.sessionId, room.hostToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create the trivia room.",
      },
      { status: 400 },
    );
  }
}
