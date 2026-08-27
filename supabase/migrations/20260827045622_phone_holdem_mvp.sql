create table if not exists public.ppl_holdem_tables (
  code text primary key,
  state jsonb not null,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint ppl_holdem_tables_code_format check (code ~ '^[A-Z2-9]{6}$'),
  constraint ppl_holdem_tables_state_object check (jsonb_typeof(state) = 'object')
);

create index if not exists ppl_holdem_tables_expires_at_idx on public.ppl_holdem_tables (expires_at);
alter table public.ppl_holdem_tables enable row level security;
revoke all on table public.ppl_holdem_tables from anon, authenticated;
grant all on table public.ppl_holdem_tables to service_role;
comment on table public.ppl_holdem_tables is 'Server-authoritative virtual-chip Texas Holdem rooms for Play Point Systems. Client access is only through authenticated route handlers; raw state is not exposed through the Data API.';
