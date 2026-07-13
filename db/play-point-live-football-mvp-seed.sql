-- Seed the Play Point Live football MVP relational prototype.
-- Run this after:
-- 1. db/play-point-live-v1-schema.sql on a fresh database, or
-- 2. db/play-point-live-v1-runtime-id-upgrade.sql on an existing prototype schema.

with host_user as (
  insert into ppl_users (runtime_id, handle, display_name, email)
  values ('host-1', 'host-1', 'Host One', 'host-1@playpoint.local')
  on conflict (runtime_id) do update
  set
    handle = excluded.handle,
    display_name = excluded.display_name,
    email = excluded.email
  returning id, runtime_id
),
alex_user as (
  insert into ppl_users (runtime_id, handle, display_name, email)
  values ('alex', 'alex', 'Alex', 'alex@playpoint.local')
  on conflict (runtime_id) do update
  set
    handle = excluded.handle,
    display_name = excluded.display_name,
    email = excluded.email
  returning id, runtime_id
),
jordan_user as (
  insert into ppl_users (runtime_id, handle, display_name, email)
  values ('jordan', 'jordan', 'Jordan', 'jordan@playpoint.local')
  on conflict (runtime_id) do update
  set
    handle = excluded.handle,
    display_name = excluded.display_name,
    email = excluded.email
  returning id, runtime_id
),
host_ref as (
  select id, runtime_id from host_user
  union all
  select id, runtime_id from ppl_users where runtime_id = 'host-1'
  limit 1
),
alex_ref as (
  select id, runtime_id from alex_user
  union all
  select id, runtime_id from ppl_users where runtime_id = 'alex'
  limit 1
),
jordan_ref as (
  select id, runtime_id from jordan_user
  union all
  select id, runtime_id from ppl_users where runtime_id = 'jordan'
  limit 1
),
club_upsert as (
  insert into ppl_clubs (
    runtime_id,
    slug,
    name,
    description,
    visibility,
    owner_user_id,
    invite_code
  )
  select
    'club-friday-lights',
    'friday-lights-club',
    'Friday Lights Club',
    'Private football club seed for Play Point Live MVP.',
    'private',
    host_ref.id,
    'FRIDAYLIGHTS'
  from host_ref
  on conflict (runtime_id) do update
  set
    slug = excluded.slug,
    name = excluded.name,
    description = excluded.description,
    visibility = excluded.visibility,
    owner_user_id = excluded.owner_user_id,
    invite_code = excluded.invite_code
  returning id, runtime_id
),
club_ref as (
  select id, runtime_id from club_upsert
  union all
  select id, runtime_id from ppl_clubs where runtime_id = 'club-friday-lights'
  limit 1
),
season_upsert as (
  insert into ppl_seasons (
    runtime_id,
    club_id,
    slug,
    name,
    sport,
    format,
    scoring_mode,
    status,
    starts_at,
    ends_at,
    settings,
    created_by_user_id
  )
  select
    'season-2026-football',
    club_ref.id,
    '2026-football-pickem',
    '2026 Football Pick''em',
    'football',
    'points',
    'manual',
    'active',
    '2026-09-01T00:00:00.000Z'::timestamptz,
    '2027-02-15T00:00:00.000Z'::timestamptz,
    jsonb_build_object('surface', 'football-mvp'),
    host_ref.id
  from club_ref
  cross join host_ref
  on conflict (runtime_id) do update
  set
    club_id = excluded.club_id,
    slug = excluded.slug,
    name = excluded.name,
    sport = excluded.sport,
    format = excluded.format,
    scoring_mode = excluded.scoring_mode,
    status = excluded.status,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    settings = excluded.settings,
    created_by_user_id = excluded.created_by_user_id
  returning id, runtime_id
),
season_ref as (
  select id, runtime_id from season_upsert
  union all
  select id, runtime_id from ppl_seasons where runtime_id = 'season-2026-football'
  limit 1
),
event_upsert as (
  insert into ppl_events (
    runtime_id,
    season_id,
    external_event_key,
    sport,
    league,
    name,
    home_participant,
    away_participant,
    event_status,
    source_mode,
    start_time,
    metadata,
    created_by_user_id
  )
  select
    'event-bears-packers-2026-week-01',
    season_ref.id,
    'nfl:2026-week1-bears-packers',
    'football',
    'NFL',
    'Bears vs Packers Opening Night',
    'Bears',
    'Packers',
    'live',
    'manual',
    '2026-09-10T23:15:00.000Z'::timestamptz,
    jsonb_build_object(
      'clubId', 'club-friday-lights',
      'seasonId', 'season-2026-football'
    ),
    host_ref.id
  from season_ref
  cross join host_ref
  on conflict (runtime_id) do update
  set
    season_id = excluded.season_id,
    external_event_key = excluded.external_event_key,
    sport = excluded.sport,
    league = excluded.league,
    name = excluded.name,
    home_participant = excluded.home_participant,
    away_participant = excluded.away_participant,
    event_status = excluded.event_status,
    source_mode = excluded.source_mode,
    start_time = excluded.start_time,
    metadata = excluded.metadata,
    created_by_user_id = excluded.created_by_user_id
  returning id, runtime_id
),
event_ref as (
  select id, runtime_id from event_upsert
  union all
  select id, runtime_id from ppl_events where runtime_id = 'event-bears-packers-2026-week-01'
  limit 1
),
winner_contest as (
  insert into ppl_contests (
    runtime_id,
    event_id,
    slug,
    name,
    contest_type,
    trigger_type,
    resolution_type,
    source_mode,
    contest_status,
    scoring_config,
    settlement_config,
    created_by_user_id
  )
  select
    'contest-bears-packers-winner',
    event_ref.id,
    'winner-pick',
    'Winner Pick',
    'winner_pick',
    'event_final',
    'binary_correct',
    'manual',
    'open',
    '{"profileKey":"football-default"}'::jsonb,
    '{"expectedTriggerTypes":["football.event_final"]}'::jsonb,
    host_ref.id
  from event_ref
  cross join host_ref
  on conflict (runtime_id) do update
  set
    event_id = excluded.event_id,
    slug = excluded.slug,
    name = excluded.name,
    contest_type = excluded.contest_type,
    trigger_type = excluded.trigger_type,
    resolution_type = excluded.resolution_type,
    source_mode = excluded.source_mode,
    contest_status = excluded.contest_status,
    scoring_config = excluded.scoring_config,
    settlement_config = excluded.settlement_config,
    created_by_user_id = excluded.created_by_user_id
  returning id, runtime_id
),
score_contest as (
  insert into ppl_contests (
    runtime_id,
    event_id,
    slug,
    name,
    contest_type,
    trigger_type,
    resolution_type,
    source_mode,
    contest_status,
    scoring_config,
    settlement_config,
    created_by_user_id
  )
  select
    'contest-bears-packers-final-score',
    event_ref.id,
    'final-score',
    'Exact Final Score',
    'final_score',
    'event_final',
    'exact_match',
    'manual',
    'open',
    '{"profileKey":"football-default"}'::jsonb,
    '{"expectedTriggerTypes":["football.event_final"]}'::jsonb,
    host_ref.id
  from event_ref
  cross join host_ref
  on conflict (runtime_id) do update
  set
    event_id = excluded.event_id,
    slug = excluded.slug,
    name = excluded.name,
    contest_type = excluded.contest_type,
    trigger_type = excluded.trigger_type,
    resolution_type = excluded.resolution_type,
    source_mode = excluded.source_mode,
    contest_status = excluded.contest_status,
    scoring_config = excluded.scoring_config,
    settlement_config = excluded.settlement_config,
    created_by_user_id = excluded.created_by_user_id
  returning id, runtime_id
),
squares_contest as (
  insert into ppl_contests (
    runtime_id,
    event_id,
    slug,
    name,
    contest_type,
    trigger_type,
    resolution_type,
    source_mode,
    contest_status,
    scoring_config,
    settlement_config,
    created_by_user_id
  )
  select
    'contest-bears-packers-squares',
    event_ref.id,
    'football-squares',
    'Final Score Squares',
    'football_squares',
    'period_ended',
    'grid_match',
    'manual',
    'open',
    '{"profileKey":"football-default"}'::jsonb,
    '{
      "expectedTriggerTypes":["football.period_ended","football.event_final"],
      "settlePeriods":["Q1","Q2","Q3","FINAL"],
      "quarterScoreDelta":25,
      "finalScoreDelta":100,
      "quarterPlayPointsDelta":10,
      "finalPlayPointsDelta":50
    }'::jsonb,
    host_ref.id
  from event_ref
  cross join host_ref
  on conflict (runtime_id) do update
  set
    event_id = excluded.event_id,
    slug = excluded.slug,
    name = excluded.name,
    contest_type = excluded.contest_type,
    trigger_type = excluded.trigger_type,
    resolution_type = excluded.resolution_type,
    source_mode = excluded.source_mode,
    contest_status = excluded.contest_status,
    scoring_config = excluded.scoring_config,
    settlement_config = excluded.settlement_config,
    created_by_user_id = excluded.created_by_user_id
  returning id, runtime_id
)
insert into ppl_entries (
  runtime_id,
  contest_id,
  user_id,
  entry_status,
  selection,
  submitted_at,
  metadata
)
select
  seeded.runtime_id,
  seeded.contest_id,
  seeded.user_id,
  'active',
  seeded.selection,
  seeded.submitted_at,
  seeded.metadata
