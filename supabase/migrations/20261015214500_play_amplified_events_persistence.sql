-- Play Amplified Events persistence foundation.
-- Dedicated organized-events storage. Do not reuse League Night or legacy Play Point Live events.

create table public.ppl_amplified_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  template_id text not null,
  name text not null,
  event_date date,
  status text not null default 'draft',
  join_code varchar(8) unique,
  team_count integer not null default 3,
  registration_open boolean not null default false,
  published_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_amplified_events_status_check
    check (status in ('draft', 'published', 'live', 'complete', 'archived')),
  constraint ppl_amplified_events_team_count_check
    check (team_count between 1 and 32),
  constraint ppl_amplified_events_join_code_check
    check (join_code is null or join_code ~ '^[A-Z0-9]{6,8}$')
);

create table public.ppl_amplified_event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ppl_amplified_events(id) on delete cascade,
  display_name text not null,
  skill smallint not null default 3,
  source text not null default 'organizer',
  checked_in boolean not null default false,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_amplified_event_participants_skill_check check (skill between 1 and 5),
  constraint ppl_amplified_event_participants_source_check check (source in ('organizer', 'qr'))
);

create table public.ppl_amplified_event_activities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ppl_amplified_events(id) on delete cascade,
  module_id text not null,
  name text not null,
  sort_order integer not null,
  status text not null default 'scheduled',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, sort_order),
  constraint ppl_amplified_event_activities_status_check check (status in ('scheduled', 'live', 'complete'))
);

create table public.ppl_amplified_event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ppl_amplified_events(id) on delete cascade,
  name text not null,
  sort_order integer not null,
  total_skill integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, sort_order)
);

create table public.ppl_amplified_event_team_members (
  team_id uuid not null references public.ppl_amplified_event_teams(id) on delete cascade,
  participant_id uuid not null references public.ppl_amplified_event_participants(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, participant_id),
  unique (participant_id)
);

create index ppl_amplified_events_owner_idx on public.ppl_amplified_events(owner_user_id, created_at desc);
create index ppl_amplified_events_join_code_idx on public.ppl_amplified_events(join_code) where join_code is not null;
create index ppl_amplified_event_participants_event_idx on public.ppl_amplified_event_participants(event_id, display_name);
create index ppl_amplified_event_activities_event_idx on public.ppl_amplified_event_activities(event_id, sort_order);
create index ppl_amplified_event_teams_event_idx on public.ppl_amplified_event_teams(event_id, sort_order);

alter table public.ppl_amplified_events enable row level security;
alter table public.ppl_amplified_event_participants enable row level security;
alter table public.ppl_amplified_event_activities enable row level security;
alter table public.ppl_amplified_event_teams enable row level security;
alter table public.ppl_amplified_event_team_members enable row level security;

revoke all privileges on table public.ppl_amplified_events from anon, authenticated;
revoke all privileges on table public.ppl_amplified_event_participants from anon, authenticated;
revoke all privileges on table public.ppl_amplified_event_activities from anon, authenticated;
revoke all privileges on table public.ppl_amplified_event_teams from anon, authenticated;
revoke all privileges on table public.ppl_amplified_event_team_members from anon, authenticated;

grant select, insert, update, delete on table public.ppl_amplified_events to service_role;
grant select, insert, update, delete on table public.ppl_amplified_event_participants to service_role;
grant select, insert, update, delete on table public.ppl_amplified_event_activities to service_role;
grant select, insert, update, delete on table public.ppl_amplified_event_teams to service_role;
grant select, insert, update, delete on table public.ppl_amplified_event_team_members to service_role;

comment on table public.ppl_amplified_events is
  'Organizer-owned Play Amplified Events. Separate from League Night and legacy Play Point Live event records.';
comment on column public.ppl_amplified_events.status is
  'draft = organizer work only; published = QR registration open; live = teams locked/event started; complete or archived = closed lifecycle state.';
comment on column public.ppl_amplified_events.owner_user_id is
  'Play Amplified games-session subject. Authorization is enforced in server routes using the signed session cookie.';

do $verification$
begin
  if not has_table_privilege('service_role', 'public.ppl_amplified_events', 'SELECT,INSERT,UPDATE,DELETE')
     or not has_table_privilege('service_role', 'public.ppl_amplified_event_participants', 'SELECT,INSERT,UPDATE,DELETE')
     or not has_table_privilege('service_role', 'public.ppl_amplified_event_activities', 'SELECT,INSERT,UPDATE,DELETE')
     or not has_table_privilege('service_role', 'public.ppl_amplified_event_teams', 'SELECT,INSERT,UPDATE,DELETE')
     or not has_table_privilege('service_role', 'public.ppl_amplified_event_team_members', 'SELECT,INSERT,UPDATE,DELETE')
  then
    raise exception 'Play Amplified Events service-role grants are incomplete.';
  end if;

  if has_table_privilege('anon', 'public.ppl_amplified_events', 'SELECT')
     or has_table_privilege('authenticated', 'public.ppl_amplified_events', 'SELECT')
     or has_table_privilege('anon', 'public.ppl_amplified_event_participants', 'SELECT')
     or has_table_privilege('authenticated', 'public.ppl_amplified_event_participants', 'SELECT')
  then
    raise exception 'Play Amplified Events tables are exposed to browser database roles.';
  end if;
end
$verification$;
