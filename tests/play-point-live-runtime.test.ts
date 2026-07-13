import { describe, expect, it } from "vitest";
import { CoreContestResolutionService } from "../lib/play-point-core/contest-resolution-service";
import { CoreCorrectionService } from "../lib/play-point-core/correction-service";
import {
  createFootballMvpSeedData,
  InMemoryPlayPointRepository,
} from "../lib/play-point-core/football-mvp-repository";
import {
  FootballFinalScoreResolver,
  FootballSquaresResolver,
  FootballWinnerPickResolver,
} from "../lib/play-point-core/football-resolvers";
import { FootballResultTriggerPolicy } from "../lib/play-point-core/football-trigger-policy";
import { PostgresPlayPointRepository } from "../lib/play-point-core/postgres-play-point-repository";
import { CoreProgressionService } from "../lib/play-point-core/progression-service";
import type { SqlQueryRunner } from "../lib/play-point-core/relational-models";
import { StaticResolverRegistry } from "../lib/play-point-core/resolver-registry";
import type {
  AchievementService,
  DomainEvent,
  EventStanding,
  PlayPointRepository,
  PlayPointTrigger,
  ProgressionBatch,
  RewardRow,
  SeasonStanding,
} from "../lib/play-point-core/runtime-contracts";
import {
  CoreTriggerIngestionService,
  StaticTriggerPolicySelector,
} from "../lib/play-point-core/trigger-ingestion-service";

class NoopAchievementService implements AchievementService {
  async awardFromBatch(args: {
    batch: ProgressionBatch;
    eventStandings: EventStanding[];
    seasonStandings?: SeasonStanding[];
  }): Promise<RewardRow[]> {
    void args;
    return [];
  }
}

class MemoryNotificationPublisher {
  readonly events: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

class RecordingSqlRunner implements SqlQueryRunner {
  readonly calls: Array<{ sql: string; params: readonly unknown[] }> = [];

