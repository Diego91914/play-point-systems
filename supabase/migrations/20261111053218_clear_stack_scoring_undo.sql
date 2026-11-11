-- Durable, auditable Clear the Stack score actions and atomic undo.
-- Scoring remains computed by the server engine; this RPC serializes the
-- compare-and-swap, state write, action log, and leaderboard correction.

alter table public.ppl_clear_stack_rooms
  add column if not exists scoring_run_id uuid;

create table if not exists public.ppl_clear_stack_score_actions (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.ppl_clear_stack_rooms(id) on delete cascade,
  action_id uuid not null,
  action_type text not null check (action_type in ('score', 'undo')),
  discs_made integer,
  game_run_id uuid,
  target_action_id uuid,
  result_version integer not null check (result_version > 0),
  before_state jsonb not null,
  after_state jsonb not null,
  before_status text not null,
  after_status text not null,
  undone_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, action_id),
  unique (room_id, result_version),
  foreign key (room_id, target_action_id)
    references public.ppl_clear_stack_score_actions (room_id, action_id),
  check ((action_type = 'undo') = (target_action_id is not null)),
  check ((action_type = 'score') = (discs_made is not null)),
  check (discs_made is null or discs_made >= 0)
);

create index if not exists ppl_clear_stack_score_actions_latest_idx
  on public.ppl_clear_stack_score_actions (room_id, game_run_id, result_version desc)
  where action_type = 'score' and undone_at is null;

alter table public.ppl_clear_stack_score_actions enable row level security;
revoke all on public.ppl_clear_stack_score_actions from public, anon, authenticated;
revoke all on sequence public.ppl_clear_stack_score_actions_id_seq from public, anon, authenticated;
grant select, insert, update, delete on public.ppl_clear_stack_score_actions to service_role;
grant usage, select, update on sequence public.ppl_clear_stack_score_actions_id_seq to service_role;

create or replace function public.ppl_clear_stack_commit_score(
  p_room_id uuid,
  p_host_session_id text,
  p_expected_version integer,
  p_action_id uuid,
  p_discs_made integer,
  p_next_state jsonb,
  p_next_status text
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_room public.ppl_clear_stack_rooms%rowtype;
  v_duplicate public.ppl_clear_stack_score_actions%rowtype;
begin
  select * into v_room
  from public.ppl_clear_stack_rooms
  where id = p_room_id and host_session_id = p_host_session_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Host room not found.', 'status', 404);
  end if;
  if v_room.status = 'closed' then
    return jsonb_build_object('ok', false, 'error', 'This game has been formally ended.', 'status', 409);
  end if;

  select * into v_duplicate from public.ppl_clear_stack_score_actions
  where room_id = p_room_id and action_id = p_action_id;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true,
      'room', to_jsonb(v_room));
  end if;
  if v_room.state_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'error', 'Game updated elsewhere. Refresh before scoring again.', 'status', 409,
      'room', to_jsonb(v_room));
  end if;
  if v_room.status not in ('playing', 'finished') then
    return jsonb_build_object('ok', false, 'error', 'Game is not in progress.', 'status', 409,
      'room', to_jsonb(v_room));
  end if;
  if p_next_status not in ('playing', 'finished') then
    return jsonb_build_object('ok', false, 'error', 'Invalid scoring status.', 'status', 400,
      'room', to_jsonb(v_room));
  end if;
  if p_discs_made is null or p_discs_made < 0 then
    return jsonb_build_object('ok', false, 'error', 'Invalid disc count.', 'status', 400,
      'room', to_jsonb(v_room));
  end if;

  update public.ppl_clear_stack_rooms
  set game_state = p_next_state, status = p_next_status,
      state_version = p_expected_version + 1, updated_at = now()
  where id = p_room_id;

  insert into public.ppl_clear_stack_score_actions (
    room_id, action_id, action_type, discs_made, game_run_id, result_version,
    before_state, after_state, before_status, after_status
  ) values (
    p_room_id, p_action_id, 'score', p_discs_made, v_room.scoring_run_id, p_expected_version + 1,
    v_room.game_state, p_next_state, v_room.status, p_next_status
  );

  select * into v_room from public.ppl_clear_stack_rooms where id = p_room_id;
  return jsonb_build_object('ok', true, 'duplicate', false, 'room', to_jsonb(v_room));
end;
$$;

create or replace function public.ppl_clear_stack_undo_score(
  p_room_id uuid,
  p_host_session_id text,
  p_expected_version integer,
  p_action_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_room public.ppl_clear_stack_rooms%rowtype;
  v_duplicate public.ppl_clear_stack_score_actions%rowtype;
  v_target public.ppl_clear_stack_score_actions%rowtype;
begin
  select * into v_room
  from public.ppl_clear_stack_rooms
  where id = p_room_id and host_session_id = p_host_session_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Host room not found.', 'status', 404);
  end if;

  select * into v_duplicate from public.ppl_clear_stack_score_actions
  where room_id = p_room_id and action_id = p_action_id;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true,
      'room', to_jsonb(v_room));
  end if;
  if v_room.status = 'closed' then
    return jsonb_build_object('ok', false, 'error', 'This game has been formally ended. Undo is unavailable.', 'status', 409,
      'room', to_jsonb(v_room));
  end if;
  if v_room.state_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'error', 'Game updated elsewhere. Refresh before undoing.', 'status', 409,
      'room', to_jsonb(v_room));
  end if;

  select * into v_target
  from public.ppl_clear_stack_score_actions
  where room_id = p_room_id
    and game_run_id is not distinct from v_room.scoring_run_id
    and action_type = 'score' and undone_at is null
  order by result_version desc
  limit 1;

  if not found or v_target.after_state is distinct from v_room.game_state
    or v_target.after_status is distinct from v_room.status then
    return jsonb_build_object('ok', false, 'error', 'The latest score can no longer be safely undone. Game state was refreshed.', 'status', 409,
      'room', to_jsonb(v_room));
  end if;

  -- A match-completing score is not final until the host formally ends the
  -- room. Remove only the leaderboard rows produced by this exact finish CAS.
  if v_target.after_status = 'finished' then
    delete from public.ppl_clear_stack_scores
    where source_room_id = p_room_id and finish_version = v_target.result_version;
  end if;

  update public.ppl_clear_stack_rooms
  set game_state = v_target.before_state, status = v_target.before_status,
      state_version = p_expected_version + 1, updated_at = now()
  where id = p_room_id;

  update public.ppl_clear_stack_score_actions
  set undone_at = now()
  where id = v_target.id;

  insert into public.ppl_clear_stack_score_actions (
    room_id, action_id, action_type, game_run_id, target_action_id, result_version,
    before_state, after_state, before_status, after_status
  ) values (
    p_room_id, p_action_id, 'undo', v_room.scoring_run_id, v_target.action_id,
    p_expected_version + 1, v_room.game_state, v_target.before_state, v_room.status, v_target.before_status
  );

  select * into v_room from public.ppl_clear_stack_rooms where id = p_room_id;
  return jsonb_build_object('ok', true, 'duplicate', false, 'undone_action_id', v_target.action_id,
    'room', to_jsonb(v_room));
end;
$$;

revoke all on function public.ppl_clear_stack_commit_score(uuid, text, integer, uuid, integer, jsonb, text) from public, anon, authenticated;
revoke all on function public.ppl_clear_stack_undo_score(uuid, text, integer, uuid) from public, anon, authenticated;
grant execute on function public.ppl_clear_stack_commit_score(uuid, text, integer, uuid, integer, jsonb, text) to service_role;
grant execute on function public.ppl_clear_stack_undo_score(uuid, text, integer, uuid) to service_role;
