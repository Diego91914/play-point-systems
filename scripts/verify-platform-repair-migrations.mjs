const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE TABLE ppl_league_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id text, name text);
CREATE TABLE ppl_league_activities(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid, name text);
CREATE TABLE ppl_league_roster(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid, display_name text, checked_in boolean);
ALTER TABLE ppl_league_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppl_league_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppl_league_roster ENABLE ROW LEVEL SECURITY;
INSERT INTO ppl_league_events(name) VALUES ('existing league');
CREATE TABLE ppl_room_registry(code text PRIMARY KEY CHECK(code ~ '^[A-Z2-9]{6}$'));
INSERT INTO ppl_room_registry VALUES ('ABC234');
ALTER TABLE ppl_room_registry ENABLE ROW LEVEL SECURITY;`);
const root=new URL('../supabase/migrations/', import.meta.url);
for (const name of fs.readdirSync(root).filter(n=>n.includes('league_night_server_permissions') || n.includes('legacy_session_directory_codes'))) await db.exec(fs.readFileSync(new URL(name, root),'utf8'));
await db.exec(`SET ROLE service_role; INSERT INTO ppl_league_events(name) VALUES ('new league');
INSERT INTO ppl_league_activities(name) VALUES ('new activity');
INSERT INTO ppl_league_roster(display_name,checked_in) VALUES ('Guest',false);
UPDATE ppl_league_roster SET checked_in=true;`);
assert.equal((await db.query('SELECT count(*)::int AS n FROM ppl_league_events')).rows[0].n,2);
for (const table of ['ppl_league_events','ppl_league_activities','ppl_league_roster']) await assert.rejects(db.exec('DELETE FROM '+table), /permission denied/);
await assert.rejects(db.exec("UPDATE ppl_league_events SET name='forbidden'"), /permission denied/);
for (const role of ['anon','authenticated']) {
 await db.exec('RESET ROLE; SET ROLE '+role);
 for (const table of ['ppl_league_events','ppl_league_activities','ppl_league_roster']) {
  await assert.rejects(db.query('SELECT * FROM '+table), /permission denied/);
 }
}
await db.exec('RESET ROLE');
const flags=await db.query(`SELECT relrowsecurity FROM pg_class WHERE relname LIKE 'ppl_league_%' AND relkind = 'r'`);
assert(flags.rows.every(r=>r.relrowsecurity));
await db.exec(`INSERT INTO ppl_room_registry VALUES ('ABC010')`);
await assert.rejects(db.exec(`INSERT INTO ppl_room_registry VALUES ('BAD!01')`), /check constraint/);
assert.equal((await db.query('SELECT count(*)::int AS n FROM ppl_room_registry')).rows[0].n,2);
console.log('PASS: service-role operations, 6 denied browser reads, existing rows/RLS retained, legacy codes accepted, malformed codes denied.');
await db.close();
