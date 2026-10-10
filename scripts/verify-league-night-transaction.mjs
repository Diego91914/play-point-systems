const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(fs.readFileSync(new URL('../supabase/tests/fixtures/league-night-transaction.sql',import.meta.url),'utf8'));
const root = new URL('../supabase/migrations/',import.meta.url);
for (const name of fs.readdirSync(root).filter(n=>['league_night_server_permissions','legacy_session_directory_codes','league_night_atomic_creation','hosted_session_activity'].some(part=>n.includes(part))).sort()) await db.exec(fs.readFileSync(new URL(name,root),'utf8'));
const tables=['ppl_league_events','ppl_league_activities','ppl_league_roster','ppl_room_registry'];
const snapshot=async()=>Promise.all(tables.map(async table=>(await db.query(`SELECT row_to_json(t) AS row FROM ${table} t ORDER BY 1::text`)).rows.map(r=>r.row).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))));
const original=await snapshot();
assert.equal(original[0][0].updated_at,null,'historical activity was not backfilled');
const create=async(code='NEW234',players=[{display_name:'Guest',pdga_number:314732,rating:876,division:'MA2'},{display_name:'Second player'}])=>db.query(`SELECT public.ppl_create_league_night($1::uuid,$2,$3::date,$4::integer,$5::integer,$6::jsonb,$7) AS event`,['11111111-1111-4111-8111-111111111111','New League','2026-11-01',20,10,JSON.stringify(players),code]);
for(const role of ['anon','authenticated']) {
 await db.exec(`SET ROLE ${role}`);await assert.rejects(create(),/permission denied/);await db.exec('RESET ROLE');
 assert.deepEqual(await snapshot(),original);
}
assert.equal((await db.query("SELECT prosecdef FROM pg_proc WHERE proname='ppl_create_league_night'")).rows[0].prosecdef,false);
let checks=3;
for(const table of tables) {
 await db.exec(`CREATE OR REPLACE FUNCTION public.test_creation_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_${table}'; END; $$; CREATE TRIGGER test_failure BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION public.test_creation_failure(); SET ROLE service_role;`);
 await assert.rejects(create(),new RegExp('INJECTED_'+table));await db.exec(`RESET ROLE; DROP TRIGGER test_failure ON ${table}; DROP FUNCTION public.test_creation_failure();`);
 assert.deepEqual(await snapshot(),original,`failure at ${table} rolls back every new record`);checks++;
}
// A failure on the second roster row must roll back the first roster row too.
await db.exec(`CREATE FUNCTION public.test_roster_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.display_name='Fail second' THEN RAISE EXCEPTION 'SECOND_ROSTER_FAILURE'; END IF; RETURN NEW; END; $$; CREATE TRIGGER test_failure BEFORE INSERT ON ppl_league_roster FOR EACH ROW EXECUTE FUNCTION public.test_roster_failure(); SET ROLE service_role;`);
await assert.rejects(create('NEW234',[{display_name:'First inserted'},{display_name:'Fail second'}]),/SECOND_ROSTER_FAILURE/);
await db.exec('RESET ROLE; DROP TRIGGER test_failure ON ppl_league_roster; DROP FUNCTION public.test_roster_failure();');assert.deepEqual(await snapshot(),original);checks++;
await db.exec('SET ROLE service_role');
await assert.rejects(create('ABC234'),/duplicate key/);await db.exec('RESET ROLE');assert.deepEqual(await snapshot(),original);checks++;
await db.exec('SET ROLE service_role');
await assert.rejects(create('INVALID'),/Invalid League Night/);
await assert.rejects(create('NEW234',[{display_name:''}]),/Invalid League Night roster/);
await assert.rejects(create('NEW234',Array.from({length:501},()=>({display_name:'Player'}))),/at most 500/);
await db.exec('RESET ROLE');assert.deepEqual(await snapshot(),original);checks+=3;
await db.exec('SET ROLE service_role');const result=await create();await db.exec('RESET ROLE');
const event=result.rows[0].event;const after=await snapshot();
assert.equal(after[0].length,2);assert.equal(after[1].length,2);assert.equal(after[2].length,3);assert.equal(after[3].length,2);
for(let i=0;i<tables.length;i++)for(const row of original[i])assert(after[i].some(candidate=>JSON.stringify(candidate)===JSON.stringify(row)),`existing ${tables[i]} data intact`);
const directory=after[3].find(r=>r.code==='NEW234');assert.equal(directory.external_session_id,event.id);assert.equal(directory.participation_model,'HOSTED_ROSTER');
assert(after[2].some(p=>p.pdga_number===314732&&p.rating===876&&p.division==='MA2'&&p.source==='doubles'));checks++;
await db.exec('SET ROLE service_role');
await assert.rejects(db.exec("UPDATE ppl_league_events SET name='Forbidden'"),/permission denied/);
await assert.rejects(db.exec('DELETE FROM ppl_league_events'),/permission denied/);
await db.exec("UPDATE ppl_league_events SET status='open',updated_at='2000-01-01' WHERE join_code='NEW234'");
const renewed=await db.query("SELECT updated_at FROM ppl_league_events WHERE join_code='NEW234'");assert(Date.parse(renewed.rows[0].updated_at)>Date.now()-60000,'trigger supplies server time');
await db.exec('RESET ROLE');checks+=3;
const rls=await db.query("SELECT relrowsecurity FROM pg_class WHERE relname IN ('ppl_league_events','ppl_league_roster','ppl_league_activities','ppl_room_registry','ppl_clear_stack_rooms') AND relkind='r'");assert(rls.rows.every(r=>r.relrowsecurity));checks++;
console.log(`PASS: ${checks} transaction/security assertions; failures at all four stages and second roster row roll back completely; existing records unchanged.`);
await db.close();
