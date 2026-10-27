// Read-only local check; never executes a migration or repairs migration history.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('docs/approved-release-migration-manifest.json','utf8'));
const evidence=JSON.parse(fs.readFileSync(process.env.MIGRATION_HISTORY_SNAPSHOT || 'docs/production-readiness-schema-evidence.json','utf8'));
const applied=new Set(evidence.migrationHistory.map(x=>x.version));
assert.equal(manifest.production_authorized,false);
assert.equal(manifest.migrations.length,6);
assert.ok(applied.has(manifest.already_applied_registry_version));
for(const m of manifest.migrations){
 assert.equal(applied.has(m.version),false,`Migration ${m.version} is already applied; reconcile before release`);
 assert.equal(createHash('sha256').update(fs.readFileSync(m.path)).digest('hex'),m.sha256,`Migration content changed: ${m.path}`);
 assert.ok(!m.path.includes('20261004_play_amplified_room_registry'));
}
console.log('PASS: six exact pending migration files/hashes checked against the read-only production history snapshot; repaired registry excluded.');
