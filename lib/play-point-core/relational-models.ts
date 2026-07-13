export type PplVisibility = "private" | "invite_only" | "public";
export type PplSeasonFormat =
  | "points"
  | "head_to_head"
  | "championship_series"
  | "hybrid";
export type PplSourceMode = "manual" | "confirm" | "auto";
export type PplEventStatus =
  | "scheduled"
  | "live"
  | "paused"
  | "final"
  | "cancelled";
export type PplContestStatus = "draft" | "open" | "locked" | "settled" | "void";
export type PplEntryStatus = "active" | "replaced" | "void";
export type PplTriggerConfidence = "high" | "medium" | "low";
export type PplResolutionStatus = "applied" | "reversed" | "superseded";

export type PplContestType =
  | "winner_pick"
  | "final_score"
  | "football_squares"
  | "pickem"
  | "driver_draw"
  | "bracket"
  | "custom";

export type PplTriggerType =
  | "event_started"
  | "event_paused"
  | "event_resumed"
  | "event_final"
  | "score_changed"
  | "period_ended"
  | "overtime_started"
  | "overtime_ended"
  | "participant_finished"
  | "finishing_order_final"
  | "stage_ended"
  | "bracket_game_final"
  | "round_advanced"
  | "tournament_final"
  | "manual_override"
  | "host_confirmed"
  | "host_rejected";

export type PplResolutionType =
  | "binary_correct"
  | "exact_match"
  | "closest_answer"
  | "ranked_finish"
  | "grid_match"
  | "advancement_match"
  | "weighted_points";

export interface PplSeasonRow {
  id: string;
  runtime_id: string;
  club_id: string;
  club_runtime_id?: string | null;
  slug: string;
  name: string;
  sport: string;
  format: PplSeasonFormat;
  scoring_mode: PplSourceMode;
  status: "draft" | "scheduled" | "active" | "complete" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  playoff_size: number | null;
  settings: Record<string, unknown>;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PplEventRow {
  id: string;
  runtime_id: string;
  season_id: string | null;
  season_runtime_id?: string | null;
  external_event_key: string | null;
  sport: string;
  league: string | null;
  name: string;
  home_participant: string | null;
  away_participant: string | null;
  event_status: PplEventStatus;
  source_mode: PplSourceMode;
  start_time: string | null;
  final_time: string | null;
  metadata: Record<string, unknown>;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PplContestRow {
  id: string;
  runtime_id: string;
  event_id: string;
  event_runtime_id?: string | null;
  slug: string;
  name: string;
  contest_type: PplContestType;
  trigger_type: PplTriggerType;
  resolution_type: PplResolutionType;
  source_mode: PplSourceMode;
  contest_status: PplContestStatus;
  scoring_config: Record<string, unknown>;
  settlement_config: Record<string, unknown>;
  locked_at: string | null;
  settled_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PplEntryRow {
  id: string;
  runtime_id: string;
  contest_id: string;
  contest_runtime_id?: string | null;
  user_id: string;
  user_runtime_id?: string | null;
  entry_status: PplEntryStatus;
  selection: Record<string, unknown>;
  submitted_at: string;
  metadata: Record<string, unknown>;
}

export interface PplTriggerRow {
  id: string;
  runtime_id: string;
  event_id: string;
  event_runtime_id?: string | null;
  trigger_type: string;
  source: string;
  source_mode: PplSourceMode;
  confidence: PplTriggerConfidence;
  provider_timestamp: string | null;
  ingested_at: string;
  payload: Record<string, unknown>;
  raw_payload: Record<string, unknown> | null;
  dedupe_key: string | null;
  created_by_user_id: string | null;
}

export interface PplResolutionRow {
  id: string;
  runtime_id: string;
  contest_id: string;
  trigger_id: string;
  resolution_status: PplResolutionStatus;
  outcome: Record<string, unknown>;
  applied_at: string;
  applied_by_user_id: string | null;
  notes: string | null;
}

export interface PplRewardRow {
  id: string;
  runtime_id: string;
  resolution_id: string | null;
  contest_id: string | null;
  user_id: string;
  source_type:
    | "contest_resolution"
    | "event_finish"
    | "season_result"
    | "achievement"
    | "streak";
  source_runtime_id: string;
  reward_type: "play_points" | "badge" | "title" | "trophy";
  play_points_delta: number;
  leaderboard_points_delta: number;
  victory_credit: boolean;
  achievement_key: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface SqlQueryRunner {
  query<TRow>(sql: string, params?: readonly unknown[]): Promise<TRow[]>;
}
