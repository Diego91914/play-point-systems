create table public.ppl_trivia_sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  category text not null,
  difficulty_filter text not null,
  random_seed text not null,
  deck jsonb not null,
  host_token_hash text not null,
  status text not null default 'lobby',
  phase text not null default 'lobby',
  card_index integer not null default 0,
  opened_at timestamptz,
  resolution jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours'),
  constraint ppl_trivia_sessions_room_code_check
    check (room_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  constraint ppl_trivia_sessions_difficulty_check
    check (difficulty_filter in ('mixed', 'easy', 'medium', 'hard', 'expert')),
  constraint ppl_trivia_sessions_seed_check
    check (random_seed ~ '^[0-9a-f]{64}$'),
  constraint ppl_trivia_sessions_host_token_hash_check
    check (host_token_hash ~ '^[0-9a-f]{64}$'),
  constraint ppl_trivia_sessions_status_check
    check (status in ('lobby', 'in-progress', 'completed')),
  constraint ppl_trivia_sessions_phase_check
    check (phase in ('lobby', 'question-open', 'answer-reveal', 'completed')),
  constraint ppl_trivia_sessions_state_check
    check (
      (status = 'lobby' and phase = 'lobby')
      or (status = 'in-progress' and phase in ('question-open', 'answer-reveal'))
      or (status = 'completed' and phase = 'completed')
    ),
  constraint ppl_trivia_sessions_card_index_check
    check (
      card_index >= 0
      and jsonb_typeof(deck) = 'object'
      and jsonb_typeof(deck -> 'cards') = 'array'
      and jsonb_array_length(deck -> 'cards') > 0
      and card_index <= jsonb_array_length(deck -> 'cards')
    ),
  constraint ppl_trivia_sessions_expiry_check
    check (expires_at > created_at)
);

create index ppl_trivia_sessions_expires_at_idx
  on public.ppl_trivia_sessions (expires_at);

create table public.ppl_trivia_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ppl_trivia_sessions(id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  token_hash text not null,
  score integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  skipped_count integer not null default 0,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ppl_trivia_players_name_check
    check (char_length(btrim(name)) between 1 and 40),
  constraint ppl_trivia_players_token_hash_check
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint ppl_trivia_players_counts_check
    check (score >= 0 and correct_count >= 0 and wrong_count >= 0 and skipped_count >= 0),
  constraint ppl_trivia_players_session_name_key unique (session_id, normalized_name),
  constraint ppl_trivia_players_session_id_id_key unique (session_id, id)
);

create table public.ppl_trivia_answers (
  session_id uuid not null references public.ppl_trivia_sessions(id) on delete cascade,
  player_id uuid not null,
  card_index integer not null,
  response text not null,
  response_text text not null,
  outcome text not null,
  submitted_at timestamptz,
  response_time_ms integer,
  delta integer not null default 0,
  speed_bonus integer not null default 0,
  primary key (session_id, card_index, player_id),
  constraint ppl_trivia_answers_player_fkey
    foreign key (session_id, player_id)
    references public.ppl_trivia_players(session_id, id)
    on delete cascade,
  constraint ppl_trivia_answers_card_index_check check (card_index >= 0),
  constraint ppl_trivia_answers_response_check check (response in ('A', 'B', 'C', 'D', 'skip')),
  constraint ppl_trivia_answers_outcome_check check (outcome in ('correct', 'wrong', 'skip')),
  constraint ppl_trivia_answers_response_time_check
    check (response_time_ms is null or response_time_ms >= 0),
  constraint ppl_trivia_answers_score_check check (delta >= 0 and speed_bonus >= 0)
);

create index ppl_trivia_answers_session_player_idx
  on public.ppl_trivia_answers (session_id, player_id);

create table public.ppl_trivia_question_history (
  id bigint generated always as identity primary key,
  session_id uuid references public.ppl_trivia_sessions(id) on delete set null,
  category text not null,
  difficulty text not null,
  source_id text not null,
  played_at timestamptz not null default now(),
  constraint ppl_trivia_question_history_difficulty_check
    check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  constraint ppl_trivia_question_history_session_source_key unique (session_id, source_id)
);

create index ppl_trivia_question_history_category_played_idx
  on public.ppl_trivia_question_history (category, played_at desc)
  include (source_id);

create index ppl_trivia_question_history_session_idx
  on public.ppl_trivia_question_history (session_id)
  where session_id is not null;

create index ppl_trivia_question_history_played_at_idx
  on public.ppl_trivia_question_history (played_at);

alter table public.ppl_trivia_sessions enable row level security;
alter table public.ppl_trivia_players enable row level security;
alter table public.ppl_trivia_answers enable row level security;
alter table public.ppl_trivia_question_history enable row level security;

revoke all on table public.ppl_trivia_sessions from public, anon, authenticated;
revoke all on table public.ppl_trivia_players from public, anon, authenticated;
revoke all on table public.ppl_trivia_answers from public, anon, authenticated;
revoke all on table public.ppl_trivia_question_history from public, anon, authenticated;
revoke all on sequence public.ppl_trivia_question_history_id_seq from public, anon, authenticated;

