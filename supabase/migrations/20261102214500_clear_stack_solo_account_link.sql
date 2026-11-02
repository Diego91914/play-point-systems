-- Only Solo results can be linked confidently to the authenticated host.
-- Multiplayer names are manually entered by hosts and must not be treated as
-- account-owned scores without separate player account verification.
create or replace function public.ppl_clear_stack_capture_scores()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.game_state->>'phase' <> 'finished'
     or new.host_session_id is null
     or new.spectator_token is null
     or jsonb_typeof(new.game_state->'players') <> 'array'
  then return new; end if;
  if tg_op = 'UPDATE' and old.game_state->>'phase' = 'finished' then return new; end if;
  insert into public.ppl_clear_stack_scores (
    source_room_id, finish_version, player_index, host_key, account_key,
    player_name, distance, stack_size, score, remaining, rounds, played_at, is_ranked
  )
  select new.id, new.state_version, (p.ordinality-1)::integer, new.host_session_id,
    case when jsonb_array_length(new.game_state->'players') = 1
      and new.host_session_id <> 'builder-access' then new.host_session_id else null end,
    left(coalesce(nullif(btrim(p.value->>'name'), ''),'Player'),50),
    new.distance,new.stack_size,(p.value->>'score')::numeric(8,1),
    (p.value->>'remaining')::integer,coalesce(p.value->'rounds','[]'::jsonb),
    now(),new.host_session_id <> 'builder-access'
  from jsonb_array_elements(new.game_state->'players') with ordinality as p(value, ordinality)
  on conflict (source_room_id,finish_version,player_index) do nothing;
  return new;
end;
$$;
update public.ppl_clear_stack_scores as s
set account_key = null
where s.account_key is not null
  and exists (
    select 1 from public.ppl_clear_stack_scores as other
    where other.source_room_id=s.source_room_id and other.finish_version=s.finish_version
      and other.player_index<>s.player_index
  );
