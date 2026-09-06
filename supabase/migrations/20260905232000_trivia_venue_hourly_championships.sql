-- Hourly championship scoring for Trivia Venue Mode.
-- Venue play continues uninterrupted; only the championship window resets.

alter table public.ppl_trivia_venue_sessions
  add column championship_started_at timestamptz not null default now();

alter table public.ppl_trivia_venue_players
  add column current_match_score integer not null default 0,
  add column championship_score integer not null default 0;

alter table public.ppl_trivia_venue_players
  add constraint ppl_trivia_venue_players_match_score_check
    check (current_match_score >= 0),
  add constraint ppl_trivia_venue_players_championship_score_check
    check (championship_score >= 0);

create index ppl_trivia_venue_players_championship_idx
  on public.ppl_trivia_venue_players (venue_session_id, championship_score desc)
  where removed_at is null;
