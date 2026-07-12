import type {
  EventStanding,
  PlayerCardAggregate,
  PlayPointContest,
  PlayPointEntry,
  PlayPointEvent,
  PlayPointRepository,
  PlayPointSeason,
  PlayPointTrigger,
  ResolutionRow,
  RewardRow,
  SeasonStanding,
  WeeklySeasonResult,
} from "./runtime-contracts";
import type {
  PplContestRow,
  PplEntryRow,
  PplEventRow,
  PplResolutionRow,
  PplTriggerRow,
  SqlQueryRunner,
} from "./relational-models";
import {
  mapPplContestRowToRuntime,
  mapPplEntryRowToRuntime,
  mapPplEventRowToRuntime,
  mapPplResolutionRowToRuntime,
  mapPplTriggerRowToRuntime,
} from "./relational-mappers";

interface RuntimeIdLookupRow {
  id: string;
}

interface ContestLookupRow extends RuntimeIdLookupRow {
  event_runtime_id: string;
}

interface StoredResolutionLookupRow extends PplResolutionRow {
  contest_runtime_id: string;
  trigger_runtime_id: string;
}

export class PostgresPlayPointRepository implements PlayPointRepository {
  constructor(private readonly runner: SqlQueryRunner) {}

  async getEvent(eventId: string): Promise<PlayPointEvent | null> {
    const rows = await this.runner.query<PplEventRow>(
      `
        select
          e.*,
          s.runtime_id as season_runtime_id
        from ppl_events e
        left join ppl_seasons s on s.id = e.season_id
        where e.runtime_id = $1
        limit 1
      `,
      [eventId],
    );

    return rows[0] ? mapPplEventRowToRuntime(rows[0]) : null;
  }

  async getSeason(seasonId: string): Promise<PlayPointSeason | null> {
    void seasonId;
    throw new Error("PostgresPlayPointRepository.getSeason is not wired yet.");
  }

  async getContest(contestId: string): Promise<PlayPointContest | null> {
    const rows = await this.runner.query<PplContestRow>(
      `
        select
          c.*,
          e.runtime_id as event_runtime_id
        from ppl_contests c
        join ppl_events e on e.id = c.event_id
        where c.runtime_id = $1
        limit 1
      `,
      [contestId],
    );

    return rows[0] ? mapPplContestRowToRuntime(rows[0]) : null;
  }

  async getTrigger(triggerId: string): Promise<PlayPointTrigger | null> {
    const rows = await this.runner.query<PplTriggerRow>(
      `
        select
          t.*,
          e.runtime_id as event_runtime_id
        from ppl_triggers t
        join ppl_events e on e.id = t.event_id
        where t.runtime_id = $1
        limit 1
      `,
      [triggerId],
    );

    return rows[0] ? mapPplTriggerRowToRuntime(rows[0]) : null;
  }

  async getTriggerByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PlayPointTrigger | null> {
    const rows = await this.runner.query<PplTriggerRow>(
      `
        select
          t.*,
          e.runtime_id as event_runtime_id
        from ppl_triggers t
        join ppl_events e on e.id = t.event_id
        where t.dedupe_key = $1
        limit 1
      `,
      [idempotencyKey],
    );

    return rows[0] ? mapPplTriggerRowToRuntime(rows[0]) : null;
  }

  async listEventContests(eventId: string): Promise<PlayPointContest[]> {
    const rows = await this.runner.query<PplContestRow>(
      `
        select
          c.*,
          e.runtime_id as event_runtime_id
        from ppl_contests c
        join ppl_events e on e.id = c.event_id
        where e.runtime_id = $1
        order by c.created_at asc
      `,
      [eventId],
    );

    return rows.map(mapPplContestRowToRuntime);
  }

  async listEventEntries(eventId: string): Promise<PlayPointEntry[]> {
    const event = await this.getEvent(eventId);

    if (!event) {
      return [];
    }

    const contests = await this.listEventContests(eventId);

    if (contests.length === 0) {
      return [];
    }

    const rows = await this.runner.query<PplEntryRow>(
      `
        select
          pe.*,
          c.runtime_id as contest_runtime_id,
          u.runtime_id as user_runtime_id
        from ppl_entries pe
        join ppl_contests c on c.id = pe.contest_id
        join ppl_events ev on ev.id = c.event_id
        join ppl_users u on u.id = pe.user_id
        where ev.runtime_id = $1
        order by pe.submitted_at asc
      `,
      [eventId],
    );

    return rows
      .map((row) => {
        const contest = contests.find(
          (candidate) =>
            candidate.id === (row.contest_runtime_id ?? row.contest_id),
        );
        return contest
          ? mapPplEntryRowToRuntime({
              row,
              contest,
              event,
            })
          : null;
      })
      .filter((entry): entry is PlayPointEntry => entry !== null);
  }

