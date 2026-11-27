create table if not exists public.ppl_thats_your_story_rooms (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 day')
);
alter table public.ppl_thats_your_story_rooms enable row level security;
revoke all on table public.ppl_thats_your_story_rooms from anon, authenticated;
grant select, insert, update, delete on table public.ppl_thats_your_story_rooms to service_role;
