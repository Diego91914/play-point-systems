import type {
  ContestResolutionBatch,
  ContestResolutionService,
  CorrectionRequest,
  CorrectionService,
  NotificationPublisher,
  PlayPointRepository,
  PlayPointTrigger,
  ProgressionService,
} from "./runtime-contracts";
import type { TriggerIngestionService } from "./runtime-contracts";

export class CoreCorrectionService implements CorrectionService {
  constructor(
    private readonly repository: PlayPointRepository,
    private readonly ingest: TriggerIngestionService,
    private readonly resolve: ContestResolutionService,
    private readonly progress: ProgressionService,
    private readonly notifications?: NotificationPublisher,
  ) {}

  async correctTrigger(args: CorrectionRequest): Promise<{
    supersededTriggerId: string;
    replacementTriggerId: string;
    rebuiltEventIds: string[];
    rebuiltSeasonIds: string[];
  }> {
    const originalTrigger = await this.repository.getTrigger(args.originalTriggerId);

    if (!originalTrigger) {
      throw new Error(`Trigger "${args.originalTriggerId}" was not found.`);
    }

    if (originalTrigger.status === "corrected") {
      throw new Error(`Trigger "${args.originalTriggerId}" has already been corrected.`);
    }

    const acceptedReplacement = await this.ingest.acceptTrigger({
      trigger: {
        ...args.replacementTrigger,
        correctionOfTriggerId: args.originalTriggerId,
      },
    });

    if (!acceptedReplacement.accepted) {
      throw new Error(acceptedReplacement.errors.join(" "));
    }

    await this.repository.supersedeResolutionsByTrigger(args.originalTriggerId);
    await this.repository.saveTrigger({
      ...originalTrigger,
      status: "corrected",
    });

    const batches = await this.resolve.resolveTrigger({
      triggerId: acceptedReplacement.trigger.id,
    });

    const rebuiltEventIds = new Set<string>([
      originalTrigger.eventId,
      acceptedReplacement.trigger.eventId,
    ]);
    const rebuiltSeasonIds = new Set<string>();

    for (const batch of batches) {
      const seasonId = await this.findSeasonId(batch, acceptedReplacement.trigger);
      const userIds = [...new Set(batch.entries.map((entry) => entry.userId))];

      await this.progress.applyBatch({
        triggerId: batch.trigger.id,
        eventId: batch.trigger.eventId,
        seasonId,
        contestId: batch.contest.id,
        resolutionIds: batch.resolutions.map((resolution) => resolution.id),
        userIds,
        isCorrection: true,
      });

      if (seasonId) {
        rebuiltSeasonIds.add(seasonId);
      }
    }

    if (this.notifications) {
      await this.notifications.publish([
        {
          type: "trigger.corrected",
          aggregateId: acceptedReplacement.trigger.id,
          occurredAt: new Date().toISOString(),
          payload: {
            originalTriggerId: args.originalTriggerId,
            replacementTriggerId: acceptedReplacement.trigger.id,
            correctedByUserId: args.correctedByUserId,
            reason: args.reason,
          },
        },
      ]);
    }

    return {
      supersededTriggerId: args.originalTriggerId,
      replacementTriggerId: acceptedReplacement.trigger.id,
      rebuiltEventIds: [...rebuiltEventIds],
      rebuiltSeasonIds: [...rebuiltSeasonIds],
    };
  }

  private async findSeasonId(
    batch: ContestResolutionBatch,
    trigger: PlayPointTrigger,
  ): Promise<string | null> {
    const entrySeasonId =
      batch.entries.find((entry) => entry.seasonId)?.seasonId ?? null;

    if (entrySeasonId) {
      return entrySeasonId;
    }

    const event = await this.repository.getEvent(trigger.eventId);
    return event?.seasonId ?? null;
  }
}
