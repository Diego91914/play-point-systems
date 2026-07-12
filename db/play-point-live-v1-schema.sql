-- Play Point Live v1 relational schema
-- Manual-first, automation-ready
-- Focus: clubs, seasons, events, contests, entries, triggers, resolutions, rewards

create extension if not exists pgcrypto;

create table ppl_users (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ppl_profiles (
  user_id uuid primary key references ppl_users(id) on delete cascade,
  avatar_url text,
  bio text,
  home_state text,
  favorite_team text,
  favorite_sport text,
  lifetime_play_points integer not null default 0,
  lifetime_event_wins integer not null default 0,
  lifetime_contest_wins integer not null default 0,
  current_division text not null default 'rookie',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ppl_clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  visibility text not null default 'private',
  owner_user_id uuid not null references ppl_users(id),
  invite_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_clubs_visibility_check
    check (visibility in ('private', 'invite_only', 'public'))
);

create table ppl_club_members (
  club_id uuid not null references ppl_clubs(id) on delete cascade,
  user_id uuid not null references ppl_users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id),
  constraint ppl_club_members_role_check
    check (role in ('owner', 'commissioner', 'host', 'member'))
);

create table ppl_seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references ppl_clubs(id) on delete cascade,
  slug text not null,
  name text not null,
  sport text not null,
  format text not null,
  scoring_mode text not null default 'manual',
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  playoff_size integer,
  settings jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references ppl_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, slug),
  constraint ppl_seasons_format_check
    check (format in ('points', 'head_to_head', 'championship_series', 'hybrid')),
  constraint ppl_seasons_scoring_mode_check
    check (scoring_mode in ('manual', 'confirm', 'auto')),
  constraint ppl_seasons_status_check
    check (status in ('draft', 'scheduled', 'active', 'complete', 'archived'))
);

create table ppl_events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references ppl_seasons(id) on delete set null,
  external_event_key text,
  sport text not null,
  league text,
  name text not null,
  home_participant text,
  away_participant text,
  event_status text not null default 'scheduled',
  source_mode text not null default 'manual',
  start_time timestamptz,
  final_time timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references ppl_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_events_status_check
    check (event_status in ('scheduled', 'live', 'paused', 'final', 'cancelled')),
  constraint ppl_events_source_mode_check
    check (source_mode in ('manual', 'confirm', 'auto'))
);

create unique index ppl_events_external_event_key_idx
  on ppl_events(external_event_key)
  where external_event_key is not null;

create table ppl_contests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references ppl_events(id) on delete cascade,
  slug text not null,
  name text not null,
  contest_type text not null,
  trigger_type text not null,
  resolution_type text not null,
  source_mode text not null default 'manual',
  contest_status text not null default 'draft',
  scoring_config jsonb not null default '{}'::jsonb,
  settlement_config jsonb not null default '{}'::jsonb,
  locked_at timestamptz,
  settled_at timestamptz,
  created_by_user_id uuid not null references ppl_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, slug),
  constraint ppl_contests_type_check
    check (
      contest_type in (
        'winner_pick',
        'final_score',
        'football_squares',
        'pickem',
        'driver_draw',
        'bracket',
        'custom'
      )
    ),
  constraint ppl_contests_trigger_check
    check (
      trigger_type in (
        'event_started',
        'event_paused',
        'event_resumed',
        'event_final',
        'score_changed',
        'period_ended',
        'overtime_started',
        'overtime_ended',
        'participant_finished',
        'finishing_order_final',
        'stage_ended',
        'bracket_game_final',
        'round_advanced',
        'tournament_final',
        'manual_override',
        'host_confirmed',
        'host_rejected'
      )
    ),
  constraint ppl_contests_resolution_check
    check (
      resolution_type in (
        'binary_correct',
        'exact_match',
        'closest_answer',
        'ranked_finish',
        'grid_match',
        'advancement_match',
        'weighted_points'
      )
    ),
  constraint ppl_contests_source_mode_check
    check (source_mode in ('manual', 'confirm', 'auto')),
  constraint ppl_contests_status_check
    check (contest_status in ('draft', 'open', 'locked', 'settled', 'void'))
);

