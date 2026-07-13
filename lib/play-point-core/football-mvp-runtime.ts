import {
  CoreContestResolutionService,
} from "./contest-resolution-service";
import { CoreCorrectionService } from "./correction-service";
import {
  FootballFinalScoreResolver,
  FootballSquaresResolver,
  FootballWinnerPickResolver,
} from "./football-resolvers";
import {
  type CreateFootballMvpRepositoryOptions,
  createFootballMvpRepositoryBinding,
  type FootballMvpRuntimeDebugState,
} from "./football-mvp-repository-factory";
import type { InMemoryPlayPointRepositorySeed } from "./football-mvp-repository";
import type { FootballMvpStorageMode } from "./football-mvp-storage";
import { FootballResultTriggerPolicy } from "./football-trigger-policy";
import { CoreProgressionService } from "./progression-service";
import type { SqlQueryRunner } from "./relational-models";
import { StaticResolverRegistry } from "./resolver-registry";
import {
  CoreTriggerIngestionService,
  StaticTriggerPolicySelector,
} from "./trigger-ingestion-service";
import type {
  AchievementService,
  CorrectionRequest,
  DomainEvent,
  EventStanding,
  NotificationPublisher,
  PlayPointTrigger,
  ProgressionBatch,
  RewardRow,
  SeasonStanding,
} from "./runtime-contracts";

interface PlayerEntrySelectionInput {
  contestId: string;
  selection: Record<string, unknown>;
}

export interface CreateFootballMvpRuntimeOptions
  extends CreateFootballMvpRepositoryOptions {
  seed?: InMemoryPlayPointRepositorySeed;
  storageMode?: FootballMvpStorageMode;
  postgresRunner?: SqlQueryRunner;
}

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

class InMemoryNotificationPublisher implements NotificationPublisher {
  private readonly events: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }

  listEvents(): DomainEvent[] {
    return [...this.events];
  }
}

export function createFootballMvpRuntime(
  options: CreateFootballMvpRuntimeOptions = {},
) {
  const repositoryBinding = createFootballMvpRepositoryBinding(options);
  const {
    seed,
    repository,
    storageMode,
    requestedStorageMode,
    persistencePath,
    getDebugState,
  } = repositoryBinding;
  const notifications = new InMemoryNotificationPublisher();
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

  async function summarizeEventState(eventId: string, seasonId?: string | null) {
    return {
      entries: await repository.listEventEntries(eventId),
      eventStandings: await repository.rebuildEventStandings(eventId),
      seasonStandings:
        seasonId !== undefined && seasonId !== null
          ? await repository.rebuildSeasonStandings(seasonId)
          : undefined,
      notifications: notifications.listEvents(),
    };
  }

  async function scoreTrigger(args: { trigger: PlayPointTrigger }) {
    const accepted = await ingest.acceptTrigger({
      trigger: args.trigger,
    });

    if (!accepted.accepted) {
      return {
        accepted: false as const,
        trigger: accepted.trigger,
        errors: accepted.errors,
      };
    }

    const batches = await resolve.resolveTrigger({
      triggerId: accepted.trigger.id,
    });
    const progression = [];
    const event = await repository.getEvent(accepted.trigger.eventId);

    for (const batch of batches) {
      const seasonId =
        batch.entries.find((entry) => entry.seasonId)?.seasonId ??
        event?.seasonId ??
        null;
      const userIds = [...new Set(batch.entries.map((entry) => entry.userId))];

      progression.push(
        await progress.applyBatch({
          triggerId: batch.trigger.id,
          eventId: batch.trigger.eventId,
          seasonId,
          contestId: batch.contest.id,
          resolutionIds: batch.resolutions.map((resolution) => resolution.id),
          userIds,
        }),
      );
    }

    const summary = await summarizeEventState(
      accepted.trigger.eventId,
      event?.seasonId,
    );

    return {
      accepted: true as const,
      trigger: accepted.trigger,
      errors: [] as string[],
      batches,
      progression,
      entries: summary.entries,
      eventStandings: summary.eventStandings,
      seasonStandings: summary.seasonStandings,
      notifications: summary.notifications,
    };
  }

  async function correctScoredTrigger(args: CorrectionRequest) {
    const correction = await correct.correctTrigger(args);
    const replacementTrigger = await repository.getTrigger(
      correction.replacementTriggerId,
    );

    if (!replacementTrigger) {
      throw new Error(
        `Replacement trigger "${correction.replacementTriggerId}" was not found after correction.`,
      );
    }

    const replacementEvent = await repository.getEvent(replacementTrigger.eventId);
    const summary = await summarizeEventState(
      replacementTrigger.eventId,
      replacementEvent?.seasonId,
    );
    const batches = await resolve.resolveTrigger({
      triggerId: replacementTrigger.id,
    });

    return {
      correction,
      replacementTrigger,
      batches,
      entries: summary.entries,
      eventStandings: summary.eventStandings,
      seasonStandings: summary.seasonStandings,
      notifications: summary.notifications,
    };
  }

  async function upsertPlayerEntries(args: {
    eventId: string;
    userId: string;
    selections: PlayerEntrySelectionInput[];
  }) {
    const event = await repository.getEvent(args.eventId);

    if (!event) {
      throw new Error(`Event "${args.eventId}" was not found.`);
    }

    const savedEntries = [];

    for (const item of args.selections) {
      const contest = await repository.getContest(item.contestId);

      if (!contest) {
        throw new Error(`Contest "${item.contestId}" was not found.`);
      }

      if (contest.eventId !== args.eventId) {
        throw new Error(
          `Contest "${item.contestId}" does not belong to event "${args.eventId}".`,
        );
      }

      const existingEntry = (
        await repository.listContestEntries(item.contestId)
      ).find((entry) => entry.userId === args.userId);

      const nextEntry = {
        id: existingEntry?.id ?? `entry-${item.contestId}-${args.userId}`,
        contestId: item.contestId,
        eventId: args.eventId,
        seasonId: existingEntry?.seasonId ?? event.seasonId ?? null,
        clubId: existingEntry?.clubId ?? event.clubId ?? null,
        userId: args.userId,
        submittedAt: existingEntry?.submittedAt ?? new Date().toISOString(),
        lockedAt: existingEntry?.lockedAt ?? null,
        selection: item.selection,
        status: "pending" as const,
      };

      await repository.saveEntry(nextEntry);
      savedEntries.push(nextEntry);
    }

    const summary = await summarizeEventState(args.eventId, event.seasonId);

    return {
      event,
      savedEntries,
      entries: summary.entries,
      eventStandings: summary.eventStandings,
      seasonStandings: summary.seasonStandings,
      notifications: summary.notifications,
    };
  }

  async function inspectDebugState(): Promise<FootballMvpRuntimeDebugState> {
    return getDebugState();
  }

  return {
    seed,
    storageMode,
    requestedStorageMode,
    persistencePath,
    repository,
    notifications,
    resolverRegistry,
    triggerPolicy,
    ingest,
    resolve,
    progress,
    correct,
    scoreTrigger,
    correctScoredTrigger,
    upsertPlayerEntries,
    inspectDebugState,
  };
}

export const footballMvpRuntime = createFootballMvpRuntime();
