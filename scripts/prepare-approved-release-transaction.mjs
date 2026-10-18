// Preparation only: never connects to a database. SQL is an explicit opt-in artifact.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const MANIFEST_SHA256='6e0fd52f9c219b444f86c3b52ec2956c2c205a884b23c407f685685542863b9e';
const digest=x=>createHash('sha256').update(x).digest('hex');
const quote=x=>"'"+x.replaceAll("'","''")+"'";
export function prepare(root=process.cwd()) {
 const bytes=fs.readFileSync(path.join(root,'docs/approved-release-migration-manifest.json'));
 assert.equal(digest(bytes),MANIFEST_SHA256,'Locked manifest changed');
 const m=JSON.parse(bytes);
 assert.equal(m.project,'qdsyxcjmrsxetjxeuojk');assert.equal(m.migrations.length,6);
 const files=m.migrations.map(x=>{const body=fs.readFileSync(path.join(root,x.path),'utf8');assert.equal(digest(body),x.sha256,`Hash mismatch: ${x.path}`);assert.equal(path.basename(x.path).slice(0,14),x.version);return {...x,body,name:path.basename(x.path).slice(15,-4)};});
 const versions=files.map(x=>quote(x.version)).join(',');
 const tables=['ppl_clear_stack_room_players','ppl_clear_stack_rooms','ppl_league_activities','ppl_league_events','ppl_league_roster','ppl_room_registry'];
 const fingerprint=t=>{const row=['ppl_clear_stack_rooms','ppl_league_events'].includes(t)?"to_jsonb(t)-'updated_at'":"to_jsonb(t)";return `SELECT md5(coalesce(jsonb_agg(${row} ORDER BY (${row})::text)::text,'[]')) FROM public.${t} t`;};
 const pre=`-- Generated only from locked manifest ${MANIFEST_SHA256}.
-- TARGET: PPS qdsyxcjmrsxetjxeuojk. Connection identity must be verified by operator.
-- NO application deployment, registry recreation, room recovery or historical replay.
BEGIN;
SET LOCAL standard_conforming_strings=on;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='120s';
SELECT pg_advisory_xact_lock(20261009,26);
LOCK TABLE supabase_migrations.schema_migrations IN SHARE ROW EXCLUSIVE MODE;
DO $guard$ BEGIN
 IF current_database()<>'postgres' THEN RAISE EXCEPTION 'Unexpected database'; END IF;
 IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261009023849' AND name='play_amplified_room_registry') THEN RAISE EXCEPTION 'Existing repaired registry history missing'; END IF;
 IF EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version IN (${versions})) THEN RAISE EXCEPTION 'Release version already recorded; reconcile, do not replay'; END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('ppl_clear_stack_rooms','ppl_league_events') AND column_name='updated_at') THEN RAISE EXCEPTION 'Unrecorded activity-column drift'; END IF;
END $guard$;
LOCK TABLE ${tables.map(t=>'public.'+t).join(',')} IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE release_original_history ON COMMIT DROP AS SELECT * FROM supabase_migrations.schema_migrations;
CREATE TEMP TABLE release_original_fingerprints(table_name text PRIMARY KEY,fingerprint text) ON COMMIT DROP;
${tables.map(t=>`INSERT INTO release_original_fingerprints VALUES (${quote(t)},(${fingerprint(t)}));`).join('\n')}
`;
 const changes=files.map(f=>`\n-- LOCKED FILE ${f.path}; SHA256 ${f.sha256}\n${f.body}\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES (${quote(f.version)},${quote(f.name)},ARRAY[${quote(f.body)}]::text[]);\n`).join('');
 const verify=`
DO $verify$ DECLARE r text; release_table text; f regprocedure; BEGIN
 IF (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version IN (${versions}))<>6 THEN RAISE EXCEPTION 'Six release history records required'; END IF;
 IF EXISTS((SELECT * FROM release_original_history EXCEPT SELECT * FROM supabase_migrations.schema_migrations)) OR EXISTS((SELECT * FROM supabase_migrations.schema_migrations WHERE version NOT IN (${versions}) EXCEPT SELECT * FROM release_original_history)) THEN RAISE EXCEPTION 'Historical migration records changed'; END IF;
 ${files.map(f=>`IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version=${quote(f.version)} AND name=${quote(f.name)} AND statements=ARRAY[${quote(f.body)}]::text[]) THEN RAISE EXCEPTION 'History body/name mismatch ${f.version}'; END IF;`).join('\n')}
 ${tables.map(t=>`IF (${fingerprint(t)}) IS DISTINCT FROM (SELECT fingerprint FROM release_original_fingerprints WHERE table_name=${quote(t)}) THEN RAISE EXCEPTION 'Existing data changed: ${t}'; END IF;`).join('\n')}
 IF EXISTS(SELECT 1 FROM public.ppl_clear_stack_rooms WHERE updated_at IS NOT NULL) OR EXISTS(SELECT 1 FROM public.ppl_league_events WHERE updated_at IS NOT NULL) THEN RAISE EXCEPTION 'Historical activity was unexpectedly backfilled'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.ppl_clear_stack_rooms'::regclass,'public.ppl_league_events'::regclass,'public.ppl_league_activities'::regclass,'public.ppl_league_roster'::regclass,'public.ppl_room_registry'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'RLS disabled'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.ppl_clear_stack_rooms'::regclass AND tgname='ppl_clear_stack_rooms_activity' AND tgenabled='O') OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.ppl_league_events'::regclass AND tgname='ppl_league_events_activity' AND tgenabled='O') THEN RAISE EXCEPTION 'Activity triggers missing'; END IF;
 FOREACH f IN ARRAY ARRAY['public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text)'::regprocedure,'public.ppl_recover_clear_stack_room(text,text)'::regprocedure] LOOP
  IF (SELECT prosecdef FROM pg_proc WHERE oid=f) OR NOT has_function_privilege('service_role',f,'EXECUTE') OR has_function_privilege('anon',f,'EXECUTE') OR has_function_privilege('authenticated',f,'EXECUTE') THEN RAISE EXCEPTION 'Unsafe RPC execution privileges'; END IF;
 END LOOP;
 FOREACH release_table IN ARRAY ARRAY['ppl_league_events','ppl_league_activities','ppl_league_roster'] LOOP
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF has_table_privilege(r,'public.'||release_table,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege(r,'public.'||release_table,'INSERT,UPDATE,REFERENCES') THEN RAISE EXCEPTION 'Browser mutation privileges remain'; END IF;
  END LOOP;
 END LOOP;
END $verify$;
`;
 return {manifest:m,files,pre,changes,verify,sql:pre+changes+verify};
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
 const out=process.argv[2];assert.ok(out,'Provide an output directory; preparation never executes SQL');
 const release=prepare();fs.mkdirSync(out,{recursive:true});
 for(const [name,end] of [['rehearsal.sql','ROLLBACK;'],['release.sql','COMMIT;']]) fs.writeFileSync(path.join(out,name),release.sql+'\n'+end+'\n',{flag:'wx'});
 const result={project:release.manifest.project,productionExecuted:false,manifestSha256:MANIFEST_SHA256,files:release.files.map(({body,...x})=>x),artifacts:['rehearsal.sql','release.sql'].map(name=>({name,sha256:digest(fs.readFileSync(path.join(out,name)))}))};
 fs.writeFileSync(path.join(out,'transaction-manifest.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('Prepared six locked files with atomic history and preservation guards; no database execution.');
}
