-- Play Amplified Trivia Venue Mode
-- Keeps long-running venue presence separate from normal home/table trivia sessions.

create table public.ppl_trivia_venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_trivia_venues_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint ppl_trivia_venues_name_check
    check (char_length(btrim(display_name)) between 1 and 80)
);

create table public.ppl_trivia_venue_sessions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.ppl_trivia_venues(id) on delete cascade,
  status text not null default 'active',
  current_trivia_session_id uuid references public.ppl_trivia_sessions(id) on delete set null,
  presence_token_hash text not null,
  presence_token_rotated_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_trivia_venue_sessions_status_check
    check (status in ('active', 'paused', 'ended')),
  constraint ppl_trivia_venue_sessions_presence_hash_check
    check (presence_token_hash ~ '^[0-9a-f]{64}$'),
  constraint ppl_trivia_venue_sessions_end_check
    check (ended_at is null or ended_at >= started_at)
);

create unique index ppl_trivia_one_open_venue_session_idx
  on public.ppl_trivia_venue_sessions (venue_id)
  where status in ('active', 'paused');

create index ppl_trivia_venue_sessions_status_idx
  on public.ppl_trivia_venue_sessions (status, started_at desc);

create table public.ppl_trivia_venue_players (
  id uuid primary key default gen_random_uuid(),
  venue_session_id uuid not null references public.ppl_trivia_venue_sessions(id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  device_token_hash text not null,
  score_total integer not null default 0,
  rolling_score integer not null default 0,
  correct_count integer not null default 0,
  answered_count integer not null default 0,
  consecutive_questions_missed integer not null default 0,
  last_active_at timestamptz not null default now(),
  presence_expires_at timestamptz not null default (now() + interval '60 minutes'),
  removed_at timestamptz,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_trivia_venue_players_name_check
    check (char_length(btrim(name)) between 1 and 40),
  constraint ppl_trivia_venue_players_device_token_hash_check
    check (device_token_hash ~ '^[0-9a-f]{64}$'),
  constraint ppl_trivia_venue_players_score_check
    check (score_total >= 0 and rolling_score >= 0),
  constraint ppl_trivia_venue_players_counts_check
    check (correct_count >= 0 and answered_count >= 0 and consecutive_questions_missed >= 0),
  constraint ppl_trivia_venue_players_presence_check
    check (presence_expires_at >= joined_at),
  constraint ppl_trivia_venue_players_session_name_key
    unique (venue_session_id, normalized_name)
);

create index ppl_trivia_venue_players_presence_idx
  on public.ppl_trivia_venue_players (venue_session_id, presence_expires_at);

create index ppl_trivia_venue_players_activity_idx
  on public.ppl_trivia_venue_players (venue_session_id, consecutive_questions_missed, last_active_at desc)
  where removed_at is null;

create table public.ppl_trivia_venue_championships (
  id bigint generated always as identity primary key,
  venue_session_id uuid not null references public.ppl_trivia_venue_sessions(id) on delete cascade,
  window_started_at timestamptz not null,
  window_ended_at timestamptz not null,
  winner_player_id uuid references public.ppl_trivia_venue_players(id) on delete set null,
  standings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint ppl_trivia_venue_championships_window_check
    check (window_ended_at > window_started_at),
  constraint ppl_trivia_venue_championships_standings_check
    check (jsonb_typeof(standings) = 'array')
);

create index ppl_trivia_venue_championships_session_idx
  on public.ppl_trivia_venue_championships (venue_session_id, window_ended_at desc);

alter table public.ppl_trivia_venues enable row level security;
alter table public.ppl_trivia_venue_sessions enable row level security;
alter table public.ppl_trivia_venue_players enable row level security;
alter table public.ppl_trivia_venue_championships enable row level security;

revoke all on table public.ppl_trivia_venues from public, anon, authenticated;
revoke all on table public.ppl_trivia_venue_sessions from public, anon, authenticated;
revoke all on table public.ppl_trivia_venue_players from public, anon, authenticated;
revoke all on table public.ppl_trivia_venue_championships from public, anon, authenticated;
revoke all on sequence public.ppl_trivia_venue_championships_id_seq from public, anon, authenticated;

grant select, insert, update, delete on table public.ppl_trivia_venues to service_role;
grant select, insert, update, delete on table public.ppl_trivia_venue_sessions to service_role;
grant select, insert, update, delete on table public.ppl_trivia_venue_players to service_role;
grant select, insert, update, delete on table public.ppl_trivia_venue_championships to service_role;
grant usage, select on sequence public.ppl_trivia_venue_championships_id_seq to service_role;
