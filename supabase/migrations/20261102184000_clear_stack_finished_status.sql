-- Clear the Stack uses a nonterminal "finished" state between games.
-- The host retains the spectator room and can replay, change players, or end it.
-- Older constraint omitted finished, rejecting the final scoring action.
alter table public.ppl_clear_stack_rooms
  drop constraint if exists ppl_clear_stack_rooms_status_check;

alter table public.ppl_clear_stack_rooms
  add constraint ppl_clear_stack_rooms_status_check
  check (status in ('open', 'playing', 'finished', 'closed'));
