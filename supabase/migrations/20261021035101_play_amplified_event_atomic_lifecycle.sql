-- All event mutations take the same row lock before checking lifecycle state.
-- SECURITY INVOKER: only the server service role may execute this RPC.
create function public.ppl_amplified_event_mutate(
  p_action text, p_event_id uuid, p_owner_user_id text, p_payload jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_event public.ppl_amplified_events%rowtype;
  v_player public.ppl_amplified_event_participants%rowtype;
  v_team jsonb;
  v_team_id uuid;
  v_member uuid;
  v_ids uuid[];
  v_count integer;
  v_matches integer;
  v_order integer := 0;
  v_name text;
begin
  if p_action = 'create' then
    if nullif(p_owner_user_id, '') is null then
      raise sqlstate 'PT401' using message = 'Sign in to create an event.';
    end if;
    insert into public.ppl_amplified_events(owner_user_id, template_id, name, event_date, team_count)
      values (p_owner_user_id, p_payload->>'templateId', p_payload->>'name',
        (p_payload->>'eventDate')::date, (p_payload->>'teamCount')::integer)
      returning * into v_event;
  elsif p_action = 'join' then
    select * into v_event from public.ppl_amplified_events
      where join_code = p_payload->>'code' for update;
  else
    select * into v_event from public.ppl_amplified_events
      where id = p_event_id and owner_user_id = p_owner_user_id for update;
  end if;
  if v_event.id is null then
    raise sqlstate 'PT404' using message = 'Event not found.';
  end if;

  if p_action in ('create', 'save') then
    if v_event.status <> 'draft' then
      raise sqlstate 'PT409' using message = 'Published events are locked for registration.';
    end if;
    update public.ppl_amplified_events set
      template_id = p_payload->>'templateId', name = p_payload->>'name',
      event_date = (p_payload->>'eventDate')::date,
      team_count = (p_payload->>'teamCount')::integer, updated_at = now()
      where id = v_event.id;
    delete from public.ppl_amplified_event_participants where event_id = v_event.id and source = 'organizer';
    delete from public.ppl_amplified_event_activities where event_id = v_event.id;
    insert into public.ppl_amplified_event_participants(event_id, display_name, skill, source, checked_in)
      select v_event.id, item->>'name', (item->>'skill')::smallint, 'organizer', false
      from jsonb_array_elements(p_payload->'participants') item;
    insert into public.ppl_amplified_event_activities(event_id, module_id, name, sort_order)
      select v_event.id, item->>'moduleId', item->>'label', (item->>'order')::integer
      from jsonb_array_elements(p_payload->'activities') item;
  elsif p_action = 'publish' then
    if v_event.status not in ('draft', 'published') then
      raise sqlstate 'PT409' using message = 'This event is already live or closed.';
    end if;
    update public.ppl_amplified_events set status = 'published',
      join_code = coalesce(v_event.join_code, p_payload->>'joinCode'),
      registration_open = true, published_at = coalesce(published_at, now()), updated_at = now()
      where id = v_event.id;
  elsif p_action = 'join' then
    if v_event.status <> 'published' or not v_event.registration_open then
      raise sqlstate 'PT409' using message = 'Registration is closed for this event.';
    end if;
    v_name := left(trim(regexp_replace(p_payload->>'name', '\s+', ' ', 'g')), 100);
    if coalesce(v_name, '') = '' then
      raise sqlstate 'PT400' using message = 'Enter your name to join the event.';
    end if;
    -- Literal, case-insensitive equality; percent and underscore are ordinary names.
    select count(*) into v_matches from public.ppl_amplified_event_participants
      where event_id = v_event.id and lower(display_name) = lower(v_name);
    if v_matches = 1 then
      update public.ppl_amplified_event_participants set checked_in = true, updated_at = now()
        where event_id = v_event.id and lower(display_name) = lower(v_name) returning * into v_player;
    else
      insert into public.ppl_amplified_event_participants(event_id, display_name, skill, source, checked_in)
        values (v_event.id, v_name, 3, 'qr', true) returning * into v_player;
    end if;
    return jsonb_build_object('player', jsonb_build_object('id', v_player.id,
      'display_name', v_player.display_name, 'skill', v_player.skill,
      'source', v_player.source, 'checked_in', v_player.checked_in), 'matched', v_matches = 1);
  elsif p_action = 'start' then
    if v_event.status <> 'published' then
      raise sqlstate 'PT409' using message = 'Publish the event and finish registration before starting.';
    end if;
    if coalesce(jsonb_array_length(p_payload->'teams'), 0) not between 1 and 32 then
      raise sqlstate 'PT400' using message = 'Balance at least one team before starting the event.';
    end if;
    select array_agg(member::uuid) into v_ids
      from jsonb_array_elements(p_payload->'teams') team,
        jsonb_array_elements_text(team->'participantIds') member;
    select count(*) into v_count from public.ppl_amplified_event_participants where event_id = v_event.id;
    if coalesce(cardinality(v_ids), 0) <> v_count
      or (select count(distinct id) from unnest(v_ids) id) <> coalesce(cardinality(v_ids), 0)
      or exists (select 1 from unnest(v_ids) id where not exists (
        select 1 from public.ppl_amplified_event_participants p where p.id = id and p.event_id = v_event.id)) then
      raise sqlstate 'PT400' using message = 'Every registered participant must appear on exactly one team before the event can start.';
    end if;
    delete from public.ppl_amplified_event_teams where event_id = v_event.id;
    for v_team in select value from jsonb_array_elements(p_payload->'teams') loop
      v_order := v_order + 1;
      insert into public.ppl_amplified_event_teams(event_id, name, sort_order, total_skill)
        values (v_event.id, v_team->>'name', v_order, coalesce((select sum(skill)
          from public.ppl_amplified_event_participants where id in (
            select value::uuid from jsonb_array_elements_text(v_team->'participantIds'))), 0))
        returning id into v_team_id;
      for v_member in select value::uuid from jsonb_array_elements_text(v_team->'participantIds') loop
        insert into public.ppl_amplified_event_team_members(team_id, participant_id) values (v_team_id, v_member);
      end loop;
    end loop;
    update public.ppl_amplified_events set status = 'live', registration_open = false,
      started_at = now(), updated_at = now() where id = v_event.id;
  else
    raise sqlstate 'PT400' using message = 'Unknown event operation.';
  end if;
  return jsonb_build_object('id', v_event.id);
end
$$;

revoke all on function public.ppl_amplified_event_mutate(text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.ppl_amplified_event_mutate(text, uuid, text, jsonb) to service_role;
