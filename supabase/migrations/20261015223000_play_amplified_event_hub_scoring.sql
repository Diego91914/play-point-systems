-- Play Amplified Event Hub scoring foundation.
-- Stacked on 20261015214500_play_amplified_events_persistence.sql.
-- Results are append-only by version so replacing an activity result never requires a destructive delete.

create table public.ppl_amplified_event_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ppl_amplified_events(id) on delete cascade,
  activity_id uuid not null references public.ppl_amplified_event_activities(id) on delete cascade,
  result_version integer not null,
  entity_type text not null,
  team_id uuid references public.ppl_amplified_event_teams(id) on delete cascade,
  participant_id uuid references public.ppl_amplified_event_participants(id) on delete cascade,
  placement integer not null,
  raw_score numeric,
  score_label text,
  event_points integer not null default 0,
  source text not null default 'manual',
  source_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ppl_amplified_event_results_entity_check
    check (
      (entity_type = 'team' and team_id is not null and participant_id is null)
      or
      (entity_type = 'participant' and participant_id is not null and team_id is null)
    ),
  constraint ppl_amplified_event_results_placement_check check (placement > 0),
  constraint ppl_amplified_event_results_points_check check (event_points >= 0),
  constraint ppl_amplified_event_results_version_check check (result_version > 0),
  constraint ppl_amplified_event_results_source_check
    check (source in ('manual', 'shot-caddy', 'clear-the-stack', 'trivia', 'social-game', 'custom'))
);

create index ppl_amplified_event_results_event_idx
  on public.ppl_amplified_event_results(event_id, activity_id, result_version desc);
create index ppl_amplified_event_results_team_idx
  on public.ppl_amplified_event_results(team_id) where team_id is not null;
create index ppl_amplified_event_results_participant_idx
  on public.ppl_amplified_event_results(participant_id) where participant_id is not null;
create unique index ppl_amplified_event_results_team_version_unique
  on public.ppl_amplified_event_results(activity_id, result_version, team_id)
  where team_id is not null;
create unique index ppl_amplified_event_results_participant_version_unique
  on public.ppl_amplified_event_results(activity_id, result_version, participant_id)
  where participant_id is not null;

alter table public.ppl_amplified_event_results enable row level security;
revoke all privileges on table public.ppl_amplified_event_results from anon, authenticated;
grant select, insert, update, delete on table public.ppl_amplified_event_results to service_role;

comment on table public.ppl_amplified_event_results is
  'Versioned normalized results feeding the Play Amplified Event Hub. Only the latest result_version for each activity contributes to live standings.';
comment on column public.ppl_amplified_event_results.source is
  'Normalized adapter source. Game engines remain authoritative; Play Amplified Events consumes ranked outcomes through server routes.';

-- Existing hardening makes new public tables opt-in. Verify the new table follows the same server-only model.
do $verification$
begin
  if not has_table_privilege('service_role', 'public.ppl_amplified_event_results', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Play Amplified Event Hub service-role grants are incomplete.';
  end if;

  if has_table_privilege('anon', 'public.ppl_amplified_event_results', 'SELECT')
     or has_table_privilege('authenticated', 'public.ppl_amplified_event_results', 'SELECT')
  then
    raise exception 'Play Amplified Event Hub results are exposed to browser database roles.';
  end if;
end
$verification$;
