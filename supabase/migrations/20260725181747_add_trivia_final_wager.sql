alter table public.ppl_trivia_sessions
  drop constraint ppl_trivia_sessions_phase_check,
  drop constraint ppl_trivia_sessions_state_check;

alter table public.ppl_trivia_sessions
  add constraint ppl_trivia_sessions_phase_check
    check (phase in ('lobby', 'wager-open', 'question-open', 'answer-reveal', 'completed')),
  add constraint ppl_trivia_sessions_state_check
    check (
      (status = 'lobby' and phase = 'lobby')
      or (status = 'in-progress' and phase in ('wager-open', 'question-open', 'answer-reveal'))
      or (status = 'completed' and phase = 'completed')
    );

alter table public.ppl_trivia_answers
  drop constraint ppl_trivia_answers_score_check;

alter table public.ppl_trivia_answers
  add constraint ppl_trivia_answers_score_check
    check (speed_bonus >= 0);

create table public.ppl_trivia_wagers (
  session_id uuid not null references public.ppl_trivia_sessions(id) on delete cascade,
  player_id uuid not null,
  card_index integer not null,
  wager integer not null,
  submitted_at timestamptz not null default now(),
  primary key (session_id, card_index, player_id),
  constraint ppl_trivia_wagers_player_fkey
    foreign key (session_id, player_id)
    references public.ppl_trivia_players(session_id, id)
    on delete cascade,
  constraint ppl_trivia_wagers_card_index_check check (card_index >= 0),
  constraint ppl_trivia_wagers_amount_check check (wager >= 0)
);

create index ppl_trivia_wagers_session_player_idx
  on public.ppl_trivia_wagers (session_id, player_id);

alter table public.ppl_trivia_wagers enable row level security;
revoke all on table public.ppl_trivia_wagers from public, anon, authenticated;
grant select, insert, update, delete on table public.ppl_trivia_wagers to service_role;

create function public.ppl_trivia_submit_wager(
  p_session_id uuid,
  p_player_id uuid,
  p_wager integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
  v_player_score integer;
begin
  select * into v_session
  from public.ppl_trivia_sessions
  where id = p_session_id and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'That trivia room no longer exists.';
  end if;
  if v_session.status <> 'in-progress' or v_session.phase <> 'wager-open' then
    raise exception 'That room is not currently accepting wagers.';
  end if;

  select score into v_player_score
  from public.ppl_trivia_players
  where session_id = p_session_id and id = p_player_id
  for update;

  if not found then
    raise exception 'That player is not in the room.';
  end if;
  if p_wager is null or p_wager < 0 or p_wager > v_player_score then
    raise exception 'Choose a whole-number wager from 0 to %.', v_player_score;
  end if;

  insert into public.ppl_trivia_wagers (
    session_id,
    player_id,
    card_index,
    wager
  ) values (
    p_session_id,
    p_player_id,
    v_session.card_index,
    p_wager
  );

  update public.ppl_trivia_sessions
  set updated_at = clock_timestamp()
  where id = p_session_id;
exception
  when unique_violation then
    raise exception 'This player already locked a final wager.';
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
    set phase = 'question-open',
        opened_at = clock_timestamp(),
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
        phase = case when v_next_card_index = v_card_count - 1 then 'wager-open' else 'question-open' end,
        opened_at = case when v_next_card_index = v_card_count - 1 then null else clock_timestamp() end,
        resolution = null,
        updated_at = clock_timestamp()
    where id = p_session_id;
  end if;
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
  v_scoring_mode text;
  v_points_drop_per_second integer;
  v_timer_ms integer;
  v_is_final_wager boolean;
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
  v_scoring_mode := coalesce(v_card -> 'scoring' ->> 'mode', 'countdown');
  v_timer_ms := case when v_session.pacing_mode = 'relaxed' then 20000 else 10000 end;
  v_points_drop_per_second := ceil(v_correct_points::numeric / (v_timer_ms / 1000))::integer;
  v_is_final_wager := v_session.card_index = jsonb_array_length(v_session.deck -> 'cards') - 1;

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

  update public.ppl_trivia_answers as answer
  set delta = case
        when v_is_final_wager then
          case
            when answer.outcome = 'correct' then coalesce(wager.wager, 0)
            else -coalesce(wager.wager, 0)
          end
        when answer.outcome <> 'correct' then 0
        when v_scoring_mode = 'fixed' then v_correct_points
        else greatest(
          0,
          v_correct_points
            - floor(least(coalesce(answer.response_time_ms, v_timer_ms), v_timer_ms) / 1000.0)::integer
              * v_points_drop_per_second
        )
      end,
      speed_bonus = 0
  from public.ppl_trivia_players as player
  left join public.ppl_trivia_wagers as wager
    on wager.session_id = player.session_id
   and wager.player_id = player.id
   and wager.card_index = v_session.card_index
  where answer.session_id = p_session_id
    and answer.card_index = v_session.card_index
    and player.session_id = answer.session_id
    and player.id = answer.player_id;

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
          'wager', case when v_is_final_wager then coalesce(wager.wager, 0) else null end,
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
  left join public.ppl_trivia_wagers as wager
    on wager.session_id = player.session_id
   and wager.player_id = player.id
   and wager.card_index = v_session.card_index
  where player.session_id = p_session_id;

  update public.ppl_trivia_sessions
  set phase = 'answer-reveal',
      resolution = v_resolution,
      updated_at = clock_timestamp()
  where id = p_session_id;
end;
$$;

create or replace function public.ppl_trivia_load_session(p_session_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'session', to_jsonb(session_row),
    'players', coalesce(
      (
        select jsonb_agg(to_jsonb(player_row) order by player_row.joined_at, player_row.id)
        from public.ppl_trivia_players as player_row
        where player_row.session_id = session_row.id
      ),
      '[]'::jsonb
    ),
    'answers', coalesce(
      (
        select jsonb_agg(to_jsonb(answer_row) order by answer_row.submitted_at nulls last, answer_row.player_id)
        from public.ppl_trivia_answers as answer_row
        where answer_row.session_id = session_row.id
          and answer_row.card_index = session_row.card_index
      ),
      '[]'::jsonb
    ),
    'wagers', coalesce(
      (
        select jsonb_agg(to_jsonb(wager_row) order by wager_row.submitted_at, wager_row.player_id)
        from public.ppl_trivia_wagers as wager_row
        where wager_row.session_id = session_row.id
          and wager_row.card_index = session_row.card_index
      ),
      '[]'::jsonb
    )
  )
  from public.ppl_trivia_sessions as session_row
  where session_row.id = p_session_id
    and session_row.expires_at > clock_timestamp();
$$;

revoke execute on function public.ppl_trivia_submit_wager(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.ppl_trivia_submit_wager(uuid, uuid, integer) to service_role;

comment on table public.ppl_trivia_wagers is
  'Private final-question wagers. Amounts are visible only through authenticated player snapshots and post-reveal results.';
