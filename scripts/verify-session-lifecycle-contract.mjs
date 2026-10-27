import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const root = process.env.SC_SOURCE_ROOT;
if (!root) throw new Error('Set SC_SOURCE_ROOT to the companion Shot Caddy checkout.');
const scratch = await mkdtemp(join(tmpdir(), 'pa-contract-'));
const compile = async (source, target, replacements = []) => {
  let text = await readFile(source, 'utf8');
  for (const [from, to] of replacements) text = text.replace(from, to);
  await writeFile(join(scratch, target), ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
};
try {
  await compile(resolve(root, 'app/lib/roundProgress.ts'), 'progress.mjs');
  await compile(resolve(root, 'app/lib/sessionLifecycle.ts'), 'lifecycle.mjs', [['@/lib/roundProgress', './progress.mjs']]);
  await compile('lib/play-point-core/shot-caddy-session.ts', 'reader.mjs', [['import "server-only";', '']]);
  const {getSessionDirectoryLifecycle} = await import(pathToFileURL(join(scratch, 'lifecycle.mjs')));
  const {readShotCaddySession} = await import(pathToFileURL(join(scratch, 'reader.mjs')));
  const now = Date.parse('2026-10-10T12:00:00Z');
  const iso = hours => new Date(now + hours * 3600000).toISOString();
  const round = {gameMode: 'CLASSIC_GAME', totalHoles: 1, players: [{id:'p1',name:'Host'}], holes: []};
  let payload;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://shot-caddy-web.vercel.app/shot-caddy/api/sessions/ABC234');
    assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error');
    return new Response(JSON.stringify(payload));
  };
  const read = async (state, updated) => {
    payload = {success:true,sessionCode:'ABC234',roundId:'round-1',createdAt:iso(-72),roundState:state,directoryLifecycle:getSessionDirectoryLifecycle(state,updated,iso(-72),now)};
    return readShotCaddySession('ABC234', now);
  };
  const active = await read(round,iso(-1));
  assert.equal(active.expiresAt,iso(23)); assert.equal(active.externalSessionId,'round-1');
  assert.equal(active.joinHref,'/shot-caddy/join/ABC234'); assert.equal(active.participationModel,'HOSTED_ROSTER');
  assert.equal(await read(round,iso(-25)),null);
  assert.equal(await read({...round,holes:[{holeNumber:1,players:{p1:{strokes:3}}}]},iso(-1)),null);
  assert.equal((await read({...round,gameMode:'CALL_YOUR_SCORE',holes:[{holeNumber:1,players:{p1:{strokes:3}}}]},iso(-1))).gameSku,'shot_caddy.mode.cys');
  assert.equal(await read({...round,gameMode:'CHALLENGE_SKINS_PRO',holes:[{holeNumber:1,players:{p1:{strokes:null}},cspResolution:'carry'}]},iso(-1)),null);
  assert.equal((await read({...round,gameMode:'QUEST_CADDY'},iso(-1))).gameSku,'quest_caddy.experience');
  payload.sessionCode='OTHER1'; assert.equal(await readShotCaddySession('ABC234',now),null);
  assert.equal(await readShotCaddySession('CREATE',now),null);
  console.log('PASS: 8 cross-repository lifecycle cases; actual producer/consumer functions, mocked transport.');
} finally { await rm(scratch,{recursive:true,force:true}); }
