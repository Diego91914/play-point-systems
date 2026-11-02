-- One active spectator room per Clear the Stack host, across browsers/devices.
-- Previous legacy rooms did not have spectator tokens and remain untouched.
-- Postgres unique partial index prevents concurrent host requests from
-- accidentally creating two simultaneously active Clear the Stack sessions.
create unique index if not exists ppl_clear_stack_single_live_host_idx
  on public.ppl_clear_stack_rooms (host_session_id)
  where host_session_id is not null
    and spectator_token is not null
    and status <> 'closed';
