import { NextResponse } from "next/server";
import { createTriviaLiveSession } from "../../../games/trivia/play/trivia-live-service";
import { RUNTIME_DIFFICULTY_FILTERS, type RuntimeDifficultyFilter } from "../../../games/trivia/play/trivia-runtime-types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    category?: string;
    difficultyFilter?: RuntimeDifficultyFilter;
  };

  if (body.category !== "bible") {
    return NextResponse.json({ error: "Bible is the current public launch category." }, { status: 400 });
  }

  if (!body.difficultyFilter || !RUNTIME_DIFFICULTY_FILTERS.includes(body.difficultyFilter)) {
    return NextResponse.json({ error: "A valid difficulty filter is required." }, { status: 400 });
  }

  try {
    return NextResponse.json(await createTriviaLiveSession(body.category, body.difficultyFilter), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create the trivia room.",
      },
      { status: 400 },
    );
  }
}
