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

-- Requires the persistence, scoring-table, and atomic-lifecycle migrations.
-- Share the lifecycle RPC's event-row lock so completion freezes all scoring.
create function public.ppl_amplified_event_score(
  p_action text, p_event_id uuid, p_owner_user_id text, p_payload jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_event public.ppl_amplified_events%rowtype;
  v_activity_id uuid;
  v_version integer;
begin
  select * into v_event from public.ppl_amplified_events
    where id = p_event_id and owner_user_id = p_owner_user_id for update;
  if v_event.id is null then
    raise sqlstate 'PT404' using message = 'Event not found.';
  end if;
  if v_event.status <> 'live' then
    raise sqlstate 'PT409' using message = 'Only a live event can be scored or completed.';
  end if;

  if p_action = 'complete' then
    if not exists (select 1 from public.ppl_amplified_event_activities where event_id = p_event_id)
      or exists (select 1 from public.ppl_amplified_event_activities a where a.event_id = p_event_id
        and (a.status <> 'complete' or not exists (
          select 1 from public.ppl_amplified_event_results r where r.activity_id = a.id and r.event_id = p_event_id))) then
      raise sqlstate 'PT409' using message = 'Finish scoring every activity before completing the event.';
    end if;
    update public.ppl_amplified_events set status = 'complete', registration_open = false,
      completed_at = now(), updated_at = now() where id = p_event_id;
    return '{}'::jsonb;
  elsif p_action <> 'score' then
    raise sqlstate 'PT400' using message = 'Unknown scoring operation.';
  end if;

  v_activity_id := (p_payload->>'activityId')::uuid;
  if not exists (select 1 from public.ppl_amplified_event_activities where id = v_activity_id and event_id = p_event_id) then
    raise sqlstate 'PT404' using message = 'Activity not found for this event.';
  end if;
  if coalesce(jsonb_array_length(p_payload->'entries'), 0) = 0 then
    raise sqlstate 'PT400' using message = 'Enter at least one ranked result.';
  end if;
  if exists (select 1 from jsonb_array_elements(p_payload->'entries') entry where
    case entry->>'entityType'
      when 'team' then not exists (select 1 from public.ppl_amplified_event_teams t
        where t.id = (entry->>'entityId')::uuid and t.event_id = p_event_id)
      when 'participant' then not exists (select 1 from public.ppl_amplified_event_participants p
        join public.ppl_amplified_event_team_members m on m.participant_id = p.id
        join public.ppl_amplified_event_teams t on t.id = m.team_id
        where p.id = (entry->>'entityId')::uuid and p.event_id = p_event_id and t.event_id = p_event_id)
      else true end) then
    raise sqlstate 'PT400' using message = 'Ranked entries must belong to the event and its locked teams.';
  end if;

  select coalesce(max(result_version), 0) + 1 into v_version
    from public.ppl_amplified_event_results where activity_id = v_activity_id;
  insert into public.ppl_amplified_event_results(event_id, activity_id, result_version,
    entity_type, team_id, participant_id, placement, raw_score, score_label, event_points, source, source_ref, metadata)
    select p_event_id, v_activity_id, v_version, entry->>'entityType',
      case when entry->>'entityType' = 'team' then (entry->>'entityId')::uuid end,
      case when entry->>'entityType' = 'participant' then (entry->>'entityId')::uuid end,
      (entry->>'placement')::integer, (entry->>'rawScore')::numeric, entry->>'scoreLabel',
      case (entry->>'placement')::integer when 1 then 10 when 2 then 7 when 3 then 5
        when 4 then 3 when 5 then 2 when 6 then 1 else 0 end,
      p_payload->>'source', entry->>'sourceRef', coalesce(entry->'metadata', '{}'::jsonb)
    from jsonb_array_elements(p_payload->'entries') entry;
  update public.ppl_amplified_event_activities set status = 'complete', updated_at = now()
    where id = v_activity_id and event_id = p_event_id;
  return jsonb_build_object('resultVersion', v_version);
end
$$;

revoke all on function public.ppl_amplified_event_score(text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.ppl_amplified_event_score(text, uuid, text, jsonb) to service_role;
