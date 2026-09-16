import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const kind = process.argv[2];
if (!['app', 'shot'].includes(kind)) throw new Error('Usage: node scripts/start-preview-capture.mjs app|shot');
const source = resolve(kind === 'app' ? process.env.PREVIEW_APP_SOURCE || '../preview-capture-source' : process.env.PREVIEW_SHOT_SOURCE || '../shot-caddy-web');
const captureEnv = 'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=capture-anonymous-no-backend\n';
for (const file of readdirSync(source).filter(file => /^\.env(?:\.|$)/.test(file) && !file.endsWith('.example'))) {
  if (!(kind === 'app' && file === '.env.local' && readFileSync(resolve(source, file), 'utf8') === captureEnv)) throw new Error(`Refusing backend configuration in capture source: ${file}`);
}
// Do not inherit database, account, signing, service-role, or payment secrets.
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|PROCESSOR_ARCHITECTURE)$/i.test(key)));
Object.assign(env, {
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'capture-anonymous-no-backend',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'capture-anonymous-no-backend',
});
const require = createRequire(resolve(source, 'package.json'));
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', kind === 'app' ? '3003' : '3002'], { cwd: source, env, stdio: 'inherit' });
child.on('exit', code => { process.exitCode = code || 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
