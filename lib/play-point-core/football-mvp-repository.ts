import type {
  EventStanding,
  PlayPointClub,
  PlayPointContest,
  PlayPointEntry,
  PlayPointEvent,
  PlayPointRepository,
  PlayPointSeason,
  PlayPointTrigger,
  PlayerCardAggregate,
  ResolutionRow,
  RewardRow,
  SeasonStanding,
  WeeklySeasonResult,
} from "./runtime-contracts";

export interface InMemoryPlayPointRepositorySeed {
  clubs?: PlayPointClub[];
  seasons?: PlayPointSeason[];
  events?: PlayPointEvent[];
  contests?: PlayPointContest[];
  entries?: PlayPointEntry[];
  triggers?: PlayPointTrigger[];
  resolutions?: ResolutionRow[];
  rewards?: RewardRow[];
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

export class InMemoryPlayPointRepository implements PlayPointRepository {
  private readonly clubs = new Map<string, PlayPointClub>();
  private readonly seasons = new Map<string, PlayPointSeason>();
  private readonly events = new Map<string, PlayPointEvent>();
  private readonly contests = new Map<string, PlayPointContest>();
  private readonly entries = new Map<string, PlayPointEntry>();
  private readonly triggers = new Map<string, PlayPointTrigger>();
  private readonly resolutions = new Map<string, ResolutionRow>();
  private readonly rewards = new Map<string, RewardRow>();
  private readonly persist?: (seed: InMemoryPlayPointRepositorySeed) => void;

  constructor(
    seed: InMemoryPlayPointRepositorySeed = {},
    persist?: (seed: InMemoryPlayPointRepositorySeed) => void,
  ) {
    this.persist = persist;

    for (const club of seed.clubs ?? []) {
      this.clubs.set(club.id, club);
    }

    for (const season of seed.seasons ?? []) {
      this.seasons.set(season.id, season);
    }

    for (const event of seed.events ?? []) {
      this.events.set(event.id, event);
    }

    for (const contest of seed.contests ?? []) {
      this.contests.set(contest.id, contest);
    }

    for (const entry of seed.entries ?? []) {
      this.entries.set(entry.id, entry);
    }

    for (const trigger of seed.triggers ?? []) {
      this.triggers.set(trigger.id, trigger);
    }

    for (const resolution of seed.resolutions ?? []) {
      this.resolutions.set(resolution.id, resolution);
    }

    for (const reward of seed.rewards ?? []) {
      this.rewards.set(reward.id, reward);
    }
  }

  async getEvent(eventId: string): Promise<PlayPointEvent | null> {
    return this.events.get(eventId) ?? null;
  }

  async getSeason(seasonId: string): Promise<PlayPointSeason | null> {
    return this.seasons.get(seasonId) ?? null;
  }

  async getContest(contestId: string): Promise<PlayPointContest | null> {
    return this.contests.get(contestId) ?? null;
  }

  async getTrigger(triggerId: string): Promise<PlayPointTrigger | null> {
    return this.triggers.get(triggerId) ?? null;
  }

  async getTriggerByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PlayPointTrigger | null> {
    for (const trigger of this.triggers.values()) {
      if (trigger.idempotencyKey === idempotencyKey) {
        return trigger;
      }
    }

    return null;
  }

  async listEventContests(eventId: string): Promise<PlayPointContest[]> {
    return [...this.contests.values()].filter((contest) => contest.eventId === eventId);
  }

  async listEventEntries(eventId: string): Promise<PlayPointEntry[]> {
    return [...this.entries.values()].filter((entry) => entry.eventId === eventId);
  }

  async listContestEntries(contestId: string): Promise<PlayPointEntry[]> {
    return [...this.entries.values()].filter((entry) => entry.contestId === contestId);
  }

  async listResolutionsByTrigger(triggerId: string): Promise<ResolutionRow[]> {
    return [...this.resolutions.values()].filter((row) => row.triggerId === triggerId);
  }

  async updateEventMetadata(
    eventId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const existing = this.events.get(eventId);

    if (!existing) {
      throw new Error(`Event "${eventId}" was not found.`);
    }

    this.events.set(eventId, {
      ...existing,
      metadata,
    });
    this.persistState();
  }

  async saveEntry(entry: PlayPointEntry): Promise<void> {
    this.entries.set(entry.id, entry);
    this.persistState();
  }

  async saveTrigger(trigger: PlayPointTrigger): Promise<void> {
    this.triggers.set(trigger.id, trigger);
    this.persistState();
  }

  async saveResolutions(rows: ResolutionRow[]): Promise<void> {
    for (const row of rows) {
      this.resolutions.set(row.id, row);
    }

    this.persistState();
  }

  async supersedeResolutionsByTrigger(triggerId: string): Promise<void> {
    for (const row of this.resolutions.values()) {
      if (row.triggerId === triggerId && !row.supersededByResolutionId) {
        this.resolutions.set(row.id, {
          ...row,
          supersededByResolutionId: `${row.id}:superseded`,
        });
      }
    }

    this.persistState();
  }

