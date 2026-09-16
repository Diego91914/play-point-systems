import { execFileSync } from 'node:child_process';
import { existsSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Disposable source checkout. Never change the application's access controls.
const source = resolve('../preview-capture-source');
if (existsSync(source)) throw new Error(`Already exists: ${source}. Use a fresh checkout for a new capture revision.`);
execFileSync('git', ['worktree', 'add', '--detach', source, 'HEAD'], { stdio: 'inherit' });
symlinkSync(resolve('node_modules'), resolve(source, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
writeFileSync(resolve(source, 'proxy.ts'), `
import { NextRequest, NextResponse } from 'next/server';
// Capture harness only: anonymous local page rendering, no room/account mutations.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const local = ['127.0.0.1', 'localhost'].includes(request.nextUrl.hostname);
  if (!local || !['GET', 'HEAD'].includes(request.method) || (path.startsWith('/api/') && path !== '/api/trivia/catalog')) {
    return new NextResponse('Capture harness: request blocked', { status: 403 });
  }
  return NextResponse.next();
}
export const config = { matcher: ['/:path*'] };
`);
writeFileSync(resolve(source, 'next.config.ts'), `
import type { NextConfig } from 'next';
import { resolve } from 'node:path';
const config: NextConfig = { devIndicators: false, turbopack: { root: resolve(__dirname, '..') } };
export default config;
`);
// No production config copied. No service-role credentials, database, or API secrets.
writeFileSync(resolve(source, '.env.local'), 'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=capture-anonymous-no-backend\n');
console.log(`Prepared ${source}. Run node scripts/start-preview-capture.mjs app from the implementation checkout.`);