grant select, insert, update, delete on table public.ppl_trivia_sessions to service_role;
grant select, insert, update, delete on table public.ppl_trivia_players to service_role;
grant select, insert, update, delete on table public.ppl_trivia_answers to service_role;
grant select, insert, update, delete on table public.ppl_trivia_question_history to service_role;
grant usage, select on sequence public.ppl_trivia_question_history_id_seq to service_role;

create function public.ppl_trivia_create_session(
  p_session_id uuid,
  p_room_code text,
  p_category text,
  p_difficulty_filter text,
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
begin
  delete from public.ppl_trivia_sessions
  where expires_at <= clock_timestamp();

  delete from public.ppl_trivia_question_history
  where played_at < clock_timestamp() - interval '30 days';

  insert into public.ppl_trivia_sessions (
    id,
    room_code,
    category,
    difficulty_filter,
    random_seed,
    deck,
    host_token_hash,
    expires_at
  ) values (
    p_session_id,
    p_room_code,
    p_category,
    p_difficulty_filter,
    p_random_seed,
    p_deck,
    p_host_token_hash,
    p_expires_at
  );

  insert into public.ppl_trivia_question_history (
    session_id,
    category,
    difficulty,
    source_id
  )
  select
    p_session_id,
    p_category,
    card ->> 'difficulty',
    card ->> 'sourceId'
  from jsonb_array_elements(p_deck -> 'cards') as card;

  return p_session_id;
end;
$$;

create function public.ppl_trivia_join_room(
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

  if (select count(*) from public.ppl_trivia_players where session_id = v_session.id) >= 100 then
    raise exception 'That room has reached its 100-player limit.';
  end if;

  insert into public.ppl_trivia_players (id, session_id, name, token_hash)
  values (p_player_id, v_session.id, btrim(p_player_name), p_token_hash);

  update public.ppl_trivia_sessions
  set updated_at = clock_timestamp()
  where id = v_session.id;

  return v_session.id;
exception
  when unique_violation then
    raise exception 'That player name is already in the room.';
end;
$$;

create function public.ppl_trivia_start_session(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
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
  if not exists (select 1 from public.ppl_trivia_players where session_id = p_session_id) then
    raise exception 'At least one player must join before the room can start.';
  end if;

  update public.ppl_trivia_sessions
  set status = 'in-progress',
      phase = 'question-open',
      opened_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_session_id;
end;
$$;

create function public.ppl_trivia_submit_answer(
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

  v_response_time_ms := greatest(
    0,
    floor(extract(epoch from (v_now - v_session.opened_at)) * 1000)::integer
  );
  if v_response_time_ms >= 10000 then
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

create function public.ppl_trivia_resolve_session(p_session_id uuid)
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
          v_correct_points - floor(least(coalesce(response_time_ms, 10000), 10000) / 1000.0)::integer * 100
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

create function public.ppl_trivia_advance_session(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.ppl_trivia_sessions%rowtype;
  v_card_count integer;
begin
  select * into v_session
  from public.ppl_trivia_sessions
  where id = p_session_id and expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception 'That trivia room no longer exists.';
  end if;
  if v_session.status <> 'in-progress' or v_session.phase <> 'answer-reveal' then
    raise exception 'Resolve the current question before advancing.';
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
    update public.ppl_trivia_sessions
    set card_index = card_index + 1,
        phase = 'question-open',
        opened_at = clock_timestamp(),
        resolution = null,
        updated_at = clock_timestamp()
    where id = p_session_id;
  end if;
end;
$$;

create function public.ppl_trivia_load_session(p_session_id uuid)
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
    )
  )
  from public.ppl_trivia_sessions as session_row
  where session_row.id = p_session_id
    and session_row.expires_at > clock_timestamp();
$$;

revoke execute on function public.ppl_trivia_create_session(uuid, text, text, text, text, jsonb, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.ppl_trivia_join_room(text, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.ppl_trivia_start_session(uuid) from public, anon, authenticated;
revoke execute on function public.ppl_trivia_submit_answer(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.ppl_trivia_resolve_session(uuid) from public, anon, authenticated;
revoke execute on function public.ppl_trivia_advance_session(uuid) from public, anon, authenticated;
revoke execute on function public.ppl_trivia_load_session(uuid) from public, anon, authenticated;

grant execute on function public.ppl_trivia_create_session(uuid, text, text, text, text, jsonb, text, timestamptz) to service_role;
grant execute on function public.ppl_trivia_join_room(text, uuid, text, text) to service_role;
grant execute on function public.ppl_trivia_start_session(uuid) to service_role;
grant execute on function public.ppl_trivia_submit_answer(uuid, uuid, text) to service_role;
grant execute on function public.ppl_trivia_resolve_session(uuid) to service_role;
grant execute on function public.ppl_trivia_advance_session(uuid) to service_role;
grant execute on function public.ppl_trivia_load_session(uuid) to service_role;

comment on table public.ppl_trivia_sessions is
  'Private persisted state for hosted Play Point Trivia rooms.';
comment on table public.ppl_trivia_players is
  'Private player state and hashed per-room credentials for hosted trivia.';
comment on table public.ppl_trivia_answers is
  'Server-scored trivia responses, unique per player and question.';
comment on table public.ppl_trivia_question_history is
  'Recent source-question history used to reduce repetition across rooms.';
