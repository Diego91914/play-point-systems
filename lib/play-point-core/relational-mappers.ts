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
    id: row.id,
    seasonId: row.season_id,
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
    id: row.id,
    eventId: row.event_id,
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
  return {
    id: args.row.id,
    contestId: args.row.contest_id,
    eventId: args.contest.eventId,
    seasonId: args.event.seasonId,
    userId: args.row.user_id,
    submittedAt: args.row.submitted_at,
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
  return {
    id: row.id,
    eventId: row.event_id,
    sourceMode:
      row.source_mode === "confirm"
        ? "confirmed"
        : row.source_mode === "auto"
          ? "automatic"
          : "manual",
    status: "accepted",
    triggerType: row.trigger_type,
    occurredAt: row.provider_timestamp ?? row.ingested_at,
    submittedByUserId: row.created_by_user_id,
    idempotencyKey: row.dedupe_key ?? row.id,
    payload: row.payload,
  };
}

export function mapPplResolutionRowToRuntime(args: {
  row: PplResolutionRow;
  triggerId: string;
  contestId: string;
  entryId: string;
  userId: string;
}): ResolutionRow {
  return {
    id: args.row.id,
    triggerId: triggerIdOrFallback(args.row, args.triggerId),
    contestId: args.contestId,
    entryId: args.entryId,
    userId: args.userId,
    ruleKey:
      typeof args.row.outcome.ruleKey === "string"
        ? args.row.outcome.ruleKey
        : "relational.imported",
    scoreDelta: numberOrZero(args.row.outcome.scoreDelta),
    playPointsDelta: numberOrZero(args.row.outcome.playPointsDelta),
    placement: nullableNumber(args.row.outcome.placement),
    accuracyDelta: nullableNumber(args.row.outcome.accuracyDelta),
    isVictory: Boolean(args.row.outcome.isVictory),
    supersededByResolutionId:
      args.row.resolution_status === "superseded" ? `${args.row.id}:superseded` : null,
    metadata: args.row.outcome,
    resolvedAt: args.row.applied_at,
  };
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function triggerIdOrFallback(row: PplResolutionRow, fallback: string) {
  return row.trigger_id || fallback;
}
