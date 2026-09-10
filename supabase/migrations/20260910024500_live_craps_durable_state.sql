create table public.ppl_live_craps_rooms (
  room_code text primary key,
  state jsonb not null,
  version bigint not null default 1,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '8 hours'),
  constraint ppl_live_craps_rooms_code_check
    check (room_code ~ '^[A-Z0-9]{4,8}$'),
  constraint ppl_live_craps_rooms_version_check check (version >= 1),
  constraint ppl_live_craps_rooms_state_check check (jsonb_typeof(state) = 'object'),
  constraint ppl_live_craps_rooms_expiry_check check (expires_at > created_at)
);

create index ppl_live_craps_rooms_expires_at_idx
  on public.ppl_live_craps_rooms (expires_at);

create table public.ppl_live_craps_player_sessions (
  room_code text not null references public.ppl_live_craps_rooms(room_code) on delete cascade,
  player_id text not null,
  token_hash text not null,
  created_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  primary key (room_code, player_id),
  constraint ppl_live_craps_player_id_check check (char_length(btrim(player_id)) between 1 and 100),
  constraint ppl_live_craps_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$')
);

create table public.ppl_live_craps_commands (
  room_code text not null references public.ppl_live_craps_rooms(room_code) on delete cascade,
  command_id text not null,
  resulting_version bigint not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (room_code, command_id),
  constraint ppl_live_craps_command_id_check check (char_length(btrim(command_id)) between 1 and 160),
  constraint ppl_live_craps_command_version_check check (resulting_version >= 1)
);

create index ppl_live_craps_commands_created_idx
  on public.ppl_live_craps_commands (created_at);

alter table public.ppl_live_craps_rooms enable row level security;
alter table public.ppl_live_craps_player_sessions enable row level security;
alter table public.ppl_live_craps_commands enable row level security;

revoke all on table public.ppl_live_craps_rooms from public, anon, authenticated;
revoke all on table public.ppl_live_craps_player_sessions from public, anon, authenticated;
revoke all on table public.ppl_live_craps_commands from public, anon, authenticated;

grant select, insert, update, delete on table public.ppl_live_craps_rooms to service_role;
grant select, insert, update, delete on table public.ppl_live_craps_player_sessions to service_role;
grant select, insert, update, delete on table public.ppl_live_craps_commands to service_role;

create function public.ppl_live_craps_create_room(
  p_room_code text,
  p_state jsonb,
  p_token_hash text,
  p_player_id text,
  p_expires_at timestamptz
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text := upper(btrim(p_room_code));
begin
  delete from public.ppl_live_craps_rooms where expires_at <= clock_timestamp();

  insert into public.ppl_live_craps_rooms (room_code, state, version, expires_at)
  values (v_code, p_state, 1, p_expires_at);

  insert into public.ppl_live_craps_player_sessions (room_code, player_id, token_hash)
  values (v_code, p_player_id, p_token_hash);

  return 1;
exception
  when unique_violation then
    raise exception 'Live Craps room code is already in use.';
end;
$$;

create function public.ppl_live_craps_commit_command(
  p_room_code text,
  p_expected_version bigint,
  p_command_id text,
  p_state jsonb
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

  update public.ppl_live_craps_rooms
  set state = p_state,
      version = version + 1,
      updated_at = clock_timestamp()
  where room_code = v_code
  returning ppl_live_craps_rooms.version, ppl_live_craps_rooms.state
  into v_existing, v_room.state;

  insert into public.ppl_live_craps_commands (room_code, command_id, resulting_version)
  values (v_code, p_command_id, v_existing);

  delete from public.ppl_live_craps_commands
  where room_code = v_code
    and created_at < clock_timestamp() - interval '8 hours';

  return query select true, v_existing, v_room.state;
end;
$$;

create function public.ppl_live_craps_add_player_session(
  p_room_code text,
  p_player_id text,
  p_token_hash text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text := upper(btrim(p_room_code));
begin
  perform 1
  from public.ppl_live_craps_rooms
  where room_code = v_code and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'Live Craps room not found.';
  end if;

  insert into public.ppl_live_craps_player_sessions (room_code, player_id, token_hash)
  values (v_code, p_player_id, p_token_hash);
exception
  when unique_violation then
    raise exception 'Live Craps player identity is already in use.';
end;
$$;

create function public.ppl_live_craps_touch_player_session(
  p_room_code text,
  p_player_id text,
  p_token_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.ppl_live_craps_player_sessions
  set last_seen_at = clock_timestamp()
  where room_code = upper(btrim(p_room_code))
    and player_id = p_player_id
    and token_hash = p_token_hash;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

grant execute on function public.ppl_live_craps_create_room(text, jsonb, text, text, timestamptz) to service_role;
grant execute on function public.ppl_live_craps_commit_command(text, bigint, text, jsonb) to service_role;
grant execute on function public.ppl_live_craps_add_player_session(text, text, text) to service_role;
grant execute on function public.ppl_live_craps_touch_player_session(text, text, text) to service_role;