from (
  select
    'entry-winner-alex'::text as runtime_id,
    winner_contest.id as contest_id,
    alex_ref.id as user_id,
    '{"teamKey":"packers"}'::jsonb as selection,
    '2026-09-10T22:00:00.000Z'::timestamptz as submitted_at,
    jsonb_build_object(
      'eventId', 'event-bears-packers-2026-week-01',
      'seasonId', 'season-2026-football',
      'clubId', 'club-friday-lights',
      'lockedAt', '2026-09-10T23:10:00.000Z',
      'resolutionStatus', 'pending'
    ) as metadata
  from winner_contest
  cross join alex_ref

  union all

  select
    'entry-winner-jordan',
    winner_contest.id,
    jordan_ref.id,
    '{"teamKey":"bears"}'::jsonb,
    '2026-09-10T22:01:00.000Z'::timestamptz,
    jsonb_build_object(
      'eventId', 'event-bears-packers-2026-week-01',
      'seasonId', 'season-2026-football',
      'clubId', 'club-friday-lights',
      'lockedAt', '2026-09-10T23:10:00.000Z',
      'resolutionStatus', 'pending'
    )
  from winner_contest
  cross join jordan_ref

  union all

  select
    'entry-score-alex',
    score_contest.id,
    alex_ref.id,
    '{"homeScore":24,"awayScore":20}'::jsonb,
    '2026-09-10T22:02:00.000Z'::timestamptz,
    jsonb_build_object(
      'eventId', 'event-bears-packers-2026-week-01',
      'seasonId', 'season-2026-football',
      'clubId', 'club-friday-lights',
      'lockedAt', '2026-09-10T23:10:00.000Z',
      'resolutionStatus', 'pending'
    )
  from score_contest
  cross join alex_ref

  union all

  select
    'entry-score-jordan',
    score_contest.id,
    jordan_ref.id,
    '{"homeScore":17,"awayScore":21}'::jsonb,
    '2026-09-10T22:03:00.000Z'::timestamptz,
    jsonb_build_object(
      'eventId', 'event-bears-packers-2026-week-01',
      'seasonId', 'season-2026-football',
      'clubId', 'club-friday-lights',
      'lockedAt', '2026-09-10T23:10:00.000Z',
      'resolutionStatus', 'pending'
    )
  from score_contest
  cross join jordan_ref

  union all

  select
    'entry-squares-alex',
    squares_contest.id,
    alex_ref.id,
    '{"homeDigit":4,"awayDigit":0}'::jsonb,
    '2026-09-10T22:04:00.000Z'::timestamptz,
    jsonb_build_object(
      'eventId', 'event-bears-packers-2026-week-01',
      'seasonId', 'season-2026-football',
      'clubId', 'club-friday-lights',
      'lockedAt', '2026-09-10T23:10:00.000Z',
      'resolutionStatus', 'pending'
    )
  from squares_contest
  cross join alex_ref

  union all

  select
    'entry-squares-jordan',
    squares_contest.id,
    jordan_ref.id,
    '{"homeDigit":7,"awayDigit":1}'::jsonb,
    '2026-09-10T22:05:00.000Z'::timestamptz,
    jsonb_build_object(
      'eventId', 'event-bears-packers-2026-week-01',
      'seasonId', 'season-2026-football',
      'clubId', 'club-friday-lights',
      'lockedAt', '2026-09-10T23:10:00.000Z',
      'resolutionStatus', 'pending'
    )
  from squares_contest
  cross join jordan_ref
) seeded
on conflict (runtime_id) do update
set
  contest_id = excluded.contest_id,
  user_id = excluded.user_id,
  entry_status = excluded.entry_status,
  selection = excluded.selection,
  submitted_at = excluded.submitted_at,
  metadata = excluded.metadata;
