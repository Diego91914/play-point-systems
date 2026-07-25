alter table public.ppl_quick_score_players
  add column auth_user_id uuid;

alter table public.ppl_quick_score_players
  add constraint ppl_quick_score_players_auth_user_id_fkey
    foreign key (auth_user_id)
    references auth.users(id)
    on delete set null;

create unique index ppl_quick_score_players_auth_user_id_key
  on public.ppl_quick_score_players(auth_user_id)
  where auth_user_id is not null;

comment on column public.ppl_quick_score_players.auth_user_id is
  'Verified Supabase Auth user linked to this Quick Score player. Nullable during the recovery-key compatibility window.';

create table public.ppl_quick_score_player_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null
    references public.ppl_quick_score_players(id)
    on delete cascade,
  token_hash text not null,
  token_version smallint not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  constraint ppl_quick_score_player_sessions_token_hash_format
    check (token_hash ~ '^[A-Za-z0-9_-]{43}$'),
  constraint ppl_quick_score_player_sessions_token_version_valid
    check (token_version = 1),
  constraint ppl_quick_score_player_sessions_expiry_valid
    check (expires_at > created_at)
);

create unique index ppl_quick_score_player_sessions_token_hash_key
  on public.ppl_quick_score_player_sessions(token_hash);

create index ppl_quick_score_player_sessions_active_player_idx
  on public.ppl_quick_score_player_sessions(player_id, expires_at desc)
  where revoked_at is null;

alter table public.ppl_quick_score_player_sessions enable row level security;

revoke all on table public.ppl_quick_score_player_sessions from anon, authenticated;
grant select, insert, update, delete on table public.ppl_quick_score_player_sessions to service_role;

comment on table public.ppl_quick_score_player_sessions is
  'Hashed, revocable per-device credentials issued after a verified Supabase Auth sign-in.';

comment on column public.ppl_quick_score_player_sessions.token_hash is
  'Base64url SHA-256 digest of a high-entropy per-device Quick Score session token.';
