-- Apply this only if you already created the earlier Play Point Live draft schema
-- and want to bring it forward to the runtime_id bridge model without recreating
-- the whole database from scratch.

alter table ppl_users add column if not exists runtime_id text;
update ppl_users set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_users alter column runtime_id set not null;
create unique index if not exists ppl_users_runtime_id_idx on ppl_users(runtime_id);

alter table ppl_clubs add column if not exists runtime_id text;
update ppl_clubs set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_clubs alter column runtime_id set not null;
create unique index if not exists ppl_clubs_runtime_id_idx on ppl_clubs(runtime_id);

alter table ppl_seasons add column if not exists runtime_id text;
update ppl_seasons set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_seasons alter column runtime_id set not null;
create unique index if not exists ppl_seasons_runtime_id_idx on ppl_seasons(runtime_id);

alter table ppl_events add column if not exists runtime_id text;
update ppl_events set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_events alter column runtime_id set not null;
create unique index if not exists ppl_events_runtime_id_idx on ppl_events(runtime_id);

alter table ppl_contests add column if not exists runtime_id text;
update ppl_contests set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_contests alter column runtime_id set not null;
create unique index if not exists ppl_contests_runtime_id_idx on ppl_contests(runtime_id);

alter table ppl_entries add column if not exists runtime_id text;
update ppl_entries set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_entries alter column runtime_id set not null;
create unique index if not exists ppl_entries_runtime_id_idx on ppl_entries(runtime_id);

alter table ppl_triggers add column if not exists runtime_id text;
update ppl_triggers set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_triggers alter column runtime_id set not null;
create unique index if not exists ppl_triggers_runtime_id_idx on ppl_triggers(runtime_id);

alter table ppl_resolutions add column if not exists runtime_id text;
update ppl_resolutions set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_resolutions alter column runtime_id set not null;
create unique index if not exists ppl_resolutions_runtime_id_idx on ppl_resolutions(runtime_id);

alter table ppl_rewards add column if not exists runtime_id text;
update ppl_rewards set runtime_id = coalesce(runtime_id, id::text);
alter table ppl_rewards alter column runtime_id set not null;
create unique index if not exists ppl_rewards_runtime_id_idx on ppl_rewards(runtime_id);
