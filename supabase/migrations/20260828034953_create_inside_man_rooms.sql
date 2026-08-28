create table if not exists public.ppl_inside_man_rooms (
  code text primary key,
  state jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 day'),
  constraint ppl_inside_man_rooms_code_format check (code ~ '^[A-Z2-9]{6}$')
);

alter table public.ppl_inside_man_rooms enable row level security;
revoke all on table public.ppl_inside_man_rooms from anon, authenticated;
grant select, insert, update, delete on table public.ppl_inside_man_rooms to service_role;

create index if not exists ppl_inside_man_rooms_expires_at_idx on public.ppl_inside_man_rooms (expires_at);
