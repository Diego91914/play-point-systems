create table if not exists public.ppl_room_registry (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  game_sku text not null,
  join_href text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

create index if not exists ppl_room_registry_expires_at_idx on public.ppl_room_registry (expires_at);

alter table public.ppl_room_registry enable row level security;

comment on table public.ppl_room_registry is 'Play Amplified platform room directory. Game engines register rooms here so one universal room code can resolve to the correct experience.';


-- Generalize the directory from lobby rooms to all Play Amplified sessions.
-- OPEN_LOBBY: players join first and form the roster.
-- HOSTED_ROSTER: the host creates the roster and players claim/connect to a seat.
alter table public.ppl_room_registry
  add column if not exists participation_model text not null default 'OPEN_LOBBY'
    check (participation_model in ('OPEN_LOBBY', 'HOSTED_ROSTER')),
  add column if not exists external_session_id text null;

comment on table public.ppl_room_registry is 'Play Amplified session directory. Resolves one universal session code to the correct game experience without requiring every game to use the same participation model.';