  async saveRewards(rows: RewardRow[]): Promise<void> {
    for (const row of rows) {
      this.rewards.set(row.id, row);
    }

    this.persistState();
  }

  async rebuildEventStandings(eventId: string): Promise<EventStanding[]> {
    const contestIds = new Set(
      [...this.contests.values()]
        .filter((contest) => contest.eventId === eventId)
        .map((contest) => contest.id),
    );

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

    for (const resolution of this.resolutions.values()) {
      if (!contestIds.has(resolution.contestId) || resolution.supersededByResolutionId) {
        continue;
      }

      const current = aggregates.get(resolution.userId) ?? {
        userId: resolution.userId,
        pointsTotal: 0,
        playPointsTotal: 0,
        contestVictories: 0,
        accuracyValues: [],
      };

      current.pointsTotal += resolution.scoreDelta;
      current.playPointsTotal += resolution.playPointsDelta;
      current.contestVictories += resolution.isVictory ? 1 : 0;

      if (typeof resolution.accuracyDelta === "number") {
        current.accuracyValues.push(resolution.accuracyDelta);
      }

      aggregates.set(resolution.userId, current);
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

  async rebuildSeasonStandings(seasonId: string): Promise<SeasonStanding[]> {
    const season = this.seasons.get(seasonId);

    if (!season) {
      return [];
    }

    const entryIds = new Set(
      [...this.entries.values()]
        .filter((entry) => entry.seasonId === seasonId)
        .map((entry) => entry.id),
    );

    const aggregates = new Map<
      string,
      {
        userId: string;
        pointsTotal: number;
        playPointsTotal: number;
        wins: number;
      }
    >();

    for (const resolution of this.resolutions.values()) {
      if (!entryIds.has(resolution.entryId) || resolution.supersededByResolutionId) {
        continue;
      }

      const current = aggregates.get(resolution.userId) ?? {
        userId: resolution.userId,
        pointsTotal: 0,
        playPointsTotal: 0,
        wins: 0,
      };

      current.pointsTotal += resolution.scoreDelta;
      current.playPointsTotal += resolution.playPointsDelta;
      current.wins += resolution.isVictory ? 1 : 0;
      aggregates.set(resolution.userId, current);
    }

    const timestamp = new Date().toISOString();

    return rankRows<SeasonStanding>(
      [...aggregates.values()].map((row) => ({
        seasonId,
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

  async finalizeWeeklyMatchups(
    seasonId: string,
    weekKey: string,
  ): Promise<WeeklySeasonResult[]> {
    const season = this.seasons.get(seasonId);

    if (!season || season.formatKey !== "head_to_head") {
      return [];
    }

    const results: WeeklySeasonResult[] = [];

    for (const event of this.events.values()) {
      if (event.seasonId !== seasonId) {
        continue;
      }

      const eventWeekKey = readWeekKey(event.metadata);

      if (eventWeekKey !== weekKey) {
        continue;
      }

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
    const requestedUsers = new Set(userIds);
    const activeResolutions = [...this.resolutions.values()].filter(
      (row) => !row.supersededByResolutionId && requestedUsers.has(row.userId),
    );
    const allRewards = [...this.rewards.values()].filter((row) =>
      requestedUsers.has(row.userId),
    );
    const eventStandingsByEvent = new Map<string, EventStanding[]>();

    for (const event of this.events.values()) {
      eventStandingsByEvent.set(event.id, await this.rebuildEventStandings(event.id));
    }

    return userIds.map((userId) => {
      const userResolutions = activeResolutions.filter((row) => row.userId === userId);
      const userRewards = allRewards.filter((row) => row.userId === userId);
      const seasonIds = new Set(
        [...this.entries.values()]
          .filter((entry) => entry.userId === userId && entry.seasonId)
          .map((entry) => entry.seasonId as string),
      );
      const careerEventWins = [...eventStandingsByEvent.values()].filter(
        (rows) => rows[0]?.userId === userId,
      ).length;

      return {
        userId,
        clubId: null,
        lifetimePlayPoints:
          userResolutions.reduce((sum, row) => sum + row.playPointsDelta, 0) +
          userRewards.reduce((sum, row) => sum + (row.amount ?? 0), 0),
        careerContestVictories: userResolutions.filter((row) => row.isVictory).length,
        careerEventWins,
        seasonsPlayed: seasonIds.size,
        bestActivityStreak: 0,
        bestWinStreak: 0,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  listTriggers(): PlayPointTrigger[] {
    return [...this.triggers.values()];
  }

  listResolutions(): ResolutionRow[] {
    return [...this.resolutions.values()];
  }

  listRewards(): RewardRow[] {
    return [...this.rewards.values()];
  }

  toSeed(): InMemoryPlayPointRepositorySeed {
    return {
      clubs: [...this.clubs.values()],
      seasons: [...this.seasons.values()],
      events: [...this.events.values()],
      contests: [...this.contests.values()],
      entries: [...this.entries.values()],
      triggers: [...this.triggers.values()],
      resolutions: [...this.resolutions.values()],
      rewards: [...this.rewards.values()],
    };
  }

  private persistState() {
    this.persist?.(this.toSeed());
  }
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

export function createFootballMvpSeedData(): InMemoryPlayPointRepositorySeed {
  const clubId = "club-friday-lights";
  const seasonId = "season-2026-football";
  const eventId = "event-bears-packers-2026-week-01";
  const timestamp = "2026-09-10T23:15:00.000Z";

  return {
    clubs: [
      {
        id: clubId,
        slug: "friday-lights-club",
        name: "Friday Lights Club",
        visibility: "private",
        createdByUserId: "host-1",
        createdAt: "2026-07-12T12:00:00.000Z",
      },
    ],
    seasons: [
      {
        id: seasonId,
        clubId,
        name: "2026 Football Pick'em",
        sportKey: "football",
        formatKey: "total_points",
        status: "active",
        startsAt: "2026-09-01T00:00:00.000Z",
        endsAt: "2027-02-15T00:00:00.000Z",
      },
    ],
    events: [
      {
        id: eventId,
        clubId,
        seasonId,
        sportKey: "football",
        title: "Bears vs Packers Opening Night",
        status: "live",
        scheduledAt: timestamp,
        externalRef: "nfl:2026-week1-bears-packers",
      },
    ],
    contests: [
      {
        id: "contest-bears-packers-winner",
        eventId,
        formatKey: "winner_pick",
        title: "Winner Pick",
        scoringProfileKey: "football-default",
        status: "open",
        config: {
          expectedTriggerTypes: ["football.event_final"],
        },
      },
      {
        id: "contest-bears-packers-final-score",
        eventId,
        formatKey: "final_score",
        title: "Exact Final Score",
        scoringProfileKey: "football-default",
        status: "open",
        config: {
          expectedTriggerTypes: ["football.event_final"],
        },
      },
      {
        id: "contest-bears-packers-squares",
        eventId,
        formatKey: "football_squares",
        title: "Final Score Squares",
        scoringProfileKey: "football-default",
        status: "open",
        config: {
          expectedTriggerTypes: ["football.period_ended", "football.event_final"],
          settlePeriods: ["Q1", "Q2", "Q3", "FINAL"],
          quarterScoreDelta: 25,
          finalScoreDelta: 100,
          quarterPlayPointsDelta: 10,
          finalPlayPointsDelta: 50,
        },
      },
    ],
    entries: [
      {
        id: "entry-winner-alex",
        contestId: "contest-bears-packers-winner",
        eventId,
        seasonId,
        clubId,
        userId: "alex",
        submittedAt: "2026-09-10T22:00:00.000Z",
        lockedAt: "2026-09-10T23:10:00.000Z",
        selection: {
          teamKey: "packers",
        },
        status: "pending",
      },
      {
        id: "entry-winner-jordan",
        contestId: "contest-bears-packers-winner",
        eventId,
        seasonId,
        clubId,
        userId: "jordan",
        submittedAt: "2026-09-10T22:01:00.000Z",
        lockedAt: "2026-09-10T23:10:00.000Z",
        selection: {
          teamKey: "bears",
        },
        status: "pending",
      },
      {
        id: "entry-score-alex",
        contestId: "contest-bears-packers-final-score",
        eventId,
        seasonId,
        clubId,
        userId: "alex",
        submittedAt: "2026-09-10T22:02:00.000Z",
        lockedAt: "2026-09-10T23:10:00.000Z",
        selection: {
          homeScore: 24,
          awayScore: 20,
        },
        status: "pending",
      },
      {
        id: "entry-score-jordan",
        contestId: "contest-bears-packers-final-score",
        eventId,
        seasonId,
        clubId,
        userId: "jordan",
        submittedAt: "2026-09-10T22:03:00.000Z",
        lockedAt: "2026-09-10T23:10:00.000Z",
        selection: {
          homeScore: 17,
          awayScore: 21,
        },
        status: "pending",
      },
      {
        id: "entry-squares-alex",
        contestId: "contest-bears-packers-squares",
        eventId,
        seasonId,
        clubId,
        userId: "alex",
        submittedAt: "2026-09-10T22:04:00.000Z",
        lockedAt: "2026-09-10T23:10:00.000Z",
        selection: {
          homeDigit: 4,
          awayDigit: 0,
        },
        status: "pending",
      },
      {
        id: "entry-squares-jordan",
        contestId: "contest-bears-packers-squares",
        eventId,
        seasonId,
        clubId,
        userId: "jordan",
        submittedAt: "2026-09-10T22:05:00.000Z",
        lockedAt: "2026-09-10T23:10:00.000Z",
        selection: {
          homeDigit: 7,
          awayDigit: 1,
        },
        status: "pending",
      },
    ],
  };
}