  async listContestEntries(contestId: string): Promise<PlayPointEntry[]> {
    const contest = await this.getContest(contestId);

    if (!contest) {
      return [];
    }

    const event = await this.getEvent(contest.eventId);

    if (!event) {
      return [];
    }

    const rows = await this.runner.query<PplEntryRow>(
      `
        select
          pe.*,
          c.runtime_id as contest_runtime_id,
          u.runtime_id as user_runtime_id
        from ppl_entries pe
        join ppl_contests c on c.id = pe.contest_id
        join ppl_users u on u.id = pe.user_id
        where c.runtime_id = $1
        order by pe.submitted_at asc
      `,
      [contestId],
    );

    return rows.map((row) =>
      mapPplEntryRowToRuntime({
        row,
        contest,
        event,
      }),
    );
  }

  async listResolutionsByTrigger(triggerId: string): Promise<ResolutionRow[]> {
    const rows = await this.runner.query<StoredResolutionLookupRow>(
      `
        select
          r.*,
          c.runtime_id as contest_runtime_id,
          t.runtime_id as trigger_runtime_id
        from ppl_resolutions r
        join ppl_contests c on c.id = r.contest_id
        join ppl_triggers t on t.id = r.trigger_id
        where t.runtime_id = $1
        order by r.applied_at asc
      `,
      [triggerId],
    );

    return rows.map((row) =>
      mapPplResolutionRowToRuntime({
        row,
        triggerId: row.trigger_runtime_id ?? triggerId,
        contestId: row.contest_runtime_id ?? row.contest_id,
      }),
    );
  }

  async saveEntry(entry: PlayPointEntry): Promise<void> {
    const contest = await this.resolveContestLink(entry.contestId);
    const userId = await this.resolveUserUuid(entry.userId);

    if (contest.event_runtime_id !== entry.eventId) {
      throw new Error(
        `Contest "${entry.contestId}" does not belong to event "${entry.eventId}".`,
      );
    }

    await this.runner.query(
      `
        insert into ppl_entries (
          runtime_id,
          contest_id,
          user_id,
          entry_status,
          selection,
          submitted_at,
          metadata
        )
        values ($1, $2, $3, $4, $5::jsonb, $6::timestamptz, $7::jsonb)
        on conflict (runtime_id) do update
        set
          contest_id = excluded.contest_id,
          user_id = excluded.user_id,
          entry_status = excluded.entry_status,
          selection = excluded.selection,
          submitted_at = excluded.submitted_at,
          metadata = excluded.metadata
      `,
      [
        entry.id,
        contest.id,
        userId,
        this.mapEntryStatus(entry.status),
        JSON.stringify(entry.selection),
        entry.submittedAt,
        JSON.stringify({
          eventId: entry.eventId,
          seasonId: entry.seasonId ?? null,
          clubId: entry.clubId ?? null,
          lockedAt: entry.lockedAt ?? null,
          resolutionStatus: entry.status,
        }),
      ],
    );
  }

  async saveTrigger(trigger: PlayPointTrigger): Promise<void> {
    const eventId = await this.resolveEventUuid(trigger.eventId);
    const submittedByUserId = trigger.submittedByUserId
      ? await this.resolveUserUuid(trigger.submittedByUserId)
      : null;

    await this.runner.query(
      `
        insert into ppl_triggers (
          runtime_id,
          event_id,
          trigger_type,
          source,
          source_mode,
          confidence,
          provider_timestamp,
          ingested_at,
          payload,
          raw_payload,
          dedupe_key,
          created_by_user_id
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          'high',
          $6::timestamptz,
          $7::timestamptz,
          $8::jsonb,
          $9::jsonb,
          $10,
          $11
        )
        on conflict (runtime_id) do update
        set
          event_id = excluded.event_id,
          trigger_type = excluded.trigger_type,
          source = excluded.source,
          source_mode = excluded.source_mode,
          confidence = excluded.confidence,
          provider_timestamp = excluded.provider_timestamp,
          ingested_at = excluded.ingested_at,
          payload = excluded.payload,
          raw_payload = excluded.raw_payload,
          dedupe_key = excluded.dedupe_key,
          created_by_user_id = excluded.created_by_user_id
      `,
      [
        trigger.id,
        eventId,
        trigger.triggerType,
        trigger.sourceMode === "manual" ? "host" : "runtime",
        this.mapSourceMode(trigger.sourceMode),
        trigger.occurredAt,
        new Date().toISOString(),
        JSON.stringify(trigger.payload),
        JSON.stringify({
          runtimeContext: {
            contestId: trigger.contestId ?? null,
            lifecycleStatus: trigger.status,
            correctionOfTriggerId: trigger.correctionOfTriggerId ?? null,
            submittedByUserId: trigger.submittedByUserId ?? null,
          },
        }),
        trigger.idempotencyKey,
        submittedByUserId,
      ],
    );
  }

