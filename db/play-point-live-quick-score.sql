-- Play Point Live Quick Score schema
-- Apply this to the Play Point Live Supabase project, not the Shot Caddy project.

create extension if not exists pgcrypto;

create table if not exists public.ppl_quick_score_players (
  id uuid primary key default gen_random_uuid(),
  recovery_code text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ppl_quick_score_sessions (
  id uuid primary key default gen_random_uuid(),
  session_code varchar(6) not null unique,
  course_slug text not null default 'quick-score',
  round_state jsonb not null,
  host_player_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ppl_quick_score_sessions_updated_at_idx
  on public.ppl_quick_score_sessions(updated_at desc);

create table if not exists public.ppl_quick_score_clubs (
  id uuid primary key default gen_random_uuid(),
  owner_player_id uuid not null references public.ppl_quick_score_players(id) on delete cascade,
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  sport_keys text[] not null default '{}',
  location_label text,
  notes text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_player_id, slug)
);

create index if not exists ppl_quick_score_clubs_owner_idx
  on public.ppl_quick_score_clubs(owner_player_id);

create table if not exists public.ppl_quick_score_club_participants (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.ppl_quick_score_clubs(id) on delete cascade,
  display_name text not null,
  normalized_name text not null,
  aliases text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, normalized_name)
);

create index if not exists ppl_quick_score_participants_club_idx
  on public.ppl_quick_score_club_participants(club_id);

create table if not exists public.ppl_quick_score_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.ppl_quick_score_clubs(id) on delete cascade,
  name text not null,
  event_type text not null default 'casual'
    check (event_type in ('casual', 'league_night', 'tournament', 'championship')),
  status text not null default 'draft'
    check (status in ('draft', 'live', 'complete', 'archived')),
  scheduled_for timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ppl_quick_score_events_club_idx
  on public.ppl_quick_score_events(club_id);

create table if not exists public.ppl_quick_score_matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.ppl_quick_score_clubs(id) on delete cascade,
  event_id uuid references public.ppl_quick_score_events(id) on delete set null,
  quick_score_session_code varchar(6)
    references public.ppl_quick_score_sessions(session_code) on delete set null,
  sport_key text not null check (
    sport_key in (
      'BOCCE_OFFICIAL',
      'CORNHOLE',
      'PICKLEBALL',
      'HORSESHOES',
      'WASHERS',
      'LADDER_GOLF',
      'KANJAM',
      'SPIKEBALL',
      'BEER_PONG',
      'GENERIC_POINTS'
    )
  ),
  format_key text,
  participant_ids uuid[] not null default '{}',
  team_labels text[],
  winner_participant_ids uuid[],
  winning_label text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'complete', 'void')),
  started_at timestamptz,
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ppl_quick_score_matches_club_idx
  on public.ppl_quick_score_matches(club_id);

create index if not exists ppl_quick_score_matches_event_idx
  on public.ppl_quick_score_matches(event_id);

create table if not exists public.ppl_quick_score_purchases (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.ppl_quick_score_players(id) on delete cascade,
  product_sku text not null,
  provider text not null,
  provider_txn_id text not null unique,
  status text not null default 'active' check (status in ('active', 'refunded', 'revoked')),
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (player_id, product_sku, status)
);

create index if not exists ppl_quick_score_purchases_player_idx
  on public.ppl_quick_score_purchases(player_id);
