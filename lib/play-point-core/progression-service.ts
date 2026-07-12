import type {
  AchievementService,
  EventStanding,
  NotificationPublisher,
  PlayPointRepository,
  ProgressionBatch,
  ProgressionService,
  RewardRow,
  SeasonStanding,
} from "./runtime-contracts";

export class CoreProgressionService implements ProgressionService {
  constructor(
    private readonly repository: PlayPointRepository,
    private readonly achievements: AchievementService,
    private readonly notifications?: NotificationPublisher,
  ) {}

  async applyBatch(batch: ProgressionBatch): Promise<{
    eventStandings: EventStanding[];
    seasonStandings?: SeasonStanding[];
    rewards: RewardRow[];
  }> {
    const eventStandings = await this.repository.rebuildEventStandings(batch.eventId);

    const seasonStandings = batch.seasonId
      ? await this.repository.rebuildSeasonStandings(batch.seasonId)
      : undefined;

    const achievementRewards = await this.achievements.awardFromBatch({
      batch,
      eventStandings,
      seasonStandings,
    });

    if (achievementRewards.length > 0) {
      await this.repository.saveRewards(achievementRewards);
    }

    await this.repository.rebuildPlayerCardAggregates(batch.userIds);

    if (this.notifications) {
      await this.notifications.publish([
        {
          type: "event.standings_rebuilt",
          aggregateId: batch.eventId,
          occurredAt: new Date().toISOString(),
          payload: {
            eventId: batch.eventId,
            contestId: batch.contestId,
          },
        },
        ...(batch.seasonId
          ? [
              {
                type: "season.standings_rebuilt" as const,
                aggregateId: batch.seasonId,
                occurredAt: new Date().toISOString(),
                payload: {
                  seasonId: batch.seasonId,
                  contestId: batch.contestId,
                },
              },
            ]
          : []),
      ]);
    }

    return {
      eventStandings,
      seasonStandings,
      rewards: achievementRewards,
    };
  }
}
