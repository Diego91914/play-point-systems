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
  PplTriggerRow,
  SqlQueryRunner,
} from "./relational-models";
import {
  mapPplContestRowToRuntime,
  mapPplEntryRowToRuntime,
  mapPplEventRowToRuntime,
  mapPplTriggerRowToRuntime,
} from "./relational-mappers";

export class PostgresPlayPointRepository implements PlayPointRepository {
  constructor(private readonly runner: SqlQueryRunner) {}

  async getEvent(eventId: string): Promise<PlayPointEvent | null> {
    const rows = await this.runner.query<PplEventRow>(
      `select * from ppl_events where id = $1 limit 1`,
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
      `select * from ppl_contests where id = $1 limit 1`,
      [contestId],
    );

    return rows[0] ? mapPplContestRowToRuntime(rows[0]) : null;
  }

  async getTrigger(triggerId: string): Promise<PlayPointTrigger | null> {
    const rows = await this.runner.query<PplTriggerRow>(
      `select * from ppl_triggers where id = $1 limit 1`,
      [triggerId],
    );

    return rows[0] ? mapPplTriggerRowToRuntime(rows[0]) : null;
  }

  async getTriggerByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PlayPointTrigger | null> {
    const rows = await this.runner.query<PplTriggerRow>(
      `select * from ppl_triggers where dedupe_key = $1 limit 1`,
      [idempotencyKey],
    );

    return rows[0] ? mapPplTriggerRowToRuntime(rows[0]) : null;
  }

  async listEventContests(eventId: string): Promise<PlayPointContest[]> {
    const rows = await this.runner.query<PplContestRow>(
      `select * from ppl_contests where event_id = $1 order by created_at asc`,
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
        select e.*
        from ppl_entries e
        join ppl_contests c on c.id = e.contest_id
        where c.event_id = $1
        order by e.submitted_at asc
      `,
      [eventId],
    );

    return rows
      .map((row) => {
        const contest = contests.find((candidate) => candidate.id === row.contest_id);
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
      `select * from ppl_entries where contest_id = $1 order by submitted_at asc`,
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
    void triggerId;
    throw new Error(
      "PostgresPlayPointRepository.listResolutionsByTrigger is not wired yet.",
    );
  }

  async saveEntry(entry: PlayPointEntry): Promise<void> {
    void entry;
    throw new Error("PostgresPlayPointRepository.saveEntry is not wired yet.");
  }

  async saveTrigger(trigger: PlayPointTrigger): Promise<void> {
    void trigger;
    throw new Error("PostgresPlayPointRepository.saveTrigger is not wired yet.");
  }

  async saveResolutions(rows: ResolutionRow[]): Promise<void> {
    void rows;
    throw new Error("PostgresPlayPointRepository.saveResolutions is not wired yet.");
  }

  async supersedeResolutionsByTrigger(triggerId: string): Promise<void> {
    void triggerId;
    throw new Error(
      "PostgresPlayPointRepository.supersedeResolutionsByTrigger is not wired yet.",
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
}
