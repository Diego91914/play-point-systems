import type {
  ContestResolutionBatch,
  ContestResolutionService,
  NotificationPublisher,
  PlayPointContest,
  PlayPointRepository,
  PlayPointTrigger,
  ResolverRegistry,
} from "./runtime-contracts";

function readExpectedTriggerTypes(contest: PlayPointContest): string[] {
  const values = new Set<string>();

  if (typeof contest.config.expectedTriggerType === "string") {
    values.add(contest.config.expectedTriggerType);
  }

  if (Array.isArray(contest.config.expectedTriggerTypes)) {
    for (const value of contest.config.expectedTriggerTypes) {
      if (typeof value === "string") {
        values.add(value);
      }
    }
  }

  return [...values];
}

function contestMatchesTrigger(
  contest: PlayPointContest,
  trigger: PlayPointTrigger,
): boolean {
  const expectedTriggerTypes = readExpectedTriggerTypes(contest);

  if (expectedTriggerTypes.length === 0) {
    return true;
  }

  return expectedTriggerTypes.includes(trigger.triggerType);
}

async function buildStoredBatches(args: {
  repository: PlayPointRepository;
  trigger: PlayPointTrigger;
}): Promise<ContestResolutionBatch[]> {
  const storedRows = await args.repository.listResolutionsByTrigger(args.trigger.id);

  if (storedRows.length === 0) {
    return [];
  }

  const rowsByContestId = new Map<string, typeof storedRows>();

  for (const row of storedRows) {
    const contestRows = rowsByContestId.get(row.contestId) ?? [];
    contestRows.push(row);
    rowsByContestId.set(row.contestId, contestRows);
  }

  const batches: ContestResolutionBatch[] = [];

  for (const [contestId, rows] of rowsByContestId) {
    const contest = await args.repository.getContest(contestId);

    if (!contest) {
      continue;
    }

    const entries = await args.repository.listContestEntries(contestId);
    batches.push({
      trigger: args.trigger,
      contest,
      entries,
      resolutions: rows,
      metadata: {
        replayed: true,
      },
    });
  }

  return batches;
}

export class CoreContestResolutionService implements ContestResolutionService {
  constructor(
    private readonly repository: PlayPointRepository,
    private readonly resolvers: ResolverRegistry,
    private readonly notifications?: NotificationPublisher,
  ) {}

  async resolveTrigger(args: {
    triggerId: string;
  }): Promise<ContestResolutionBatch[]> {
    const trigger = await this.repository.getTrigger(args.triggerId);

    if (!trigger) {
      throw new Error(`Trigger "${args.triggerId}" was not found.`);
    }

    if (trigger.status === "processed") {
      return buildStoredBatches({
        repository: this.repository,
        trigger,
      });
    }

    const contests = await this.getContestsForTrigger(trigger);

    if (contests.length === 0) {
      throw new Error(
        `No contests matched trigger "${trigger.id}" for event "${trigger.eventId}".`,
      );
    }

    const batches: ContestResolutionBatch[] = [];

    for (const contest of contests) {
      const entries = await this.repository.listContestEntries(contest.id);
      const resolver = this.resolvers.getResolver(contest.formatKey);
      const batch = await resolver.resolve({
        contest,
        trigger,
        entries,
      });

      batches.push(batch);
    }

    await this.repository.saveResolutions(
      batches.flatMap((batch) => batch.resolutions),
    );
    await this.repository.saveTrigger({
      ...trigger,
      status: "processed",
    });

    if (this.notifications) {
      await this.notifications.publish(
        batches.map((batch) => ({
          type: "contest.resolved" as const,
          aggregateId: batch.contest.id,
          occurredAt: new Date().toISOString(),
          payload: {
            triggerId: trigger.id,
            contestId: batch.contest.id,
            eventId: trigger.eventId,
            resolutionCount: batch.resolutions.length,
          },
        })),
      );
    }

    return batches;
  }

  private async getContestsForTrigger(
    trigger: PlayPointTrigger,
  ): Promise<PlayPointContest[]> {
    if (trigger.contestId) {
      const contest = await this.repository.getContest(trigger.contestId);

      if (!contest) {
        throw new Error(`Contest "${trigger.contestId}" was not found.`);
      }

      return [contest];
    }

    const eventContests = await this.repository.listEventContests(trigger.eventId);
    return eventContests.filter((contest) => contestMatchesTrigger(contest, trigger));
  }
}