  async query<TRow>(sql: string, params: readonly unknown[] = []): Promise<TRow[]> {
    this.calls.push({ sql, params });

    if (sql.includes("select id from ppl_users where runtime_id = $1")) {
      return [{ id: "user-uuid-alex" }] as TRow[];
    }

    if (sql.includes("from ppl_resolutions r")) {
      return [
        {
          id: "resolution-uuid-1",
          contest_id: "contest-uuid-1",
          contest_runtime_id: "contest-bears-packers-final-score",
        },
      ] as TRow[];
    }

    return [];
  }
}

function createHarness(seed = createFootballMvpSeedData()) {
  const repository = new InMemoryPlayPointRepository(seed);
  const notifications = new MemoryNotificationPublisher();
  const triggerPolicy = new FootballResultTriggerPolicy();
  const policies = new StaticTriggerPolicySelector([
    ["winner_pick", triggerPolicy],
    ["final_score", triggerPolicy],
    ["football_squares", triggerPolicy],
  ]);
  const resolverRegistry = new StaticResolverRegistry([
    new FootballWinnerPickResolver(),
    new FootballFinalScoreResolver(),
    new FootballSquaresResolver(),
  ]);
  const achievements = new NoopAchievementService();
  const ingest = new CoreTriggerIngestionService(repository, policies, notifications);
  const resolve = new CoreContestResolutionService(
    repository,
    resolverRegistry,
    notifications,
  );
  const progress = new CoreProgressionService(
    repository,
    achievements,
    notifications,
  );
  const correct = new CoreCorrectionService(
    repository,
    ingest,
    resolve,
    progress,
    notifications,
  );

  return {
    repository,
    notifications,
    ingest,
    resolve,
    progress,
    correct,
  };
}

async function scoreTrigger(
  repository: PlayPointRepository,
  services: ReturnType<typeof createHarness>,
  trigger: PlayPointTrigger,
) {
  const accepted = await services.ingest.acceptTrigger({ trigger });

  if (!accepted.accepted) {
    throw new Error(`Expected trigger to be accepted: ${accepted.errors.join(" | ")}`);
  }

  const batches = await services.resolve.resolveTrigger({
    triggerId: accepted.trigger.id,
  });
  const event = await repository.getEvent(accepted.trigger.eventId);

  for (const batch of batches) {
    const seasonId =
      batch.entries.find((entry) => entry.seasonId)?.seasonId ??
      event?.seasonId ??
      null;
    const userIds = [...new Set(batch.entries.map((entry) => entry.userId))];

    await services.progress.applyBatch({
      triggerId: batch.trigger.id,
      eventId: batch.trigger.eventId,
      seasonId,
      contestId: batch.contest.id,
      resolutionIds: batch.resolutions.map((resolution) => resolution.id),
      userIds,
    });
  }

  return {
    accepted: accepted.trigger,
    batches,
    eventStandings: await repository.rebuildEventStandings(trigger.eventId),
    seasonStandings: event?.seasonId
      ? await repository.rebuildSeasonStandings(event.seasonId)
      : [],
  };
}

describe("Play Point Live football MVP runtime flows", () => {
  it("scores a final-result trigger across winner pick, final score, and squares", async () => {
    const harness = createHarness();
    const trigger: PlayPointTrigger = {
      id: "trigger-final-1",
      eventId: "event-bears-packers-2026-week-01",
      contestId: null,
      sourceMode: "manual",
      status: "pending",
      triggerType: "football.event_final",
      occurredAt: "2026-09-11T03:15:00.000Z",
      submittedByUserId: "host-1",
      idempotencyKey: "manual:final:1",
      payload: {
        homeTeamKey: "packers",
        awayTeamKey: "bears",
        homeScore: 24,
        awayScore: 20,
        period: "FINAL",
      },
    };

    const result = await scoreTrigger(harness.repository, harness, trigger);

    expect(result.batches).toHaveLength(3);
    expect(result.eventStandings).toHaveLength(2);
    expect(result.eventStandings[0]).toMatchObject({
      userId: "alex",
      pointsTotal: 150,
      playPointsTotal: 80,
      contestVictories: 2,
      rank: 1,
    });
    expect(result.eventStandings[1]).toMatchObject({
      userId: "jordan",
      pointsTotal: 0,
      playPointsTotal: 0,
      contestVictories: 0,
      rank: 2,
    });
    expect(result.seasonStandings[0]).toMatchObject({
      userId: "alex",
      pointsTotal: 150,
      wins: 2,
      rank: 1,
    });
    expect(harness.notifications.events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "trigger.accepted",
        "contest.resolved",
        "event.standings_rebuilt",
        "season.standings_rebuilt",
      ]),
    );
  });

  it("supersedes the original trigger and replays standings on correction", async () => {
    const harness = createHarness();
    const originalTrigger: PlayPointTrigger = {
      id: "trigger-final-original",
      eventId: "event-bears-packers-2026-week-01",
      contestId: null,
      sourceMode: "manual",
      status: "pending",
      triggerType: "football.event_final",
      occurredAt: "2026-09-11T03:15:00.000Z",
      submittedByUserId: "host-1",
      idempotencyKey: "manual:final:original",
      payload: {
        homeTeamKey: "packers",
        awayTeamKey: "bears",
        homeScore: 24,
        awayScore: 20,
        period: "FINAL",
      },
    };

    await scoreTrigger(harness.repository, harness, originalTrigger);

    const correction = await harness.correct.correctTrigger({
      originalTriggerId: originalTrigger.id,
      replacementTrigger: {
        id: "trigger-final-correction",
        eventId: "event-bears-packers-2026-week-01",
        contestId: null,
        sourceMode: "manual",
        status: "pending",
        triggerType: "football.event_final",
        occurredAt: "2026-09-11T03:20:00.000Z",
        submittedByUserId: "host-1",
        idempotencyKey: "manual:final:correction",
        payload: {
          homeTeamKey: "packers",
          awayTeamKey: "bears",
          homeScore: 17,
          awayScore: 21,
          period: "FINAL",
        },
      },
      reason: "Stat correction after official review",
      correctedByUserId: "host-1",
    });

    const correctedOriginal = await harness.repository.getTrigger(originalTrigger.id);
    const originalRows = await harness.repository.listResolutionsByTrigger(
      originalTrigger.id,
    );
    const correctedStandings = await harness.repository.rebuildEventStandings(
      originalTrigger.eventId,
    );

    expect(correction).toMatchObject({
      supersededTriggerId: "trigger-final-original",
      replacementTriggerId: "trigger-final-correction",
    });
    expect(correctedOriginal?.status).toBe("corrected");
    expect(originalRows).toHaveLength(6);
    expect(
      originalRows.every((row) => Boolean(row.supersededByResolutionId)),
    ).toBe(true);
    expect(correctedStandings[0]).toMatchObject({
      userId: "jordan",
      pointsTotal: 150,
      playPointsTotal: 80,
      contestVictories: 2,
      rank: 1,
    });
    expect(
      harness.notifications.events.some((event) => event.type === "trigger.corrected"),
    ).toBe(true);
  });

