import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(fs.readFileSync('supabase/tests/fixtures/league-night-transaction.sql','utf8'));
for (const name of ['20261009233921_legacy_session_directory_codes.sql','20261009235737_hosted_session_activity.sql','20261010002712_clear_stack_owner_recovery.sql']) await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
await db.exec(`CREATE TABLE ppl_clear_stack_room_players(id uuid DEFAULT gen_random_uuid(),room_id uuid,display_name text,score numeric,rounds jsonb);
UPDATE ppl_clear_stack_rooms SET host_session_id='owner',status='playing' WHERE code='CTS234';
INSERT INTO ppl_clear_stack_room_players(room_id,display_name,score,rounds) SELECT id,'Existing player',12.5,'[4,3,2]' FROM ppl_clear_stack_rooms;
INSERT INTO ppl_clear_stack_rooms(code,host_session_id,status) VALUES('CLO234','owner','closed'),('COL234','owner','playing'),('NUL234',NULL,'playing'),('OLD234',NULL,'open');
UPDATE ppl_clear_stack_rooms SET host_user_id='11111111-1111-4111-8111-111111111111' WHERE code='OLD234';
INSERT INTO ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id) VALUES('COL234','game.on_my_list','/other','OPEN_LOBBY','unrelated');`);
const rows=async(table)=>(await db.query(`SELECT to_jsonb(t) AS row FROM ${table} t ORDER BY to_jsonb(t)::text`)).rows.map(r=>r.row);
const players=await rows('ppl_clear_stack_room_players');
const recover=async(owner,code)=>(await db.query('SELECT ppl_recover_clear_stack_room($1,$2) AS room',[owner,code])).rows[0].room;
let checks=0;
for (const role of ['anon','authenticated']) {
 await db.exec('SET ROLE '+role);await assert.rejects(recover('owner','CTS234'),/permission denied/);checks++;await db.exec('RESET ROLE');
}
const unchanged=await rows('ppl_clear_stack_rooms');
await db.exec('SET ROLE service_role');
for (const [owner,code,error] of [['other','CTS234',/not found or not owned/],['owner','CLO234',/closed/],['owner','NUL234',/not found or not owned/],['owner','BAD',/Invalid/],['owner','COL234',/another session/]]) {
 await assert.rejects(recover(owner,code),error);checks++;
}
await db.exec('RESET ROLE');assert.deepEqual(await rows('ppl_clear_stack_rooms'),unchanged);checks++;
const before=(await db.query("SELECT to_jsonb(t)-'updated_at' AS room FROM ppl_clear_stack_rooms t WHERE code='CTS234'")).rows[0].room;
await db.exec('SET ROLE service_role');
const room=await recover('owner','CTS234');assert.equal(room.code,'CTS234');assert.equal(room.status,'playing');checks++;
await db.exec('RESET ROLE');
const entry=(await db.query("SELECT * FROM ppl_room_registry WHERE code='CTS234'")).rows[0];
assert.equal(entry.external_session_id,room.id);assert.equal(entry.participation_model,'HOSTED_ROSTER');assert.equal(entry.join_href,'/games/clear-the-stack/join/CTS234');checks++;
assert.deepEqual((await db.query("SELECT to_jsonb(t)-'updated_at' AS room FROM ppl_clear_stack_rooms t WHERE code='CTS234'")).rows[0].room,before);assert.deepEqual(await rows('ppl_clear_stack_room_players'),players);checks++;
await db.exec('SET ROLE service_role');for(let i=0;i<3;i++)await recover('owner','CTS234');await db.exec('RESET ROLE');
assert.deepEqual((await db.query("SELECT * FROM ppl_room_registry WHERE code='CTS234'")).rows[0],entry);assert.deepEqual(await rows('ppl_clear_stack_room_players'),players);checks++;
await db.exec("INSERT INTO ppl_room_registry(code,game_sku,join_href,participation_model,expires_at) VALUES('OLD234','game.clear_the_stack','/games/clear-the-stack/join/OLD234','HOSTED_ROSTER','2000-01-01')");
const old=(await db.query("SELECT * FROM ppl_room_registry WHERE code='OLD234'")).rows[0];
await db.exec('SET ROLE service_role');assert.equal((await recover('11111111-1111-4111-8111-111111111111','OLD234')).status,'open');await db.exec('RESET ROLE');
assert.deepEqual((await db.query("SELECT * FROM ppl_room_registry WHERE code='OLD234'")).rows[0],old);checks++;
await db.exec("UPDATE ppl_room_registry SET external_session_id='other-room' WHERE code='OLD234'; SET ROLE service_role");
await assert.rejects(recover('11111111-1111-4111-8111-111111111111','OLD234'),/another session/);checks++;
await db.exec("RESET ROLE; UPDATE ppl_clear_stack_rooms SET status='closed' WHERE code='CTS234'; SET ROLE service_role");
await assert.rejects(recover('owner','CTS234'),/closed/);checks++;
await db.exec("RESET ROLE; INSERT INTO ppl_clear_stack_rooms(code,host_session_id) VALUES('ERR234','owner'); CREATE FUNCTION test_recovery_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'RECOVERY_FAILURE'; END $$; CREATE TRIGGER test_recovery_failure BEFORE UPDATE ON ppl_clear_stack_rooms FOR EACH ROW EXECUTE FUNCTION test_recovery_failure(); SET ROLE service_role");
await assert.rejects(recover('owner','ERR234'),/RECOVERY_FAILURE/);await db.exec('RESET ROLE');assert.equal((await db.query("SELECT count(*)::integer AS n FROM ppl_room_registry WHERE code='ERR234'")).rows[0].n,0);checks++;
assert.deepEqual(await rows('ppl_clear_stack_room_players'),players);checks++;
console.log(`PASS: ${checks} recovery assertions: original code/status/player scores preserved, duplicate/existing entry idempotent, legacy owner verified, collisions/unowned/closed/unauthorized denied, write failure rolled back.`);
await db.close();
