import type {
  PlayPointContest,
  PlayPointEntry,
  PlayPointEvent,
  PlayPointTrigger,
  ResolutionRow,
} from "./runtime-contracts";
import type {
  PplContestRow,
  PplEntryRow,
  PplEventRow,
  PplResolutionRow,
  PplTriggerRow,
} from "./relational-models";

export function mapPplEventRowToRuntime(row: PplEventRow): PlayPointEvent {
  const status: PlayPointEvent["status"] =
    row.event_status === "final"
      ? "settled"
      : row.event_status === "cancelled"
        ? "closed"
        : row.event_status === "paused"
          ? "live"
          : row.event_status;

  return {
    id: row.runtime_id,
    seasonId: row.season_runtime_id ?? row.season_id,
    sportKey: row.sport as PlayPointEvent["sportKey"],
    title: row.name,
    status,
    scheduledAt: row.start_time,
    externalRef: row.external_event_key,
    metadata: {
      league: row.league,
      homeParticipant: row.home_participant,
      awayParticipant: row.away_participant,
      sourceMode: row.source_mode,
      ...row.metadata,
    },
  };
}

export function mapPplContestRowToRuntime(row: PplContestRow): PlayPointContest {
  return {
    id: row.runtime_id,
    eventId: row.event_runtime_id ?? row.event_id,
    formatKey: row.contest_type as PlayPointContest["formatKey"],
    title: row.name,
    scoringProfileKey: row.slug,
    status:
      row.contest_status === "settled"
        ? "settled"
        : row.contest_status === "void"
          ? "corrected"
          : row.contest_status,
    config: {
      triggerType: row.trigger_type,
      resolutionType: row.resolution_type,
      sourceMode: row.source_mode,
      scoringConfig: row.scoring_config,
      settlementConfig: row.settlement_config,
      lockedAt: row.locked_at,
      settledAt: row.settled_at,
    },
  };
}

export function mapPplEntryRowToRuntime(args: {
  row: PplEntryRow;
  contest: PlayPointContest;
  event: PlayPointEvent;
}): PlayPointEntry {
  const metadata = readRecord(args.row.metadata);

  return {
    id: args.row.runtime_id,
    contestId: args.row.contest_runtime_id ?? args.contest.id,
    eventId: args.contest.eventId,
    seasonId: args.event.seasonId,
    clubId:
      typeof metadata.clubId === "string" ? metadata.clubId : args.event.clubId ?? null,
    userId: args.row.user_runtime_id ?? args.row.user_id,
    submittedAt: args.row.submitted_at,
    lockedAt: typeof metadata.lockedAt === "string" ? metadata.lockedAt : null,
    selection: args.row.selection,
    status:
      args.row.entry_status === "active"
        ? "pending"
        : args.row.entry_status === "replaced"
          ? "superseded"
          : "superseded",
  };
}

export function mapPplTriggerRowToRuntime(row: PplTriggerRow): PlayPointTrigger {
  const runtimeContext = readRecord(
    readRecord(row.raw_payload).runtimeContext,
  );

  return {
    id: row.runtime_id,
    eventId: row.event_runtime_id ?? row.event_id,
    contestId:
      typeof runtimeContext.contestId === "string" ? runtimeContext.contestId : null,
    sourceMode:
      row.source_mode === "confirm"
        ? "confirmed"
        : row.source_mode === "auto"
          ? "automatic"
          : "manual",
    status: readTriggerLifecycleStatus(runtimeContext.lifecycleStatus),
    triggerType: row.trigger_type,
    occurredAt: row.provider_timestamp ?? row.ingested_at,
    submittedByUserId: row.created_by_user_id,
    idempotencyKey: row.dedupe_key ?? row.id,
    payload: row.payload,
    correctionOfTriggerId:
      typeof runtimeContext.correctionOfTriggerId === "string"
        ? runtimeContext.correctionOfTriggerId
        : null,
  };
}

export function mapPplResolutionRowToRuntime(args: {
  row: PplResolutionRow;
  triggerId: string;
  contestId: string;
  entryId?: string;
  userId?: string;
}): ResolutionRow {
  const outcome = readRecord(args.row.outcome);

  return {
    id: args.row.runtime_id,
    triggerId: triggerIdOrFallback(args.row, args.triggerId),
    contestId: args.contestId,
    entryId:
      args.entryId ??
      (typeof outcome.entryId === "string" ? outcome.entryId : args.row.runtime_id),
    userId:
      args.userId ??
      (typeof outcome.userId === "string" ? outcome.userId : "unknown-user"),
    ruleKey:
      typeof outcome.ruleKey === "string"
        ? outcome.ruleKey
        : "relational.imported",
    scoreDelta: numberOrZero(outcome.scoreDelta),
    playPointsDelta: numberOrZero(outcome.playPointsDelta),
    placement: nullableNumber(outcome.placement),
    accuracyDelta: nullableNumber(outcome.accuracyDelta),
    isVictory: Boolean(outcome.isVictory),
    supersededByResolutionId:
      args.row.resolution_status === "superseded"
        ? `${args.row.runtime_id}:superseded`
        : typeof outcome.supersededByResolutionId === "string"
          ? outcome.supersededByResolutionId
          : null,
    metadata:
      typeof outcome.metadata === "object" && outcome.metadata !== null
        ? (outcome.metadata as Record<string, unknown>)
        : outcome,
    resolvedAt: args.row.applied_at,
  };
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readTriggerLifecycleStatus(
  value: unknown,
): PlayPointTrigger["status"] {
  return value === "pending" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "processed" ||
    value === "corrected"
    ? value
    : "accepted";
}

function triggerIdOrFallback(row: PplResolutionRow, fallback: string) {
  return row.trigger_id || fallback;
}
