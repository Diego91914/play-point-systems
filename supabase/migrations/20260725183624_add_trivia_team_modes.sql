alter table public.ppl_trivia_sessions
  add column game_mode text not null default 'individual';

alter table public.ppl_trivia_sessions
  add constraint ppl_trivia_sessions_game_mode_check
  check (game_mode in ('individual', 'teams', 'doubles'));

alter table public.ppl_trivia_players
  add column team_id text;

alter table public.ppl_trivia_players
  add constraint ppl_trivia_players_team_id_check
  check (
    team_id is null
    or team_id in ('blue', 'gold')
    or team_id ~ '^pair-[1-9][0-9]*$'
  );

create function public.ppl_trivia_create_session_with_options(
  p_session_id uuid,
  p_room_code text,
  p_category text,
  p_difficulty_filter text,
  p_pacing_mode text,
  p_game_mode text,
  p_random_seed text,
  p_deck jsonb,
  p_host_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if p_game_mode not in ('individual', 'teams', 'doubles') then
    raise exception 'A valid trivia game mode is required.';
  end if;

  v_session_id := public.ppl_trivia_create_session_with_pacing(
    p_session_id,
    p_room_code,
    p_category,
    p_difficulty_filter,
    p_pacing_mode,
    p_random_seed,
    p_deck,
    p_host_token_hash,
    p_expires_at
  );

  update public.ppl_trivia_sessions
  set game_mode = p_game_mode
  where id = v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.ppl_trivia_join_room(
  p_room_code text,
  p_player_id uuid,
  p_player_name text,
  p_token_hash text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
  v_player_count integer;
  v_blue_count integer;
  v_gold_count integer;
  v_team_id text;
begin
  select *
  into v_session
  from public.ppl_trivia_sessions
  where room_code = upper(btrim(p_room_code))
    and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'That room code was not found.';
  end if;
  if v_session.status <> 'lobby' then
    raise exception 'That room has already started.';
  end if;

  select count(*)::integer into v_player_count
  from public.ppl_trivia_players
  where session_id = v_session.id;

  if v_player_count >= 100 then
    raise exception 'That room has reached its 100-player limit.';
  end if;

  if v_session.game_mode = 'teams' then
    select
      count(*) filter (where team_id = 'blue')::integer,
      count(*) filter (where team_id = 'gold')::integer
    into v_blue_count, v_gold_count
    from public.ppl_trivia_players
    where session_id = v_session.id;

    v_team_id := case when v_blue_count <= v_gold_count then 'blue' else 'gold' end;
  elsif v_session.game_mode = 'doubles' then
    v_team_id := 'pair-' || ((v_player_count / 2) + 1)::text;
  else
    v_team_id := null;
  end if;

  insert into public.ppl_trivia_players (id, session_id, name, token_hash, team_id)
  values (p_player_id, v_session.id, btrim(p_player_name), p_token_hash, v_team_id);

  update public.ppl_trivia_sessions
  set updated_at = clock_timestamp()
  where id = v_session.id;

  return v_session.id;
exception
  when unique_violation then
    raise exception 'That player name is already in the room.';
end;
$$;

create or replace function public.ppl_trivia_start_session(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
  v_player_count integer;
begin
  select * into v_session
  from public.ppl_trivia_sessions
  where id = p_session_id and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'That trivia room no longer exists.';
  end if;
  if v_session.status <> 'lobby' then
    raise exception 'That room has already started.';
  end if;

  select count(*)::integer into v_player_count
  from public.ppl_trivia_players
  where session_id = p_session_id;

  if v_session.game_mode = 'individual' and v_player_count < 1 then
    raise exception 'At least one player must join before the room can start.';
  elsif v_session.game_mode = 'teams' and v_player_count < 2 then
    raise exception 'At least two players must join a team room.';
  elsif v_session.game_mode = 'doubles' and (v_player_count < 2 or v_player_count % 2 <> 0) then
    raise exception 'Doubles requires an even number of players and at least one complete pair.';
  end if;

  update public.ppl_trivia_sessions
  set status = 'in-progress',
      phase = 'question-open',
      opened_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_session_id;
end;
$$;

revoke execute on function public.ppl_trivia_create_session_with_options(uuid, text, text, text, text, text, text, jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function public.ppl_trivia_create_session_with_options(uuid, text, text, text, text, text, text, jsonb, text, timestamptz) to service_role;

comment on column public.ppl_trivia_sessions.game_mode is
  'Scoring format: individual players, two large teams, or join-order doubles.';
comment on column public.ppl_trivia_players.team_id is
  'Server-assigned team identity. Null for individual rooms.';
