alter table public.ppl_quick_score_players
  add column recovery_code_hash text,
  add column recovery_code_version smallint;

alter table public.ppl_quick_score_players
  alter column recovery_code drop not null;

alter table public.ppl_quick_score_players
  add constraint ppl_quick_score_players_credential_present
    check (recovery_code is not null or recovery_code_hash is not null),
  add constraint ppl_quick_score_players_hash_version_valid
    check (
      (recovery_code_hash is null and recovery_code_version is null)
      or
      (
        recovery_code_hash ~ '^[A-Za-z0-9_-]{43}$'
        and recovery_code_version = 1
      )
    );

create unique index ppl_quick_score_players_recovery_code_hash_key
  on public.ppl_quick_score_players(recovery_code_hash)
  where recovery_code_hash is not null;

comment on column public.ppl_quick_score_players.recovery_code_hash is
  'Base64url SHA-256 digest of a normalized high-entropy Quick Score recovery code.';

comment on column public.ppl_quick_score_players.recovery_code_version is
  'Credential hashing scheme version. Version 1 is normalized recovery code plus SHA-256.';

alter table public.ppl_quick_score_sessions
  add column host_token_hash text,
  add column host_token_version smallint;

alter table public.ppl_quick_score_sessions
  alter column host_player_id drop not null;

alter table public.ppl_quick_score_sessions
  add constraint ppl_quick_score_sessions_host_credential_present
    check (host_player_id is not null or host_token_hash is not null),
  add constraint ppl_quick_score_sessions_host_hash_version_valid
    check (
      (host_token_hash is null and host_token_version is null)
      or
      (
        host_token_hash ~ '^[A-Za-z0-9_-]{43}$'
        and host_token_version = 1
      )
    );

comment on column public.ppl_quick_score_sessions.host_token_hash is
  'Base64url SHA-256 digest of a high-entropy Quick Score host token.';

comment on column public.ppl_quick_score_sessions.host_token_version is
  'Credential hashing scheme version. Version 1 is the host token plus SHA-256.';
