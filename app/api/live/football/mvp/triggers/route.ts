import { NextResponse } from "next/server";
import { footballMvpRuntime } from "@/lib/play-point-core";
import {
  buildFootballVenueProgramState,
  type PlayPointTrigger,
  type TriggerSourceMode,
} from "@/lib/play-point-core";

interface TriggerRequestBody {
  eventId?: string;
  contestId?: string | null;
  triggerType?: string;
  occurredAt?: string;
  sourceMode?: TriggerSourceMode;
  submittedByUserId?: string | null;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
  settle?: boolean;
  correctionOfTriggerId?: string;
  correctionReason?: string;
  correctedByUserId?: string;
}

function createTriggerFromBody(body: TriggerRequestBody): PlayPointTrigger {
  return {
    id: `trigger-${crypto.randomUUID()}`,
    eventId: body.eventId ?? "",
    contestId: body.contestId ?? null,
    sourceMode: body.sourceMode ?? "manual",
    status: "pending",
    triggerType: body.triggerType ?? "",
    occurredAt: body.occurredAt ?? new Date().toISOString(),
    submittedByUserId: body.submittedByUserId ?? null,
    idempotencyKey:
      body.idempotencyKey ?? `manual:${body.eventId ?? "unknown"}:${Date.now()}`,
    payload: body.payload ?? {},
  };
}

export async function GET() {
  const {
    seed,
    repository,
    notifications,
    storageMode,
    requestedStorageMode,
    persistencePath,
    inspectDebugState,
  } = footballMvpRuntime;
  const eventId = seed.events?.[0]?.id;
  const seasonId = seed.seasons?.[0]?.id;
  const debugState = await inspectDebugState();
  const event = eventId ? await repository.getEvent(eventId) : null;

  return NextResponse.json({
    seededEvents: seed.events ?? [],
    seededContests: seed.contests ?? [],
    seededEntries: eventId ? await repository.listEventEntries(eventId) : [],
    storageMode,
    requestedStorageMode,
    persistencePath,
    storageNotice: debugState.note ?? null,
    triggers: debugState.triggers,
    resolutions: debugState.resolutions,
    rewards: debugState.rewards,
    eventStandings: eventId
      ? await repository.rebuildEventStandings(eventId)
      : [],
    seasonStandings: seasonId
      ? await repository.rebuildSeasonStandings(seasonId)
      : [],
    venueProgram: buildFootballVenueProgramState({
      event,
      triggers: debugState.triggers,
    }),
    notifications: notifications.listEvents(),
  });
}

export async function POST(request: Request) {
  let body: TriggerRequestBody;

  try {
    body = (await request.json()) as TriggerRequestBody;
  } catch {
    return NextResponse.json(
      {
        accepted: false,
        error: "A valid JSON request body is required.",
      },
      { status: 400 },
    );
  }

  const trigger = createTriggerFromBody(body);

  if (body.correctionOfTriggerId) {
    try {
      const result = await footballMvpRuntime.correctScoredTrigger({
        originalTriggerId: body.correctionOfTriggerId,
        replacementTrigger: trigger,
        reason: body.correctionReason ?? "Manual correction",
        correctedByUserId:
          body.correctedByUserId ?? body.submittedByUserId ?? "host",
      });

      return NextResponse.json({
        accepted: true,
        corrected: true,
        correction: result.correction,
        trigger: result.replacementTrigger,
        batches: result.batches,
        eventStandings: result.eventStandings,
        seasonStandings: result.seasonStandings,
        notifications: result.notifications,
      });
    } catch (error) {
      return NextResponse.json(
        {
          accepted: false,
          corrected: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to correct the trigger.",
        },
        { status: 400 },
      );
    }
  }

  if (body.settle === false) {
    const result = await footballMvpRuntime.ingest.acceptTrigger({ trigger });

    if (!result.accepted) {
      return NextResponse.json(
        {
          accepted: false,
          errors: result.errors,
          trigger: result.trigger,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      accepted: true,
      settled: false,
      trigger: result.trigger,
    });
  }

  const result = await footballMvpRuntime.scoreTrigger({ trigger });

  if (!result.accepted) {
    return NextResponse.json(
      {
        accepted: false,
        errors: result.errors,
        trigger: result.trigger,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    accepted: true,
    settled: true,
    trigger: result.trigger,
    batches: result.batches,
    eventStandings: result.eventStandings,
    seasonStandings: result.seasonStandings,
    notifications: result.notifications,
  });
}
