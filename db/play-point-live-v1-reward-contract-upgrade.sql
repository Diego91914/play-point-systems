-- Apply this after the earlier Play Point Live prototype schema if you want
-- the rewards table to match the current Play Point Core RewardRow contract.

alter table ppl_rewards alter column resolution_id drop not null;
alter table ppl_rewards alter column contest_id drop not null;

alter table ppl_rewards add column if not exists source_type text;
alter table ppl_rewards add column if not exists source_runtime_id text;

update ppl_rewards
set
  source_type = coalesce(
    source_type,
    case
      when resolution_id is not null then 'contest_resolution'
      else 'achievement'
    end
  ),
  source_runtime_id = coalesce(source_runtime_id, runtime_id);

alter table ppl_rewards alter column source_type set not null;
alter table ppl_rewards alter column source_runtime_id set not null;

alter table ppl_rewards
  drop constraint if exists ppl_rewards_type_check;

alter table ppl_rewards
  add constraint ppl_rewards_type_check
  check (reward_type in ('play_points', 'badge', 'title', 'trophy'));

alter table ppl_rewards
  drop constraint if exists ppl_rewards_source_type_check;

alter table ppl_rewards
  add constraint ppl_rewards_source_type_check
  check (
    source_type in (
      'contest_resolution',
      'event_finish',
      'season_result',
      'achievement',
      'streak'
    )
  );

create index if not exists ppl_rewards_source_runtime_id_idx
  on ppl_rewards(source_runtime_id);
