import { NextResponse } from "next/server";
import { buildRuntimeDeck } from "../../../games/trivia/play/trivia-runtime-builder";
import { RUNTIME_DIFFICULTY_FILTERS, type RuntimeDifficultyFilter } from "../../../games/trivia/play/trivia-runtime-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty") as RuntimeDifficultyFilter | null;

  if (!category) {
    return NextResponse.json({ error: "A trivia category is required." }, { status: 400 });
  }

  if (!difficulty || !RUNTIME_DIFFICULTY_FILTERS.includes(difficulty)) {
    return NextResponse.json({ error: "A valid difficulty filter is required." }, { status: 400 });
  }

  try {
    return NextResponse.json(buildRuntimeDeck(category, difficulty));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to build the selected trivia deck.",
      },
      { status: 400 },
    );
  }
}
