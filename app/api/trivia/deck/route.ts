import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    { error: "Public answer-bearing trivia decks are no longer available." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