create table ppl_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references ppl_contests(id) on delete cascade,
  user_id uuid not null references ppl_users(id) on delete cascade,
  entry_status text not null default 'active',
  selection jsonb not null,
  submitted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (contest_id, user_id),
  constraint ppl_entries_status_check
    check (entry_status in ('active', 'replaced', 'void'))
);

create table ppl_triggers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references ppl_events(id) on delete cascade,
  trigger_type text not null,
  source text not null,
  source_mode text not null,
  confidence text not null default 'high',
  provider_timestamp timestamptz,
  ingested_at timestamptz not null default now(),
  payload jsonb not null,
  raw_payload jsonb,
  dedupe_key text,
  created_by_user_id uuid references ppl_users(id),
  constraint ppl_triggers_type_check
    check (
      trigger_type in (
        'event_started',
        'event_paused',
        'event_resumed',
        'event_final',
        'score_changed',
        'period_ended',
        'overtime_started',
        'overtime_ended',
        'participant_finished',
        'finishing_order_final',
        'stage_ended',
        'bracket_game_final',
        'round_advanced',
        'tournament_final',
        'manual_override',
        'host_confirmed',
        'host_rejected'
      )
    ),
  constraint ppl_triggers_source_mode_check
    check (source_mode in ('manual', 'confirm', 'auto')),
  constraint ppl_triggers_confidence_check
    check (confidence in ('high', 'medium', 'low'))
);

create unique index ppl_triggers_dedupe_idx
  on ppl_triggers(dedupe_key)
  where dedupe_key is not null;

create table ppl_resolutions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references ppl_contests(id) on delete cascade,
  trigger_id uuid not null references ppl_triggers(id) on delete cascade,
  resolution_status text not null default 'applied',
  outcome jsonb not null,
  applied_at timestamptz not null default now(),
  applied_by_user_id uuid references ppl_users(id),
  notes text,
  constraint ppl_resolutions_status_check
    check (resolution_status in ('applied', 'reversed', 'superseded'))
);

create table ppl_rewards (
  id uuid primary key default gen_random_uuid(),
  resolution_id uuid not null references ppl_resolutions(id) on delete cascade,
  contest_id uuid not null references ppl_contests(id) on delete cascade,
  user_id uuid not null references ppl_users(id) on delete cascade,
  reward_type text not null,
  play_points_delta integer not null default 0,
  leaderboard_points_delta integer not null default 0,
  victory_credit boolean not null default false,
  achievement_key text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ppl_rewards_type_check
    check (reward_type in ('play_points', 'leaderboard_points', 'victory', 'achievement', 'compound'))
);

create table ppl_standings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references ppl_seasons(id) on delete cascade,
  user_id uuid not null references ppl_users(id) on delete cascade,
  wins integer not null default 0,
  losses integer not null default 0,
  ties integer not null default 0,
  play_points integer not null default 0,
  leaderboard_points integer not null default 0,
  event_wins integer not null default 0,
  contest_wins integer not null default 0,
  streak_type text,
  streak_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (season_id, user_id),
  constraint ppl_standings_streak_type_check
    check (streak_type in ('win', 'loss', 'tie') or streak_type is null)
);

create table ppl_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references ppl_events(id) on delete cascade,
  contest_id uuid references ppl_contests(id) on delete cascade,
  trigger_id uuid references ppl_triggers(id) on delete set null,
  resolution_id uuid references ppl_resolutions(id) on delete set null,
  actor_user_id uuid references ppl_users(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index ppl_events_season_idx on ppl_events(season_id);
create index ppl_contests_event_idx on ppl_contests(event_id);
create index ppl_entries_contest_idx on ppl_entries(contest_id);
create index ppl_triggers_event_idx on ppl_triggers(event_id, ingested_at desc);
create index ppl_resolutions_contest_idx on ppl_resolutions(contest_id, applied_at desc);
create index ppl_rewards_user_idx on ppl_rewards(user_id, created_at desc);
create index ppl_standings_season_idx on ppl_standings(season_id, leaderboard_points desc, play_points desc);
