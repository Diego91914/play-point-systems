create function public.ppl_live_craps_commit_join(
  p_room_code text,
  p_expected_version bigint,
  p_command_id text,
  p_state jsonb,
  p_player_id text,
  p_token_hash text
)
returns table(applied boolean, version bigint, state jsonb)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text := upper(btrim(p_room_code));
  v_room public.ppl_live_craps_rooms%rowtype;
  v_existing bigint;
begin
  select * into v_room
  from public.ppl_live_craps_rooms
  where room_code = v_code and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'Live Craps room not found.';
  end if;

  select resulting_version into v_existing
  from public.ppl_live_craps_commands
  where room_code = v_code and command_id = p_command_id;

  if found then
    return query
      select false, r.version, r.state
      from public.ppl_live_craps_rooms r
      where r.room_code = v_code;
    return;
  end if;

  if v_room.version <> p_expected_version then
    raise exception 'LIVE_CRAPS_VERSION_CONFLICT';
  end if;

  if exists (
    select 1
    from public.ppl_live_craps_player_sessions
    where room_code = v_code and player_id = p_player_id
  ) then
    raise exception 'Live Craps player identity is already in use.';
  end if;

  update public.ppl_live_craps_rooms
  set state = p_state,
      version = version + 1,
      updated_at = clock_timestamp()
  where room_code = v_code
  returning ppl_live_craps_rooms.version, ppl_live_craps_rooms.state
  into v_existing, v_room.state;

  insert into public.ppl_live_craps_player_sessions (room_code, player_id, token_hash)
  values (v_code, p_player_id, p_token_hash);

  insert into public.ppl_live_craps_commands (room_code, command_id, resulting_version)
  values (v_code, p_command_id, v_existing);

  delete from public.ppl_live_craps_commands
  where room_code = v_code
    and created_at < clock_timestamp() - interval '8 hours';

  return query select true, v_existing, v_room.state;
end;
$$;

grant execute on function public.ppl_live_craps_commit_join(text, bigint, text, jsonb, text, text) to service_role;
