alter table public.ppl_trivia_players
  add column current_streak integer not null default 0,
  add column best_streak integer not null default 0,
  add constraint ppl_trivia_players_streaks_check
    check (current_streak >= 0 and best_streak >= current_streak);

alter table public.ppl_trivia_answers
  add column streak_bonus integer not null default 0,
  add constraint ppl_trivia_answers_streak_bonus_check
    check (streak_bonus >= 0);

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

  with calculated_score as (
    select
      answer.session_id,
      answer.player_id,
      answer.card_index,
      case
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
      end as base_delta,
      case
        when not v_is_final_wager and answer.outcome = 'correct'
          then least(player.current_streak * 100, 500)
        else 0
      end as streak_bonus
    from public.ppl_trivia_answers as answer
    join public.ppl_trivia_players as player
      on player.session_id = answer.session_id
     and player.id = answer.player_id
    left join public.ppl_trivia_wagers as wager
      on wager.session_id = player.session_id
     and wager.player_id = player.id
     and wager.card_index = v_session.card_index
    where answer.session_id = p_session_id
      and answer.card_index = v_session.card_index
  )
  update public.ppl_trivia_answers as answer
  set delta = calculated_score.base_delta + calculated_score.streak_bonus,
      speed_bonus = 0,
      streak_bonus = calculated_score.streak_bonus
  from calculated_score
  where answer.session_id = calculated_score.session_id
    and answer.player_id = calculated_score.player_id
    and answer.card_index = calculated_score.card_index;

  update public.ppl_trivia_players as player
  set score = player.score + answer.delta,
      correct_count = player.correct_count + case when answer.outcome = 'correct' then 1 else 0 end,
      wrong_count = player.wrong_count + case when answer.outcome = 'wrong' then 1 else 0 end,
      skipped_count = player.skipped_count + case when answer.outcome = 'skip' then 1 else 0 end,
      current_streak = case when answer.outcome = 'correct' then player.current_streak + 1 else 0 end,
      best_streak = greatest(
        player.best_streak,
        case when answer.outcome = 'correct' then player.current_streak + 1 else player.best_streak end
      ),
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
          'streakBonus', answer.streak_bonus,
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

comment on column public.ppl_trivia_players.current_streak is
  'Consecutive correct answers through the most recently resolved question.';
comment on column public.ppl_trivia_players.best_streak is
  'Highest consecutive-correct streak reached during the session.';
comment on column public.ppl_trivia_answers.streak_bonus is
  'Extra points earned for consecutive correct answers; zero on the final wager.';
