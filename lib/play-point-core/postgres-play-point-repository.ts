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
  PplRewardRow,
  PplResolutionRow,
  PplSeasonRow,
  PplTriggerRow,
  SqlQueryRunner,
} from "./relational-models";
import {
  mapPplContestRowToRuntime,
  mapPplEntryRowToRuntime,
  mapPplEventRowToRuntime,
  mapPplRewardRowToRuntime,
  mapPplResolutionRowToRuntime,
  mapPplSeasonRowToRuntime,
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

interface StoredTriggerDebugRow extends PplTriggerRow {
  event_runtime_id: string;
}

interface ResolutionOutcomeAggregateRow {
  outcome: Record<string, unknown>;
  user_runtime_id: string | null;
}

interface EntryMetadataLookupRow {
  user_runtime_id: string;
  metadata: Record<string, unknown>;
}

interface RewardLookupRow extends PplRewardRow {
  user_runtime_id: string;
  contest_runtime_id: string | null;
}

interface ResolutionLinkRow extends RuntimeIdLookupRow {
  contest_id: string;
  contest_runtime_id: string;
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
    const rows = await this.runner.query<PplSeasonRow>(
      `
        select
          s.*,
          c.runtime_id as club_runtime_id
        from ppl_seasons s
        join ppl_clubs c on c.id = s.club_id
        where s.runtime_id = $1
        limit 1
      `,
      [seasonId],
    );

    return rows[0] ? mapPplSeasonRowToRuntime(rows[0]) : null;
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
    for (const row of rows) {
      const userId = await this.resolveUserUuid(row.userId);
      const rewardMetadata = readRecord(row.metadata);
      let resolutionId: string | null = null;
      let contestId: string | null = null;

      if (row.sourceType === "contest_resolution") {
        const resolutionLink = await this.resolveResolutionLink(row.sourceId);
        resolutionId = resolutionLink.id;
        contestId = resolutionLink.contest_id;
      } else if (typeof rewardMetadata.resolutionId === "string") {
        const resolutionLink = await this.resolveResolutionLink(
          rewardMetadata.resolutionId,
        );
        resolutionId = resolutionLink.id;
        contestId = resolutionLink.contest_id;
      }

      if (!contestId && typeof rewardMetadata.contestId === "string") {
        contestId = await this.resolveContestUuid(rewardMetadata.contestId);
      }

      await this.runner.query(
        `
          insert into ppl_rewards (
            runtime_id,
            resolution_id,
            contest_id,
            user_id,
            source_type,
            source_runtime_id,
            reward_type,
            play_points_delta,
            leaderboard_points_delta,
            victory_credit,
            achievement_key,
            payload,
            created_at
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12::jsonb,
            $13::timestamptz
          )
          on conflict (runtime_id) do update
          set
            resolution_id = excluded.resolution_id,
            contest_id = excluded.contest_id,
            user_id = excluded.user_id,
            source_type = excluded.source_type,
            source_runtime_id = excluded.source_runtime_id,
            reward_type = excluded.reward_type,
            play_points_delta = excluded.play_points_delta,
            leaderboard_points_delta = excluded.leaderboard_points_delta,
            victory_credit = excluded.victory_credit,
            achievement_key = excluded.achievement_key,
            payload = excluded.payload,
            created_at = excluded.created_at
        `,
        [
          row.id,
          resolutionId,
          contestId,
          userId,
          row.sourceType,
          row.sourceId,
          row.rewardType,
          row.rewardType === "play_points" ? Math.trunc(row.amount ?? 0) : 0,
          integerFromMetadata(rewardMetadata.leaderboardPointsDelta),
          Boolean(rewardMetadata.victoryCredit),
          typeof rewardMetadata.achievementKey === "string"
            ? rewardMetadata.achievementKey
            : row.sourceType === "achievement"
              ? row.sourceId
              : null,
          JSON.stringify({
            rewardType: row.rewardType,
            amount: row.amount ?? null,
            resolutionId:
              typeof rewardMetadata.resolutionId === "string"
                ? rewardMetadata.resolutionId
                : null,
            metadata: rewardMetadata,
          }),
          row.awardedAt,
        ],
      );
    }
  }

  async rebuildEventStandings(eventId: string): Promise<EventStanding[]> {
    const rows = await this.runner.query<ResolutionOutcomeAggregateRow>(
      `
        select
          r.outcome,
          (r.outcome->>'userId') as user_runtime_id
        from ppl_resolutions r
        join ppl_contests c on c.id = r.contest_id
        join ppl_events e on e.id = c.event_id
        where e.runtime_id = $1
          and r.resolution_status <> 'superseded'
        order by r.applied_at asc
      `,
      [eventId],
    );

    return rankEventStandings(eventId, rows);
  }

  async rebuildSeasonStandings(seasonId: string): Promise<SeasonStanding[]> {
    const season = await this.getSeason(seasonId);

    if (!season) {
      return [];
    }

    const rows = await this.runner.query<ResolutionOutcomeAggregateRow>(
      `
        select
          r.outcome,
          (r.outcome->>'userId') as user_runtime_id
        from ppl_resolutions r
        join ppl_entries pe on pe.runtime_id = (r.outcome->>'entryId')
        where pe.metadata->>'seasonId' = $1
          and r.resolution_status <> 'superseded'
        order by r.applied_at asc
      `,
      [seasonId],
    );

    return rankSeasonStandings(season, rows);
  }

  async finalizeWeeklyMatchups(
    seasonId: string,
    weekKey: string,
  ): Promise<WeeklySeasonResult[]> {
    const season = await this.getSeason(seasonId);

    if (!season || season.formatKey !== "head_to_head") {
      return [];
    }

    const events = await this.runner.query<PplEventRow>(
      `
        select
          e.*,
          s.runtime_id as season_runtime_id
        from ppl_events e
        join ppl_seasons s on s.id = e.season_id
        where s.runtime_id = $1
        order by e.start_time asc nulls last, e.created_at asc
      `,
      [seasonId],
    );
    const results: WeeklySeasonResult[] = [];

    for (const row of events) {
      if (readWeekKey(row.metadata) !== weekKey) {
        continue;
      }

      const event = mapPplEventRowToRuntime(row);
      const standings = await this.rebuildEventStandings(event.id);

      if (standings.length === 0) {
        continue;
      }

      results.push(...finalizeMatchupsForStandings(seasonId, weekKey, standings, event.metadata));
    }

    return results;
  }

  async rebuildPlayerCardAggregates(
    userIds: string[],
  ): Promise<PlayerCardAggregate[]> {
    if (userIds.length === 0) {
      return [];
    }

    const activeResolutions = await this.runner.query<ResolutionOutcomeAggregateRow>(
      `
        select
          r.outcome,
          (r.outcome->>'userId') as user_runtime_id
        from ppl_resolutions r
        where r.resolution_status <> 'superseded'
          and (r.outcome->>'userId') = any($1)
        order by r.applied_at asc
      `,
      [userIds],
    );
    const rewardRows = await this.runner.query<RewardLookupRow>(
      `
        select
          rw.*,
          u.runtime_id as user_runtime_id,
          c.runtime_id as contest_runtime_id
        from ppl_rewards rw
        join ppl_users u on u.id = rw.user_id
        left join ppl_contests c on c.id = rw.contest_id
        where u.runtime_id = any($1)
        order by rw.created_at asc
      `,
      [userIds],
    );
    const entryMetadataRows = await this.runner.query<EntryMetadataLookupRow>(
      `
        select
          u.runtime_id as user_runtime_id,
          pe.metadata
        from ppl_entries pe
        join ppl_users u on u.id = pe.user_id
        where u.runtime_id = any($1)
      `,
      [userIds],
    );
    const eventRows = await this.runner.query<{ event_runtime_id: string }>(
      `
        select distinct pe.metadata->>'eventId' as event_runtime_id
        from ppl_entries pe
        join ppl_users u on u.id = pe.user_id
        where u.runtime_id = any($1)
          and pe.metadata->>'eventId' is not null
      `,
      [userIds],
    );
    const eventStandingsByEvent = new Map<string, EventStanding[]>();

    for (const row of eventRows) {
      if (!row.event_runtime_id) {
        continue;
      }

      eventStandingsByEvent.set(
        row.event_runtime_id,
        await this.rebuildEventStandings(row.event_runtime_id),
      );
    }

    return userIds.map((userId) => {
      const userOutcomes = activeResolutions
        .filter((row) => row.user_runtime_id === userId)
        .map((row) => readOutcome(row.outcome));
      const userRewards = rewardRows
        .filter((row) => row.user_runtime_id === userId)
        .map((row) =>
          mapPplRewardRowToRuntime({
            row,
            userRuntimeId: userId,
            contestRuntimeId: row.contest_runtime_id,
          }),
        );
      const seasonIds = new Set(
        entryMetadataRows
          .filter((row) => row.user_runtime_id === userId)
          .map((row) => {
            const metadata = readRecord(row.metadata);
            return typeof metadata.seasonId === "string" ? metadata.seasonId : null;
          })
          .filter((seasonEntryId): seasonEntryId is string => seasonEntryId !== null),
      );
      const careerEventWins = [...eventStandingsByEvent.values()].filter(
        (rows) => rows[0]?.userId === userId,
      ).length;

      return {
        userId,
        clubId: null,
        lifetimePlayPoints:
          userOutcomes.reduce(
            (sum, outcome) => sum + numberOrZero(outcome.playPointsDelta),
            0,
          ) +
          userRewards.reduce((sum, reward) => sum + (reward.amount ?? 0), 0),
        careerContestVictories: userOutcomes.filter((outcome) =>
          Boolean(outcome.isVictory),
        ).length,
        careerEventWins,
        seasonsPlayed: seasonIds.size,
        bestActivityStreak: 0,
        bestWinStreak: 0,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  async listEventTriggers(eventId: string): Promise<PlayPointTrigger[]> {
    const rows = await this.runner.query<StoredTriggerDebugRow>(
      `
        select
          t.*,
          e.runtime_id as event_runtime_id
        from ppl_triggers t
        join ppl_events e on e.id = t.event_id
        where e.runtime_id = $1
        order by coalesce(t.provider_timestamp, t.ingested_at) desc
      `,
      [eventId],
    );

    return rows.map(mapPplTriggerRowToRuntime);
  }

  async listEventResolutions(eventId: string): Promise<ResolutionRow[]> {
    const rows = await this.runner.query<StoredResolutionLookupRow>(
      `
        select
          r.*,
          c.runtime_id as contest_runtime_id,
          t.runtime_id as trigger_runtime_id
        from ppl_resolutions r
        join ppl_contests c on c.id = r.contest_id
        join ppl_triggers t on t.id = r.trigger_id
        join ppl_events e on e.id = c.event_id
        where e.runtime_id = $1
        order by r.applied_at desc
      `,
      [eventId],
    );

    return rows.map((row) =>
      mapPplResolutionRowToRuntime({
        row,
        triggerId: row.trigger_runtime_id,
        contestId: row.contest_runtime_id,
      }),
    );
  }

  async listEventRewards(eventId: string): Promise<RewardRow[]> {
    const rows = await this.runner.query<RewardLookupRow>(
      `
        select
          rw.*,
          u.runtime_id as user_runtime_id,
          c.runtime_id as contest_runtime_id
        from ppl_rewards rw
        join ppl_users u on u.id = rw.user_id
        left join ppl_contests c on c.id = rw.contest_id
        left join ppl_events e on e.id = c.event_id
        where e.runtime_id = $1
          or rw.source_runtime_id = $1
          or rw.payload->'metadata'->>'eventId' = $1
        order by rw.created_at desc
      `,
      [eventId],
    );

    return rows.map((row) =>
      mapPplRewardRowToRuntime({
        row,
        userRuntimeId: row.user_runtime_id,
        contestRuntimeId: row.contest_runtime_id,
      }),
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

  private async resolveResolutionLink(
    resolutionRuntimeId: string,
  ): Promise<ResolutionLinkRow> {
    const rows = await this.runner.query<ResolutionLinkRow>(
      `
        select
          r.id,
          r.contest_id,
          c.runtime_id as contest_runtime_id
        from ppl_resolutions r
        join ppl_contests c on c.id = r.contest_id
        where r.runtime_id = $1
        limit 1
      `,
      [resolutionRuntimeId],
    );

    if (!rows[0]) {
      throw new Error(`Resolution "${resolutionRuntimeId}" was not found.`);
    }

    return rows[0];
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

  private async resolveContestUuid(contestRuntimeId: string): Promise<string> {
    const rows = await this.runner.query<RuntimeIdLookupRow>(
      `select id from ppl_contests where runtime_id = $1 limit 1`,
      [contestRuntimeId],
    );

    if (!rows[0]) {
      throw new Error(`Contest "${contestRuntimeId}" was not found.`);
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

function rankEventStandings(
  eventId: string,
  rows: ResolutionOutcomeAggregateRow[],
): EventStanding[] {
  const aggregates = new Map<
    string,
    {
      userId: string;
      pointsTotal: number;
      playPointsTotal: number;
      contestVictories: number;
      accuracyValues: number[];
    }
  >();

  for (const row of rows) {
    if (!row.user_runtime_id) {
      continue;
    }

    const outcome = readOutcome(row.outcome);
    const current = aggregates.get(row.user_runtime_id) ?? {
      userId: row.user_runtime_id,
      pointsTotal: 0,
      playPointsTotal: 0,
      contestVictories: 0,
      accuracyValues: [],
    };

    current.pointsTotal += numberOrZero(outcome.scoreDelta);
    current.playPointsTotal += numberOrZero(outcome.playPointsDelta);
    current.contestVictories += Boolean(outcome.isVictory) ? 1 : 0;

    if (typeof outcome.accuracyDelta === "number" && Number.isFinite(outcome.accuracyDelta)) {
      current.accuracyValues.push(outcome.accuracyDelta);
    }

    aggregates.set(row.user_runtime_id, current);
  }

  const timestamp = new Date().toISOString();

  return rankRows<EventStanding>(
    [...aggregates.values()].map((row) => ({
      eventId,
      userId: row.userId,
      pointsTotal: row.pointsTotal,
      playPointsTotal: row.playPointsTotal,
      contestVictories: row.contestVictories,
      accuracyAverage:
        row.accuracyValues.length > 0
          ? row.accuracyValues.reduce((sum, value) => sum + value, 0) /
            row.accuracyValues.length
          : null,
      tiebreakScore: row.playPointsTotal,
      updatedAt: timestamp,
    })),
    (left, right) =>
      right.pointsTotal - left.pointsTotal ||
      right.playPointsTotal - left.playPointsTotal ||
      right.contestVictories - left.contestVictories,
  );
}

function rankSeasonStandings(
  season: PlayPointSeason,
  rows: ResolutionOutcomeAggregateRow[],
): SeasonStanding[] {
  const aggregates = new Map<
    string,
    {
      userId: string;
      pointsTotal: number;
      playPointsTotal: number;
      wins: number;
    }
  >();

  for (const row of rows) {
    if (!row.user_runtime_id) {
      continue;
    }

    const outcome = readOutcome(row.outcome);
    const current = aggregates.get(row.user_runtime_id) ?? {
      userId: row.user_runtime_id,
      pointsTotal: 0,
      playPointsTotal: 0,
      wins: 0,
    };

    current.pointsTotal += numberOrZero(outcome.scoreDelta);
    current.playPointsTotal += numberOrZero(outcome.playPointsDelta);
    current.wins += Boolean(outcome.isVictory) ? 1 : 0;
    aggregates.set(row.user_runtime_id, current);
  }

  const timestamp = new Date().toISOString();

  return rankRows<SeasonStanding>(
    [...aggregates.values()].map((row) => ({
      seasonId: season.id,
      userId: row.userId,
      formatKey: season.formatKey,
      pointsTotal: row.pointsTotal,
      playPointsTotal: row.playPointsTotal,
      wins: row.wins,
      losses: 0,
      ties: 0,
      pointsFor: row.pointsTotal,
      pointsAgainst: 0,
      currentStreak: null,
      updatedAt: timestamp,
    })),
    (left, right) =>
      right.pointsTotal - left.pointsTotal ||
      right.playPointsTotal - left.playPointsTotal ||
      right.wins - left.wins,
  );
}

function rankRows<T extends { rank?: number | null }>(
  rows: T[],
  compare: (left: T, right: T) => number,
): T[] {
  const sorted = [...rows].sort(compare);
  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readOutcome(value: unknown): Record<string, unknown> {
  return readRecord(value);
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function integerFromMetadata(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0;
}

function finalizeMatchupsForStandings(
  seasonId: string,
  weekKey: string,
  standings: EventStanding[],
  metadata?: Record<string, unknown>,
): WeeklySeasonResult[] {
  const matchupPairs = readMatchupPairs(metadata, standings);
  const timestamp = new Date().toISOString();
  const standingsByUserId = new Map(standings.map((standing) => [standing.userId, standing]));
  const results: WeeklySeasonResult[] = [];
  const coveredUsers = new Set<string>();

  for (const [userId, opponentUserId] of matchupPairs) {
    const userStanding = standingsByUserId.get(userId);
    const opponentStanding = opponentUserId
      ? standingsByUserId.get(opponentUserId)
      : undefined;

    if (!userStanding) {
      continue;
    }

    coveredUsers.add(userId);
    results.push({
      seasonId,
      weekKey,
      userId,
      opponentUserId: opponentUserId ?? null,
      eventPoints: userStanding.pointsTotal,
      eventVictories: userStanding.contestVictories,
      result: resolveMatchupResult(userStanding, opponentStanding),
      updatedAt: timestamp,
    });
  }

  for (const standing of standings) {
    if (coveredUsers.has(standing.userId)) {
      continue;
    }

    results.push({
      seasonId,
      weekKey,
      userId: standing.userId,
      opponentUserId: null,
      eventPoints: standing.pointsTotal,
      eventVictories: standing.contestVictories,
      result: "pending",
      updatedAt: timestamp,
    });
  }

  return results;
}

function readMatchupPairs(
  metadata: Record<string, unknown> | undefined,
  standings: EventStanding[],
): Array<[string, string | null]> {
  const value = metadata?.matchups;

  if (Array.isArray(value)) {
    const pairs: Array<[string, string | null]> = [];

    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        continue;
      }

      const pair = item as Record<string, unknown>;
      const userId = typeof pair.userId === "string" ? pair.userId : null;
      const opponentUserId =
        typeof pair.opponentUserId === "string" ? pair.opponentUserId : null;

      if (userId) {
        pairs.push([userId, opponentUserId]);
      }
    }

    if (pairs.length > 0) {
      return pairs;
    }
  }

  if (standings.length === 2) {
    return [
      [standings[0].userId, standings[1].userId],
      [standings[1].userId, standings[0].userId],
    ];
  }

  return standings.map((standing) => [standing.userId, null]);
}

function resolveMatchupResult(
  standing: EventStanding,
  opponentStanding?: EventStanding,
): WeeklySeasonResult["result"] {
  if (!opponentStanding) {
    return "pending";
  }

  if (standing.pointsTotal > opponentStanding.pointsTotal) {
    return "win";
  }

  if (standing.pointsTotal < opponentStanding.pointsTotal) {
    return "loss";
  }

  if (standing.playPointsTotal > opponentStanding.playPointsTotal) {
    return "win";
  }

  if (standing.playPointsTotal < opponentStanding.playPointsTotal) {
    return "loss";
  }

  return "tie";
}

function readWeekKey(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) {
    return null;
  }

  if (typeof metadata.weekKey === "string") {
    return metadata.weekKey;
  }

  if (typeof metadata.week === "string") {
    return metadata.week;
  }

  return null;
}
