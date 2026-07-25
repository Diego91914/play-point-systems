-- Stage 6 rollback for index changes.
-- The contact-submission table is intentionally retained so rollback cannot delete messages.

drop index if exists public.pps_contact_submissions_status_created_at_idx;
drop index if exists public.ppl_audit_log_actor_user_id_idx;
drop index if exists public.ppl_audit_log_contest_id_idx;
drop index if exists public.ppl_audit_log_event_id_idx;
drop index if exists public.ppl_audit_log_resolution_id_idx;
drop index if exists public.ppl_audit_log_trigger_id_idx;
drop index if exists public.ppl_club_members_user_id_idx;
drop index if exists public.ppl_clubs_owner_user_id_idx;
drop index if exists public.ppl_contests_created_by_user_id_idx;
drop index if exists public.ppl_entries_user_id_idx;
drop index if exists public.ppl_events_created_by_user_id_idx;
drop index if exists public.ppl_quick_score_matches_session_code_idx;
drop index if exists public.ppl_resolutions_applied_by_user_id_idx;
drop index if exists public.ppl_resolutions_trigger_id_idx;
drop index if exists public.ppl_rewards_contest_id_idx;
drop index if exists public.ppl_rewards_resolution_id_idx;
drop index if exists public.ppl_seasons_created_by_user_id_idx;
drop index if exists public.ppl_standings_user_id_idx;
drop index if exists public.ppl_triggers_created_by_user_id_idx;

create unique index if not exists ppl_clubs_runtime_id_idx
  on public.ppl_clubs (runtime_id);
create unique index if not exists ppl_contests_runtime_id_idx
  on public.ppl_contests (runtime_id);
create unique index if not exists ppl_entries_runtime_id_idx
  on public.ppl_entries (runtime_id);
create unique index if not exists ppl_events_runtime_id_idx
  on public.ppl_events (runtime_id);
create unique index if not exists ppl_resolutions_runtime_id_idx
  on public.ppl_resolutions (runtime_id);
create unique index if not exists ppl_rewards_runtime_id_idx
  on public.ppl_rewards (runtime_id);
create unique index if not exists ppl_seasons_runtime_id_idx
  on public.ppl_seasons (runtime_id);
create unique index if not exists ppl_triggers_runtime_id_idx
  on public.ppl_triggers (runtime_id);
create unique index if not exists ppl_users_runtime_id_idx
  on public.ppl_users (runtime_id);
