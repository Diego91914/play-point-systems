-- Clear the Stack: host-controlled game with shareable, read-only spectator view.
-- Additive migration; old rooms remain without spectator links.
alter table public.ppl_clear_stack_rooms
  add column if not exists spectator_token text,
  add column if not exists game_state jsonb not null default '{}'::jsonb,
  add column if not exists state_version integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ppl_clear_stack_rooms_spectator_token_idx
  on public.ppl_clear_stack_rooms (spectator_token) where spectator_token is not null;

-- Keep RLS and server-side access. Do not expose state writes to anon/authenticated.
revoke insert, update, delete on public.ppl_clear_stack_rooms from anon, authenticated;
-- Reading spectator state uses a token-checked server route using the service role.
-- Existing room-player table is retained for migration/backward compatibility
-- but is no longer used by the spectator-only QR path.