  async saveResolutions(rows: ResolutionRow[]): Promise<void> {
    for (const row of rows) {
      const contest = await this.resolveContestLink(row.contestId);
      const triggerId = await this.resolveTriggerUuid(row.triggerId);

      await this.runner.query(
        `
          insert into ppl_resolutions (
            runtime_id,
            contest_id,
            trigger_id,
            resolution_status,
            outcome,
            applied_at,
            applied_by_user_id,
            notes
          )
          values ($1, $2, $3, $4, $5::jsonb, $6::timestamptz, null, null)
          on conflict (runtime_id) do update
          set
            contest_id = excluded.contest_id,
            trigger_id = excluded.trigger_id,
            resolution_status = excluded.resolution_status,
            outcome = excluded.outcome,
            applied_at = excluded.applied_at
        `,
        [
          row.id,
          contest.id,
          triggerId,
          row.supersededByResolutionId ? "superseded" : "applied",
          JSON.stringify({
            entryId: row.entryId,
            userId: row.userId,
            ruleKey: row.ruleKey,
            scoreDelta: row.scoreDelta,
            playPointsDelta: row.playPointsDelta,
            placement: row.placement ?? null,
            accuracyDelta: row.accuracyDelta ?? null,
            isVictory: row.isVictory,
            supersededByResolutionId: row.supersededByResolutionId ?? null,
            metadata: row.metadata ?? {},
          }),
          row.resolvedAt,
        ],
      );
    }
  }

  async supersedeResolutionsByTrigger(triggerId: string): Promise<void> {
    const triggerUuid = await this.resolveTriggerUuid(triggerId);

    await this.runner.query(
      `
        update ppl_resolutions
        set resolution_status = 'superseded'
        where trigger_id = $1
          and resolution_status <> 'superseded'
      `,
      [triggerUuid],
    );
  }

  async saveRewards(rows: RewardRow[]): Promise<void> {
    void rows;
    throw new Error("PostgresPlayPointRepository.saveRewards is not wired yet.");
  }

  async rebuildEventStandings(eventId: string): Promise<EventStanding[]> {
    void eventId;
    throw new Error(
      "PostgresPlayPointRepository.rebuildEventStandings is not wired yet.",
    );
  }

  async rebuildSeasonStandings(seasonId: string): Promise<SeasonStanding[]> {
    void seasonId;
    throw new Error(
      "PostgresPlayPointRepository.rebuildSeasonStandings is not wired yet.",
    );
  }

  async finalizeWeeklyMatchups(
    seasonId: string,
    weekKey: string,
  ): Promise<WeeklySeasonResult[]> {
    void seasonId;
    void weekKey;
    throw new Error(
      "PostgresPlayPointRepository.finalizeWeeklyMatchups is not wired yet.",
    );
  }

  async rebuildPlayerCardAggregates(
    userIds: string[],
  ): Promise<PlayerCardAggregate[]> {
    void userIds;
    throw new Error(
      "PostgresPlayPointRepository.rebuildPlayerCardAggregates is not wired yet.",
    );
  }

  private async resolveEventUuid(eventRuntimeId: string): Promise<string> {
    const rows = await this.runner.query<RuntimeIdLookupRow>(
      `select id from ppl_events where runtime_id = $1 limit 1`,
      [eventRuntimeId],
    );

    if (!rows[0]) {
      throw new Error(`Event "${eventRuntimeId}" was not found.`);
    }

    return rows[0].id;
  }

  private async resolveTriggerUuid(triggerRuntimeId: string): Promise<string> {
    const rows = await this.runner.query<RuntimeIdLookupRow>(
      `select id from ppl_triggers where runtime_id = $1 limit 1`,
      [triggerRuntimeId],
    );

    if (!rows[0]) {
      throw new Error(`Trigger "${triggerRuntimeId}" was not found.`);
    }

    return rows[0].id;
  }

  private async resolveUserUuid(userRuntimeId: string): Promise<string> {
    const rows = await this.runner.query<RuntimeIdLookupRow>(
      `select id from ppl_users where runtime_id = $1 limit 1`,
      [userRuntimeId],
    );

    if (!rows[0]) {
      throw new Error(`User "${userRuntimeId}" was not found.`);
    }

    return rows[0].id;
  }

  private async resolveContestLink(
    contestRuntimeId: string,
  ): Promise<ContestLookupRow> {
    const rows = await this.runner.query<ContestLookupRow>(
      `
        select
          c.id,
          e.runtime_id as event_runtime_id
        from ppl_contests c
        join ppl_events e on e.id = c.event_id
        where c.runtime_id = $1
        limit 1
      `,
      [contestRuntimeId],
    );

    if (!rows[0]) {
      throw new Error(`Contest "${contestRuntimeId}" was not found.`);
    }

    return rows[0];
  }

  private mapEntryStatus(
    status: PlayPointEntry["status"],
  ): "active" | "replaced" | "void" {
    return status === "superseded" ? "replaced" : "active";
  }

  private mapSourceMode(
    sourceMode: PlayPointTrigger["sourceMode"],
  ): "manual" | "confirm" | "auto" {
    if (sourceMode === "confirmed") {
      return "confirm";
    }

    if (sourceMode === "automatic") {
      return "auto";
    }

    return "manual";
  }
}
