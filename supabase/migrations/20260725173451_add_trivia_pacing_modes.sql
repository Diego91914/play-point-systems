-- Add host-selected pacing without changing the existing session-creation RPC.
alter table public.ppl_trivia_sessions
  add column pacing_mode text not null default 'standard';

alter table public.ppl_trivia_sessions
  add constraint ppl_trivia_sessions_pacing_mode_check
  check (pacing_mode in ('standard', 'relaxed'));

create function public.ppl_trivia_create_session_with_pacing(
  p_session_id uuid,
  p_room_code text,
  p_category text,
  p_difficulty_filter text,
  p_pacing_mode text,
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
  if p_pacing_mode not in ('standard', 'relaxed') then
    raise exception 'A valid trivia pacing mode is required.';
  end if;

  v_session_id := public.ppl_trivia_create_session(
    p_session_id,
    p_room_code,
    p_category,
    p_difficulty_filter,
    p_random_seed,
    p_deck,
    p_host_token_hash,
    p_expires_at
  );

  update public.ppl_trivia_sessions
  set pacing_mode = p_pacing_mode
  where id = v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.ppl_trivia_submit_answer(
  p_session_id uuid,
  p_player_id uuid,
  p_response text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
  v_card jsonb;
  v_correct_choice jsonb;
  v_response_text text;
  v_now timestamptz := clock_timestamp();
  v_response_time_ms integer;
  v_timer_ms integer;
begin
  select * into v_session
  from public.ppl_trivia_sessions
  where id = p_session_id and expires_at > v_now
  for update;

  if not found then
    raise exception 'That trivia room no longer exists.';
  end if;
  if v_session.status <> 'in-progress' or v_session.phase <> 'question-open' then
    raise exception 'That room is not currently accepting answers.';
  end if;
  if p_response not in ('A', 'B', 'C', 'D', 'skip') then
    raise exception 'A valid response is required.';
  end if;
  if not exists (
    select 1 from public.ppl_trivia_players
    where session_id = p_session_id and id = p_player_id
  ) then
    raise exception 'That player is not in the room.';
  end if;

  v_timer_ms := case when v_session.pacing_mode = 'relaxed' then 20000 else 10000 end;
  v_response_time_ms := greatest(
    0,
    floor(extract(epoch from (v_now - v_session.opened_at)) * 1000)::integer
  );
  if v_response_time_ms >= v_timer_ms then
    raise exception 'Time expired for this question.';
  end if;

  v_card := v_session.deck -> 'cards' -> v_session.card_index;
  select choice into v_correct_choice
  from jsonb_array_elements(v_card -> 'choices') as choice
  where (choice ->> 'isCorrect')::boolean
  limit 1;

  if p_response = 'skip' then
    v_response_text := 'Skip';
  else
    select choice ->> 'text' into v_response_text
    from jsonb_array_elements(v_card -> 'choices') as choice
    where choice ->> 'slot' = p_response
    limit 1;
  end if;

  insert into public.ppl_trivia_answers (
    session_id,
    player_id,
    card_index,
    response,
    response_text,
    outcome,
    submitted_at,
    response_time_ms
  ) values (
    p_session_id,
    p_player_id,
    v_session.card_index,
    p_response,
    coalesce(v_response_text, p_response),
    case
      when p_response = 'skip' then 'skip'
      when p_response = v_correct_choice ->> 'slot' then 'correct'
      else 'wrong'
    end,
    v_now,
    v_response_time_ms
  );

  update public.ppl_trivia_sessions
  set updated_at = v_now
  where id = p_session_id;
exception
  when unique_violation then
    raise exception 'This player already locked an answer for the current question.';
end;
$$;

create or replace function public.ppl_trivia_resolve_session(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
  v_card jsonb;
  v_correct_choice jsonb;
  v_correct_points integer;
  v_points_drop_per_second integer;
  v_timer_ms integer;
  v_resolution jsonb;
begin
  select * into v_session
  from public.ppl_trivia_sessions
  where id = p_session_id and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'That trivia room no longer exists.';
  end if;
  if v_session.status <> 'in-progress' or v_session.phase <> 'question-open' then
    raise exception 'There is no active question to resolve.';
  end if;

  v_card := v_session.deck -> 'cards' -> v_session.card_index;
  v_correct_points := (v_card -> 'scoring' ->> 'correct')::integer;
  v_timer_ms := case when v_session.pacing_mode = 'relaxed' then 20000 else 10000 end;
  v_points_drop_per_second := ceil(v_correct_points::numeric / (v_timer_ms / 1000))::integer;
  select choice into v_correct_choice
  from jsonb_array_elements(v_card -> 'choices') as choice
  where (choice ->> 'isCorrect')::boolean
  limit 1;

  insert into public.ppl_trivia_answers (
    session_id,
    player_id,
    card_index,
    response,
    response_text,
    outcome,
    submitted_at,
    response_time_ms
  )
  select p_session_id, player.id, v_session.card_index, 'skip', 'Skip', 'skip', null, null
  from public.ppl_trivia_players as player
  where player.session_id = p_session_id
  on conflict (session_id, card_index, player_id) do nothing;

  update public.ppl_trivia_answers
  set delta = case
        when outcome = 'correct' then greatest(
          0,
          v_correct_points
            - floor(least(coalesce(response_time_ms, v_timer_ms), v_timer_ms) / 1000.0)::integer
              * v_points_drop_per_second
        )
        else 0
      end,
      speed_bonus = 0
  where session_id = p_session_id
    and card_index = v_session.card_index;

  update public.ppl_trivia_players as player
  set score = player.score + answer.delta,
      correct_count = player.correct_count + case when answer.outcome = 'correct' then 1 else 0 end,
      wrong_count = player.wrong_count + case when answer.outcome = 'wrong' then 1 else 0 end,
      skipped_count = player.skipped_count + case when answer.outcome = 'skip' then 1 else 0 end,
      updated_at = clock_timestamp()
  from public.ppl_trivia_answers as answer
  where player.session_id = p_session_id
    and answer.session_id = p_session_id
    and answer.card_index = v_session.card_index
    and answer.player_id = player.id;

  select jsonb_build_object(
    'card', v_card,
    'correctSlot', v_correct_choice ->> 'slot',
    'correctText', v_correct_choice ->> 'text',
    'rows', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'playerId', player.id,
          'playerName', player.name,
          'response', answer.response,
          'responseText', answer.response_text,
          'outcome', answer.outcome,
          'submittedAtMs', case
            when answer.submitted_at is null then null
            else floor(extract(epoch from answer.submitted_at) * 1000)::bigint
          end,
          'responseTimeMs', answer.response_time_ms,
          'delta', answer.delta,
          'speedBonus', answer.speed_bonus,
          'nextScore', player.score
        )
        order by player.joined_at, player.id
      ),
      '[]'::jsonb
    )
  ) into v_resolution
  from public.ppl_trivia_players as player
  join public.ppl_trivia_answers as answer
    on answer.session_id = player.session_id
   and answer.player_id = player.id
   and answer.card_index = v_session.card_index
  where player.session_id = p_session_id;

  update public.ppl_trivia_sessions
  set phase = 'answer-reveal',
      resolution = v_resolution,
      updated_at = clock_timestamp()
  where id = p_session_id;
end;
$$;

revoke execute on function public.ppl_trivia_create_session_with_pacing(uuid, text, text, text, text, text, jsonb, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.ppl_trivia_create_session_with_pacing(uuid, text, text, text, text, text, jsonb, text, timestamptz)
  to service_role;
