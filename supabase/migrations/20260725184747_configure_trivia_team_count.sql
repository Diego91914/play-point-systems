alter table public.ppl_trivia_sessions
  add column team_count smallint not null default 2;

update public.ppl_trivia_sessions as session
set team_count = least(8, greatest(2, ceil(player_totals.player_count / 2.0)::integer))
from (
  select session_id, count(*)::integer as player_count
  from public.ppl_trivia_players
  group by session_id
) as player_totals
where session.id = player_totals.session_id
  and session.game_mode = 'doubles';

update public.ppl_trivia_players as player
set team_id = (
  array['blue', 'gold', 'red', 'green', 'purple', 'orange', 'teal', 'pink']::text[]
)[1 + ((substring(player.team_id from 6)::integer - 1) % session.team_count)]
from public.ppl_trivia_sessions as session
where player.session_id = session.id
  and session.game_mode = 'doubles'
  and player.team_id ~ '^pair-[1-9][0-9]*$';

update public.ppl_trivia_sessions
set game_mode = 'teams'
where game_mode = 'doubles';

alter table public.ppl_trivia_sessions
  drop constraint ppl_trivia_sessions_game_mode_check,
  add constraint ppl_trivia_sessions_game_mode_check
    check (game_mode in ('individual', 'teams')),
  add constraint ppl_trivia_sessions_team_count_check
    check (team_count between 2 and 8);

alter table public.ppl_trivia_players
  drop constraint ppl_trivia_players_team_id_check,
  add constraint ppl_trivia_players_team_id_check
    check (
      team_id is null
      or team_id in ('blue', 'gold', 'red', 'green', 'purple', 'orange', 'teal', 'pink')
    );

drop function public.ppl_trivia_create_session_with_options(
  uuid, text, text, text, text, text, text, jsonb, text, timestamptz
);

create function public.ppl_trivia_create_session_with_options(
  p_session_id uuid,
  p_room_code text,
  p_category text,
  p_difficulty_filter text,
  p_pacing_mode text,
  p_game_mode text,
  p_team_count integer,
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
  if p_game_mode not in ('individual', 'teams') then
    raise exception 'A valid trivia game mode is required.';
  end if;
  if p_team_count < 2 or p_team_count > 8 then
    raise exception 'Team count must be between 2 and 8.';
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
  set game_mode = p_game_mode,
      team_count = p_team_count
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
    select team.id
    into v_team_id
    from unnest(array['blue', 'gold', 'red', 'green', 'purple', 'orange', 'teal', 'pink']::text[])
      with ordinality as team(id, position)
    left join public.ppl_trivia_players as player
      on player.session_id = v_session.id
      and player.team_id = team.id
    where team.position <= v_session.team_count
    group by team.id, team.position
    order by count(player.id), team.position
    limit 1;
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
  elsif v_session.game_mode = 'teams' and v_player_count < v_session.team_count then
    raise exception 'At least % players must join so every team has a player.', v_session.team_count;
  end if;

  update public.ppl_trivia_sessions
  set status = 'in-progress',
      phase = 'question-open',
      opened_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_session_id;
end;
$$;

revoke execute on function public.ppl_trivia_create_session_with_options(
  uuid, text, text, text, text, text, integer, text, jsonb, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.ppl_trivia_create_session_with_options(
  uuid, text, text, text, text, text, integer, text, jsonb, text, timestamptz
) to service_role;

comment on column public.ppl_trivia_sessions.game_mode is
  'Scoring format: individual players or host-configured teams.';
comment on column public.ppl_trivia_sessions.team_count is
  'Number of active teams for team rooms, from 2 through 8.';
comment on column public.ppl_trivia_players.team_id is
  'Server-assigned team identity. Null for individual rooms.';
