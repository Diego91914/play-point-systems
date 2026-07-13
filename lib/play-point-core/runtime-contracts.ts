export type SportKey =
  | "football"
  | "racing"
  | "basketball"
  | "baseball"
  | "golf"
  | "soccer"
  | "hockey"
  | "combat"
  | "tournament"
  | "custom";

export type SeasonFormatKey =
  | "total_points"
  | "head_to_head"
  | "championship_series";

export type ContestFormatKey =
  | "winner_pick"
  | "final_score"
  | "football_squares"
  | "driver_shuffle"
  | "driver_franchise"
  | "bracket_pick"
  | "over_under"
  | "custom_question";

export type TriggerSourceMode = "manual" | "confirmed" | "automatic";

export type TriggerLifecycleStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "processed"
  | "corrected";

export type EntryResolutionStatus =
  | "pending"
  | "partial"
  | "resolved"
  | "superseded";

export type MatchupResult = "win" | "loss" | "tie" | "pending";

export interface PlayPointClub {
  id: string;
  slug: string;
  name: string;
  visibility: "public" | "private" | "invite_only";
  createdByUserId: string;
  createdAt: string;
}

export interface PlayPointSeason {
  id: string;
  clubId: string;
  name: string;
  sportKey: SportKey;
  formatKey: SeasonFormatKey;
  status: "draft" | "active" | "completed" | "archived";
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface PlayPointEvent {
  id: string;
  clubId?: string | null;
  seasonId?: string | null;
  sportKey: SportKey;
  title: string;
  status: "draft" | "scheduled" | "live" | "closed" | "settled";
  scheduledAt?: string | null;
  externalRef?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PlayPointContest {
  id: string;
  eventId: string;
  formatKey: ContestFormatKey;
  title: string;
  scoringProfileKey: string;
  status: "draft" | "open" | "locked" | "live" | "settled" | "corrected";
  config: Record<string, unknown>;
}

export interface PlayPointEntry {
  id: string;
  contestId: string;
  eventId: string;
  seasonId?: string | null;
  clubId?: string | null;
  userId: string;
  submittedAt: string;
  lockedAt?: string | null;
  selection: Record<string, unknown>;
  status: EntryResolutionStatus;
}

export interface PlayPointTrigger {
  id: string;
  eventId: string;
  contestId?: string | null;
  sourceMode: TriggerSourceMode;
  status: TriggerLifecycleStatus;
  triggerType: string;
  occurredAt: string;
  submittedByUserId?: string | null;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  correctionOfTriggerId?: string | null;
}

export interface ResolutionRow {
  id: string;
  triggerId: string;
  contestId: string;
  entryId: string;
  userId: string;
  ruleKey: string;
  scoreDelta: number;
  playPointsDelta: number;
  placement?: number | null;
  accuracyDelta?: number | null;
  isVictory: boolean;
  supersededByResolutionId?: string | null;
  metadata?: Record<string, unknown>;
  resolvedAt: string;
}

export interface RewardRow {
  id: string;
  userId: string;
  sourceType:
    | "contest_resolution"
    | "event_finish"
    | "season_result"
    | "achievement"
    | "streak";
  sourceId: string;
  rewardType: "play_points" | "badge" | "title" | "trophy";
  amount?: number | null;
  metadata?: Record<string, unknown>;
  awardedAt: string;
}

export interface EventStanding {
  eventId: string;
  userId: string;
  pointsTotal: number;
  playPointsTotal: number;
  contestVictories: number;
  accuracyAverage?: number | null;
  rank?: number | null;
  tiebreakScore?: number | null;
  updatedAt: string;
}

export interface SeasonStanding {
  seasonId: string;
  userId: string;
  formatKey: SeasonFormatKey;
  pointsTotal: number;
  playPointsTotal: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  currentStreak?: string | null;
  rank?: number | null;
  updatedAt: string;
}

export interface WeeklySeasonResult {
  seasonId: string;
  weekKey: string;
  userId: string;
  opponentUserId?: string | null;
  eventPoints: number;
  eventVictories: number;
  result: MatchupResult;
  updatedAt: string;
}

export interface PlayerCardAggregate {
  userId: string;
  clubId?: string | null;
  lifetimePlayPoints: number;
  careerContestVictories: number;
  careerEventWins: number;
  seasonsPlayed: number;
  bestActivityStreak: number;
  bestWinStreak: number;
  updatedAt: string;
}

export interface TriggerValidationResult {
  accepted: boolean;
  errors: string[];
  normalizedPayload?: Record<string, unknown>;
}

export interface ContestResolutionBatch {
  trigger: PlayPointTrigger;
  contest: PlayPointContest;
  entries: PlayPointEntry[];
  resolutions: ResolutionRow[];
  metadata?: Record<string, unknown>;
}

export interface ProgressionBatch {
  triggerId: string;
  eventId: string;
  seasonId?: string | null;
  contestId: string;
  resolutionIds: string[];
  userIds: string[];
  isCorrection?: boolean;
}

export interface CorrectionRequest {
  originalTriggerId: string;
  replacementTrigger: PlayPointTrigger;
  reason: string;
  correctedByUserId: string;
}

export interface DomainEvent<TPayload = Record<string, unknown>> {
  type:
    | "trigger.accepted"
    | "trigger.corrected"
    | "contest.resolved"
    | "event.standings_rebuilt"
    | "season.standings_rebuilt"
    | "season.matchup_finalized"
    | "player.achievement_unlocked"
    | "player.rank_changed";
  aggregateId: string;
  occurredAt: string;
  payload: TPayload;
}

export interface PlayPointRepository {
  getEvent(eventId: string): Promise<PlayPointEvent | null>;
  getSeason(seasonId: string): Promise<PlayPointSeason | null>;
  getContest(contestId: string): Promise<PlayPointContest | null>;
  getTrigger(triggerId: string): Promise<PlayPointTrigger | null>;
  getTriggerByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PlayPointTrigger | null>;
  listEventContests(eventId: string): Promise<PlayPointContest[]>;
  listEventEntries(eventId: string): Promise<PlayPointEntry[]>;
  listContestEntries(contestId: string): Promise<PlayPointEntry[]>;
  listResolutionsByTrigger(triggerId: string): Promise<ResolutionRow[]>;
  updateEventMetadata(
    eventId: string,
    metadata: Record<string, unknown>,
  ): Promise<void>;
  saveEntry(entry: PlayPointEntry): Promise<void>;
  saveTrigger(trigger: PlayPointTrigger): Promise<void>;
  saveResolutions(rows: ResolutionRow[]): Promise<void>;
  supersedeResolutionsByTrigger(triggerId: string): Promise<void>;
  saveRewards(rows: RewardRow[]): Promise<void>;
  rebuildEventStandings(eventId: string): Promise<EventStanding[]>;
  rebuildSeasonStandings(seasonId: string): Promise<SeasonStanding[]>;
  finalizeWeeklyMatchups(
    seasonId: string,
    weekKey: string,
  ): Promise<WeeklySeasonResult[]>;
  rebuildPlayerCardAggregates(userIds: string[]): Promise<PlayerCardAggregate[]>;
}

export interface TriggerPolicy {
  validate(
    contest: PlayPointContest,
    trigger: PlayPointTrigger,
  ): TriggerValidationResult;
}

export interface ContestResolver {
  supports(formatKey: ContestFormatKey): boolean;
  resolve(args: {
    contest: PlayPointContest;
    trigger: PlayPointTrigger;
    entries: PlayPointEntry[];
  }): Promise<ContestResolutionBatch>;
}

export interface ResolverRegistry {
  getResolver(formatKey: ContestFormatKey): ContestResolver;
}

export interface AchievementService {
  awardFromBatch(args: {
    batch: ProgressionBatch;
    eventStandings: EventStanding[];
    seasonStandings?: SeasonStanding[];
  }): Promise<RewardRow[]>;
}

export interface NotificationPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}

export interface TriggerIngestionService {
  acceptTrigger(args: {
    trigger: PlayPointTrigger;
  }): Promise<{
    trigger: PlayPointTrigger;
    accepted: boolean;
    errors: string[];
  }>;
}

export interface ContestResolutionService {
  resolveTrigger(args: {
    triggerId: string;
  }): Promise<ContestResolutionBatch[]>;
}

export interface ProgressionService {
  applyBatch(batch: ProgressionBatch): Promise<{
    eventStandings: EventStanding[];
    seasonStandings?: SeasonStanding[];
    rewards: RewardRow[];
  }>;
}

export interface CorrectionService {
  correctTrigger(args: CorrectionRequest): Promise<{
    supersededTriggerId: string;
    replacementTriggerId: string;
    rebuiltEventIds: string[];
    rebuiltSeasonIds: string[];
  }>;
}

export interface PlayPointLiveKernel {
  ingest: TriggerIngestionService;
  resolve: ContestResolutionService;
  progress: ProgressionService;
  correct: CorrectionService;
}

export interface FootballWinnerSelection {
  teamKey: string;
}

export interface FootballFinalScoreSelection {
  homeScore: number;
  awayScore: number;
}

export interface FootballSquaresSelection {
  homeDigit: number;
  awayDigit: number;
}

export interface RacingDriverSelection {
  driverId: string;
  assignmentType: "shuffle" | "franchise";
}

export interface BracketPickSelection {
  slotKey: string;
  participantKey: string;
}

export const PLAY_POINT_LIVE_BUILD_ORDER = [
  "trigger ingestion service",
  "resolver registry",
  "winner/final score/squares resolvers",
  "event standings rebuild",
  "season standings rebuild",
  "weekly matchup finalizer",
  "achievement and reward service",
  "notification publisher",
  "correction service",
] as const;
