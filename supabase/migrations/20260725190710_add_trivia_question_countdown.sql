alter table public.ppl_trivia_sessions
  drop constraint ppl_trivia_sessions_phase_check,
  drop constraint ppl_trivia_sessions_state_check;

alter table public.ppl_trivia_sessions
  add constraint ppl_trivia_sessions_phase_check
    check (phase in ('lobby', 'wager-open', 'question-countdown', 'question-open', 'answer-reveal', 'completed')),
  add constraint ppl_trivia_sessions_state_check
    check (
      (status = 'lobby' and phase = 'lobby')
      or (status = 'in-progress' and phase in ('wager-open', 'question-countdown', 'question-open', 'answer-reveal'))
      or (status = 'completed' and phase = 'completed')
    );

create function public.ppl_trivia_sync_question_phase(p_session_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.ppl_trivia_sessions
  set phase = 'question-open',
      updated_at = clock_timestamp()
  where id = p_session_id
    and status = 'in-progress'
    and phase = 'question-countdown'
    and opened_at <= clock_timestamp()
    and expires_at > clock_timestamp();
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
      phase = 'question-countdown',
      opened_at = clock_timestamp() + interval '3 seconds',
      updated_at = clock_timestamp()
  where id = p_session_id;
end;
$$;

create or replace function public.ppl_trivia_advance_session(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
  v_card_count integer;
  v_next_card_index integer;
begin
  select * into v_session
  from public.ppl_trivia_sessions
  where id = p_session_id and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'That trivia room no longer exists.';
  end if;
  if v_session.status <> 'in-progress' or v_session.phase not in ('answer-reveal', 'wager-open') then
    raise exception 'Resolve the current question before advancing.';
  end if;

  if v_session.phase = 'wager-open' then
    update public.ppl_trivia_sessions
    set phase = 'question-countdown',
        opened_at = clock_timestamp() + interval '3 seconds',
        updated_at = clock_timestamp()
    where id = p_session_id;
    return;
  end if;

  v_card_count := jsonb_array_length(v_session.deck -> 'cards');
  if v_session.card_index >= v_card_count - 1 then
    update public.ppl_trivia_sessions
    set status = 'completed',
        phase = 'completed',
        card_index = v_card_count,
        opened_at = null,
        updated_at = clock_timestamp()
    where id = p_session_id;
  else
    v_next_card_index := v_session.card_index + 1;
    update public.ppl_trivia_sessions
    set card_index = v_next_card_index,
        phase = case when v_next_card_index = v_card_count - 1 then 'wager-open' else 'question-countdown' end,
        opened_at = case
          when v_next_card_index = v_card_count - 1 then null
          else clock_timestamp() + interval '3 seconds'
        end,
        resolution = null,
        updated_at = clock_timestamp()
    where id = p_session_id;
  end if;
end;
$$;

revoke execute on function public.ppl_trivia_sync_question_phase(uuid) from public, anon, authenticated;
grant execute on function public.ppl_trivia_sync_question_phase(uuid) to service_role;

comment on function public.ppl_trivia_sync_question_phase(uuid) is
  'Opens a scheduled trivia question once its synchronized three-second countdown has elapsed.';
