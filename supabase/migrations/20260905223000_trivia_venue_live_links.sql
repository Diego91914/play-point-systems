-- Link long-running venue players to the currently attached live Trivia match.
alter table public.ppl_trivia_venue_players
  add column trivia_session_id uuid references public.ppl_trivia_sessions(id) on delete set null,
  add column trivia_player_id uuid references public.ppl_trivia_players(id) on delete set null;

create index ppl_trivia_venue_players_live_link_idx
  on public.ppl_trivia_venue_players (venue_session_id, trivia_session_id, trivia_player_id)
  where removed_at is null;
