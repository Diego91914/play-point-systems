import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, basename, sep } from 'node:path';
import { MASTER_GAME_CATALOG } from '../lib/play-point-core/master-game-catalog.ts';

// Capture genuine anonymous launch interfaces, never synthesized game state.
// Only loopback servers are permitted; run them without production credentials.
const appOrigin = process.env.PREVIEW_APP_ORIGIN || 'http://127.0.0.1:3003';
const shotOrigin = process.env.PREVIEW_SHOT_ORIGIN || 'http://127.0.0.1:3002';
for (const origin of [appOrigin, shotOrigin]) {
  const url = new URL(origin);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Capture requires an isolated loopback server');
}
const revision = (cwd) => execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
for (const source of [resolve(process.env.PREVIEW_APP_SOURCE || '../preview-capture-source'), resolve(process.env.PREVIEW_SHOT_SOURCE || '../shot-caddy-web')]) {
  const changes = execFileSync('git', ['diff', 'HEAD', '--name-only'], { cwd: source, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  if (changes.some(file => !['proxy.ts', 'next.config.ts', 'next-env.d.ts'].includes(file))) throw new Error(`Uncommitted source changes invalidate capture provenance: ${source}`);
}
const sourceRevisions = {
  'Diego91914/play-point-systems': revision(resolve(process.env.PREVIEW_APP_SOURCE || '../preview-capture-source')),
  'Diego91914/shot-caddy-web': revision(resolve(process.env.PREVIEW_SHOT_SOURCE || '../shot-caddy-web')),
};
const output = 'public/images/game-previews';
const evidence = 'test-results/preview-capture';
await mkdir(output, { recursive: true });
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch(process.env.PREVIEW_BROWSER_PATH
  ? { executablePath: process.env.PREVIEW_BROWSER_PATH }
  : { channel: 'chrome' });
const entries = [];
const groups = Map.groupBy(MASTER_GAME_CATALOG, (game) => game.launchHref);
try {
  for (const [launchHref, games] of groups) {
    const id = games[0].id;
    if (process.env.PREVIEW_ONLY && id !== process.env.PREVIEW_ONLY) continue;
    const isShot = launchHref.startsWith('/shot-caddy/');
    const sourceRepository = isShot ? 'Diego91914/shot-caddy-web' : 'Diego91914/play-point-systems';
    const route = id === 'play-point-trivia' ? '/games/trivia/builder' : launchHref;
    const origin = isShot ? shotOrigin : appOrigin;
    const sourceUrl = new URL(route, origin).href;
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const blocked = [];
    const allowed = [];
    const errors = [];
    await context.route('**/*', async (intercept) => {
      const request = intercept.request();
      const url = new URL(request.url());
      const method = request.method();
      const api = url.pathname.includes('/api/');
      const triviaCatalog = url.origin === appOrigin && url.pathname === '/api/trivia/catalog';
      const safe = ['GET', 'HEAD'].includes(method) && url.origin === origin && (!api || triviaCatalog);
      if (!safe) {
        blocked.push({ method, url: request.url(), resourceType: request.resourceType() });
        return intercept.abort('blockedbyclient');
      }
      allowed.push({ method, url: request.url(), resourceType: request.resourceType() });
      return intercept.continue();
    });
    await context.routeWebSocket('**/*', (socket) => {
      const url = new URL(socket.url());
      // Turbopack waits for its development socket before hydrating the real UI.
      if (url.host === new URL(origin).host && url.pathname.endsWith('/_next/webpack-hmr')) socket.connectToServer();
      else socket.close();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(sourceUrl, { waitUntil: 'networkidle', timeout: 90000 });
    if (!response?.ok()) throw new Error(`${id}: HTTP ${response?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('h1').first().waitFor();
    await page.waitForTimeout(1000); // Let initial anonymous effects and images settle.
    if (id === 'quest-digital') await page.getByText('Sign in to begin or resume your Living RPG.').waitFor({ timeout: 30000 });
    if (id === 'play-point-trivia') await page.getByRole('button', { name: /create|host/i }).first().waitFor({ timeout: 30000 });
    const body = await page.locator('body').innerText();
    if (new URL(page.url()).pathname.includes('/sign-in')) throw new Error(`${id}: capture reached sign-in instead of the game interface`);
    await writeFile(`${evidence}/${id}.txt`, body);
    if (errors.length || /Application error:|Missing Supabase credentials/.test(body)) throw new Error(`${id}: ${errors.join('; ') || 'error screen'}`);
    // Viewport screenshot: no CSS/DOM alteration, compositing, or substituted API data.
    const crop = id === 'quest-disc-golf' ? { x: 0, y: 0, width: 1280, height: 720 } : undefined;
    const png = await page.screenshot({ path: `${evidence}/${id}.png`, ...(crop ? { clip: crop } : {}) });
    const height = crop?.height || 960;
    const rawSha256 = createHash('sha256').update(png).digest('hex');
    const files = [];
    for (const width of [480, 800, 1280]) {
      const path = `${output}/${id}-${rawSha256.slice(0, 12)}-${width}.webp`;
      const bytes = await sharp(png).resize({ width }).webp({ quality: 82 }).toBuffer();
      await writeFile(path, bytes);
      files.push({ src: `/${path.replace(/^public\//, '')}`, width, height: Math.round(width * height / 1280), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    const shared = games.length > 1;
    const label = shared
      ? `${games[0].parentTitle} shared format selector · ${games.map(g => g.title.split(' · ')[1]).join(' / ')} · screenshot`
      : id === 'play-point-trivia' ? 'Trivia host builder · anonymous setup screenshot'
      : id === 'quest-digital' ? 'Digital Adventure · signed-out launch screenshot'
      : id === 'quest-disc-golf' ? 'Disc Golf · launch instructions screenshot (portrait section outside capture)'
      : `${games[0].title} · launch / setup screenshot`;
    entries.push({ id, gameIds: games.map(g => g.id), launchHref, captureRoute: route, sourceUrl, resolvedUrl: page.url(), sourceRepository, sourceRevision: sourceRevisions[sourceRepository], capturedAt: new Date().toISOString(), width: 1280, height, ...(crop ? { crop } : {}), label, alt: label, sharedSelector: shared, files, rawSha256, environment: isShot ? 'Local development; anonymous; unreachable backend; service workers blocked; no UI alterations' : 'Disposable local source checkout; account proxy replaced with loopback read-only gate; production rewrites removed; dev indicator disabled; anonymous; no backend credentials; service workers blocked; unchanged game components', blockedRequests: blocked, allowedApiRequests: allowed.filter(r => new URL(r.url).pathname.includes('/api/')), pageErrors: errors });
    await writeFile(`${evidence}/${id}-network.json`, JSON.stringify({ allowed, blocked, errors }, null, 2));
    console.log(`${id}: captured ${page.url()} (${blocked.length} blocked requests)`);
    await context.close();
  }
  const manifestPath = 'lib/play-point-core/game-preview-manifest.json';
  const captures = process.env.PREVIEW_ONLY
    ? JSON.parse(await readFile(manifestPath, 'utf8')).captures.map(c => entries.find(e => e.id === c.id) || c)
    : entries;
  if (process.env.PREVIEW_ONLY && entries.length !== 1) throw new Error('Unknown capture id');
  await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, captures }, null, 2) + '\n');
  const currentFiles = new Set(captures.flatMap(c => c.files.map(f => basename(f.src))));
  const root = resolve(output);
  for (const name of await readdir(root)) {
    const target = resolve(root, name);
    if (!target.startsWith(root + sep)) throw new Error('Asset cleanup outside capture directory');
    if (!currentFiles.has(name) && /^[a-z0-9-]+-(?:[a-f0-9]{12}-)?(480|800|1280)\.webp$/.test(name)) await unlink(target);
  }
} finally {
  await browser.close();
}
