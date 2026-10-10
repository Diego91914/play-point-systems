// Isolated reproduction of the read-only production policy snapshot. Never connects to production.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(fs.readFileSync('supabase/tests/fixtures/league-night-transaction.sql','utf8'));
await db.exec(`CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ppl_league_events,public.ppl_league_activities,public.ppl_league_roster TO authenticated;`);
for (const p of JSON.parse(fs.readFileSync('supabase/tests/fixtures/release-live-policies.json','utf8'))) {
 const quote = s => '"'+s.replaceAll('"','""')+'"';
 await db.exec(`CREATE POLICY ${quote(p.policyname)} ON public.${quote(p.tablename)} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(quote).join(',')} ${p.qual ? `USING (${p.qual})`:''} ${p.with_check ? `WITH CHECK (${p.with_check})`:''};`);
}
await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';`);
await db.exec(`INSERT INTO public.ppl_league_events(owner_user_id,name,event_date,join_code) VALUES(auth.uid(),'Direct non-privileged owner','2026-10-10','OWN234');`);
await db.exec('RESET ROLE');
assert.equal((await db.query(`SELECT count(*)::integer AS n FROM public.ppl_league_events WHERE join_code='OWN234'`)).rows[0].n,1);
for (const file of ['20261009233446_league_night_server_permissions.sql','20261009233921_legacy_session_directory_codes.sql','20261009235626_league_night_atomic_creation.sql','20261009235737_hosted_session_activity.sql']) await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
await db.exec(`SET ROLE authenticated; UPDATE public.ppl_league_events SET status='open',updated_at='2000-01-01' WHERE join_code='OWN234';`);
let rpcDenied=false;
try {await db.query(`SELECT public.ppl_create_league_night(auth.uid(),'Denied','2026-10-10',20,10,'[]','RPC234')`);} catch {rpcDenied=true;}
assert.equal(rpcDenied,true);
await db.exec('RESET ROLE');
const row=(await db.query(`SELECT updated_at FROM public.ppl_league_events WHERE join_code='OWN234'`)).rows[0];
assert.ok(row.updated_at.getUTCFullYear()>2000);
const snapshot = async () => (await db.query("SELECT jsonb_agg(to_jsonb(e) ORDER BY id) AS rows FROM ppl_league_events e")).rows[0].rows;
const before = await snapshot();
const policies = (await db.query("SELECT policyname,cmd,qual,with_check FROM pg_policies ORDER BY policyname")).rows;
// Include independent column grants to prove table REVOKE alone is insufficient.
await db.exec('GRANT UPDATE(updated_at), INSERT(name) ON ppl_league_events TO authenticated;');
await db.exec(fs.readFileSync('supabase/migrations/20261010002707_league_night_server_only_mutations.sql','utf8'));
let denials=0;
for (const role of ['authenticated','anon']) {
 await db.exec('SET ROLE '+role);
 for (const [table,insert] of [
  ['ppl_league_events',"INSERT INTO ppl_league_events(owner_user_id,name,join_code) VALUES('11111111-1111-4111-8111-111111111111','Denied','BAD234')"],
  ['ppl_league_activities',"INSERT INTO ppl_league_activities(event_id,game_sku,name) VALUES('22222222-2222-4222-8222-222222222222','game.clear_the_stack','Denied')"],
  ['ppl_league_roster',"INSERT INTO ppl_league_roster(event_id,display_name) VALUES('22222222-2222-4222-8222-222222222222','Denied')"]
 ]) for(const sql of [insert,`UPDATE ${table} SET ${table==='ppl_league_roster'?"checked_in=false":"status='open'"}`,`DELETE FROM ${table}`]) {
  await assert.rejects(db.exec(sql),/permission denied/); denials++;
 }
 await assert.rejects(db.exec("UPDATE ppl_league_events SET updated_at=clock_timestamp() WHERE join_code='OWN234'"),/permission denied/);denials++;
 await assert.rejects(db.query("SELECT ppl_create_league_night('11111111-1111-4111-8111-111111111111','Denied','2026-10-10',20,10,'[]','RPC234')"),/permission denied/);denials++;
 await db.exec('RESET ROLE');
}
assert.deepEqual(await snapshot(),before);
assert.deepEqual((await db.query("SELECT policyname,cmd,qual,with_check FROM pg_policies ORDER BY policyname")).rows,policies);
await db.exec("SET ROLE authenticated");
assert.equal((await db.query("SELECT count(*)::integer AS n FROM ppl_league_events")).rows[0].n,2);
await db.exec("SET request.jwt.claim.sub='33333333-3333-4333-8333-333333333333'");
assert.equal((await db.query("SELECT count(*)::integer AS n FROM ppl_league_events")).rows[0].n,0);
await db.exec('RESET ROLE; SET ROLE service_role');
const created=(await db.query("SELECT ppl_create_league_night('11111111-1111-4111-8111-111111111111','Authorized','2026-10-10',20,10,'[{\"display_name\":\"Roster\"}]','NEW234') AS event")).rows[0].event;
await db.query("UPDATE ppl_league_events SET status='open' WHERE id=$1",[created.id]);
await db.query("INSERT INTO ppl_league_roster(event_id,display_name,source) VALUES($1,'Invited guest','qr')",[created.id]);
await db.query("UPDATE ppl_league_roster SET checked_in=true WHERE event_id=$1",[created.id]);
assert.equal((await db.query('SELECT count(*)::integer AS n FROM ppl_league_roster WHERE event_id=$1',[created.id])).rows[0].n,2);
await db.exec('RESET ROLE');
console.log(`PASS: baseline bypass reproduced then corrected; ${denials} direct browser writes/RPCs denied, owner-only reads and unchanged policies/data verified; authorized atomic creation, renewal and guest roster operations succeed.`);
await db.close();