  it("finalizes weekly head-to-head results from event standings", async () => {
    const seed = createFootballMvpSeedData();

    if (!seed.seasons?.[0] || !seed.events?.[0]) {
      throw new Error("Expected default football MVP seed data.");
    }

    seed.seasons[0] = {
      ...seed.seasons[0],
      formatKey: "head_to_head",
    };
    seed.events[0] = {
      ...seed.events[0],
      metadata: {
        weekKey: "week-1",
        matchups: [
          { userId: "alex", opponentUserId: "jordan" },
          { userId: "jordan", opponentUserId: "alex" },
        ],
      },
    };

    const harness = createHarness(seed);

    await scoreTrigger(harness.repository, harness, {
      id: "trigger-final-week-1",
      eventId: "event-bears-packers-2026-week-01",
      contestId: null,
      sourceMode: "manual",
      status: "pending",
      triggerType: "football.event_final",
      occurredAt: "2026-09-11T03:15:00.000Z",
      submittedByUserId: "host-1",
      idempotencyKey: "manual:final:week-1",
      payload: {
        homeTeamKey: "packers",
        awayTeamKey: "bears",
        homeScore: 24,
        awayScore: 20,
        period: "FINAL",
      },
    });

    const weeklyResults = await harness.repository.finalizeWeeklyMatchups(
      "season-2026-football",
      "week-1",
    );

    expect(weeklyResults).toHaveLength(2);
    expect(weeklyResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "alex",
          opponentUserId: "jordan",
          result: "win",
          eventPoints: 150,
        }),
        expect.objectContaining({
          userId: "jordan",
          opponentUserId: "alex",
          result: "loss",
          eventPoints: 0,
        }),
      ]),
    );
  });
});

describe("Postgres reward persistence seam", () => {
  it("writes contest-resolution rewards with resolved relational links", async () => {
    const runner = new RecordingSqlRunner();
    const repository = new PostgresPlayPointRepository(runner);

    await repository.saveRewards([
      {
        id: "reward-1",
        userId: "alex",
        sourceType: "contest_resolution",
        sourceId: "trigger-final-1:entry-score-alex:final_score.final",
        rewardType: "play_points",
        amount: 25,
        metadata: {
          leaderboardPointsDelta: 3,
          victoryCredit: true,
        },
        awardedAt: "2026-09-11T03:16:00.000Z",
      },
    ]);

    const insertCall = runner.calls.find((call) =>
      call.sql.includes("insert into ppl_rewards"),
    );

    expect(insertCall).toBeDefined();
    expect(insertCall?.params).toMatchObject([
      "reward-1",
      "resolution-uuid-1",
      "contest-uuid-1",
      "user-uuid-alex",
      "contest_resolution",
      "trigger-final-1:entry-score-alex:final_score.final",
      "play_points",
      25,
      3,
      true,
      null,
      expect.any(String),
      "2026-09-11T03:16:00.000Z",
    ]);
  });
});
