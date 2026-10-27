// Isolated engine only. No production connections or database credentials.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {prepare} from './prepare-approved-release-transaction.mjs';
const {PGlite}=await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const release=prepare();
let checks=0;
const packet='docs/prepared-six-migration-release';
const packetManifest=JSON.parse(fs.readFileSync(packet+'/transaction-manifest.json','utf8'));
for(const [name,end] of [['rehearsal.sql','ROLLBACK;'],['release.sql','COMMIT;']]) {
 const bytes=fs.readFileSync(packet+'/'+name);assert.equal(bytes.toString(),release.sql+'\n'+end+'\n');checks++;
 assert.equal(createHash('sha256').update(bytes).digest('hex'),packetManifest.artifacts.find(x=>x.name===name).sha256);checks++;
}
async function fixture(){
 const db=new PGlite();
 await db.exec(fs.readFileSync('supabase/tests/fixtures/league-night-transaction.sql','utf8'));
 await db.exec(`CREATE TABLE public.ppl_clear_stack_room_players(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),room_id uuid REFERENCES public.ppl_clear_stack_rooms(id),display_name text,score numeric);
 INSERT INTO public.ppl_clear_stack_room_players(room_id,display_name,score) SELECT id,'Existing player',12.5 FROM public.ppl_clear_stack_rooms;
 CREATE SCHEMA supabase_migrations;
 CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,statements text[],name text,created_by text,idempotency_key text,rollback text[]);
 INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('20261009023849','play_amplified_room_registry',ARRAY['historical registry repair']);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth TO authenticated;
 GRANT SELECT,INSERT,UPDATE,DELETE ON public.ppl_league_events,public.ppl_league_activities,public.ppl_league_roster TO authenticated;`);
 for(const p of JSON.parse(fs.readFileSync('supabase/tests/fixtures/release-live-policies.json','utf8'))){const q=x=>'"'+x.replaceAll('"','""')+'"';await db.exec(`CREATE POLICY ${q(p.policyname)} ON public.${q(p.tablename)} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(q).join(',')} ${p.qual?`USING (${p.qual})`:''} ${p.with_check?`WITH CHECK (${p.with_check})`:''}`);}
 return db;
}
const state=async db=>(await db.query(`SELECT jsonb_build_object('history',(SELECT jsonb_agg(to_jsonb(t) ORDER BY version) FROM supabase_migrations.schema_migrations t),'columns',(SELECT jsonb_agg(to_jsonb(t) ORDER BY table_name,column_name) FROM information_schema.columns t WHERE table_schema='public'),'grants',(SELECT jsonb_agg(to_jsonb(t) ORDER BY table_name,grantee,privilege_type) FROM information_schema.role_table_grants t WHERE table_schema='public'),'policies',(SELECT jsonb_agg(to_jsonb(t) ORDER BY tablename,policyname) FROM pg_policies t WHERE schemaname='public'),'triggers',(SELECT jsonb_agg(jsonb_build_object('table',tgrelid::regclass::text,'name',tgname,'def',pg_get_triggerdef(oid)) ORDER BY tgname) FROM pg_trigger WHERE NOT tgisinternal),'registry',(SELECT jsonb_agg(to_jsonb(t) ORDER BY code) FROM public.ppl_room_registry t),'players',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.ppl_clear_stack_room_players t)) AS state`)).rows[0].state;
// Complete rehearsal exercises every statement and assertion, then restores baseline.
{
 const db=await fixture();const before=await state(db);
 await db.exec(release.sql+'\nROLLBACK;');assert.deepEqual(await state(db),before);checks++;
 await db.exec(release.sql+'\nCOMMIT;');checks++;
 const history=(await db.query('SELECT version,name,statements FROM supabase_migrations.schema_migrations ORDER BY version')).rows;
 assert.equal(history.length,7);checks++;
 for(const f of release.files){assert.deepEqual(history.find(x=>x.version===f.version),{version:f.version,name:f.name,statements:[f.body]});checks++;}
 assert.deepEqual((await db.query('SELECT code FROM ppl_room_registry')).rows,[{code:'ABC234'}]);checks++;
 assert.equal((await db.query('SELECT score FROM ppl_clear_stack_room_players')).rows[0].score,'12.5');checks++;
 const committed=await state(db);await assert.rejects(db.exec(release.sql+'\nCOMMIT;'),/already recorded/);await db.exec('ROLLBACK');assert.deepEqual(await state(db),committed);checks++;
 await db.close();
}
// Fail after each of the six files/history inserts: all prior DDL, ACL and history roll back.
for(let stop=0;stop<6;stop++){
 const db=await fixture();const before=await state(db);
 const pieces=release.changes.split('\n-- LOCKED FILE ').slice(1);
 const fail=release.pre+pieces.slice(0,stop+1).map(x=>'\n-- LOCKED FILE '+x).join('')+"\nDO $$ BEGIN RAISE EXCEPTION 'INJECTED_RELEASE_FAILURE'; END $$;\nCOMMIT;";
 await assert.rejects(db.exec(fail),/INJECTED_RELEASE_FAILURE/);await db.exec('ROLLBACK');assert.deepEqual(await state(db),before);checks++;await db.close();
}
// A partial history state is a hard stop, never silently skipped/repaired.
{
 const db=await fixture();await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES($1,$2)',[release.files[2].version,release.files[2].name]);const before=await state(db);
 await assert.rejects(db.exec(release.sql+'\nCOMMIT;'),/already recorded/);await db.exec('ROLLBACK');assert.deepEqual(await state(db),before);checks++;await db.close();
}
// Tampering with either locked file bytes or the manifest must fail preparation.
{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pps-release-tamper-'));
 try {
  for(const p of ['docs/approved-release-migration-manifest.json',...release.files.map(x=>x.path)]) {fs.mkdirSync(path.dirname(path.join(temp,p)),{recursive:true});fs.copyFileSync(p,path.join(temp,p));}
  fs.appendFileSync(path.join(temp,release.files[0].path),'\n-- unexpected change');assert.throws(()=>prepare(temp),/Hash mismatch/);checks++;
  fs.appendFileSync(path.join(temp,'docs/approved-release-migration-manifest.json'),'\n');assert.throws(()=>prepare(temp),/Locked manifest changed/);checks++;
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
console.log(`PASS: ${checks} complete-transaction checks; rehearsal rollback, isolated commit, exact history, six failure points and replay/partial-history rejection.`);
