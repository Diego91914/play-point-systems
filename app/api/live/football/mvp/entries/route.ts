import { NextResponse } from "next/server";
import { footballMvpRuntime } from "@/lib/play-point-core";

interface PlayerEntrySubmission {
  contestId: string;
  selection: Record<string, unknown>;
}

interface EntryRequestBody {
  eventId?: string;
  userId?: string;
  selections?: PlayerEntrySubmission[];
}

export async function POST(request: Request) {
  let body: EntryRequestBody;

  try {
    body = (await request.json()) as EntryRequestBody;
  } catch {
    return NextResponse.json(
      {
        saved: false,
        error: "A valid JSON request body is required.",
      },
      { status: 400 },
    );
  }

  if (!body.eventId || !body.userId) {
    return NextResponse.json(
      {
        saved: false,
        error: "eventId and userId are required.",
      },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.selections) || body.selections.length === 0) {
    return NextResponse.json(
      {
        saved: false,
        error: "At least one contest selection is required.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await footballMvpRuntime.upsertPlayerEntries({
      eventId: body.eventId,
      userId: body.userId,
      selections: body.selections,
    });

    return NextResponse.json({
      saved: true,
      savedEntries: result.savedEntries,
      seededEntries: result.entries,
      eventStandings: result.eventStandings,
      seasonStandings: result.seasonStandings,
      notifications: result.notifications,
    });
  } catch (error) {
    return NextResponse.json(
      {
        saved: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save player entries.",
      },
      { status: 400 },
    );
  }
}
