# Authentic game screenshots

The Play Amplified catalog and game detail pages render static, local WebP screenshots. They do not embed or import game runtimes. Catalog cards keep `href` (consumer detail), and launch buttons keep `launchHref` (actual game destination). All Next Links on these surfaces explicitly disable prefetch. The existing install/resume helper still reads saved sessions without modifying them; its service worker now precaches the static catalog rather than `/games` and `/play`.

`lib/play-point-core/game-preview-manifest.json` maps every catalog ID to a capture, original route/query, resolved URL, repository/revision, UTC timestamp, dimensions, capture environment, blocked requests, and SHA-256 checksums. Asset filenames contain the raw capture hash so an existing image cache cannot keep an old screenshot after a refresh. Three WebP sizes (480, 800, 1280 pixels) bound transfer and decoded-image size. The renderer reserves a 4:3 frame, contains the full screenshot without cropping, lazy-loads images, and shows an explicit text failure state instead of artwork or a game runtime.

## What the images represent

- Social games show their actual anonymous launch/setup interfaces, not rooms with invented players or rounds. Protected pages were rendered through a disposable local account-proxy harness; production authentication is unchanged.
- Classic and Chaos were captured from their respective existing variant queries after hydration.
- Card Shark Classic/Stud/Draw share the real Card Shark selector. Around the World Ladder/Sprint/Survival share their actual format overview/selector. Captions identify the shared screen rather than claiming distinct in-game states.
- Call Your Score retains `/shot-caddy/mode/cys`; its existing redirect resolves to `/shot-caddy/cys` during capture.
- Quest Digital shows its genuine signed-out launch screen. It requires an account to show a Chronicle, so no authenticated or fabricated Chronicle was captured.
- Quest Disc Golf shows the actual launch instructions, cropped to the top 1280×720 region of a 1280×960 viewport. The portrait section is outside that region. Its portrait GET endpoint can generate artwork and upload to storage; it remains blocked during capture. No artwork was substituted.
- Trivia shows `/games/trivia/builder`, with the built-in Bible catalog supplied by the real read-only catalog handler. No production published catalog or host session was loaded. Its existing consumer launch destination `/games/trivia` is unchanged.
- These are local source-revision captures, not claims about authenticated production sessions or the deployed Shot Caddy revision. Development chrome visible in Shot Caddy captures is part of the actual captured screen.

## Safe refresh procedure

Use Node 22.18+ (native TypeScript stripping), locked dependencies (`npm ci`), and an installed Chrome. `PREVIEW_BROWSER_PATH` can select another compatible Chromium executable. Do not use a personal browser profile, storage-state file, real cookie, or account token.

1. Verify this checkout's HEAD and the intended Shot Caddy source revision. Use a clean sibling checkout named `shot-caddy-web`, with its own `npm ci`. Never use a checkout containing production `.env` files. Inspect changed game routes and initial effects before recapture, including GET endpoints; GET is not automatically read-only.
2. Run `npm run previews:prepare`. This creates a detached sibling worktree `preview-capture-source` from the current committed HEAD and links the installed dependencies. It changes only that disposable checkout's proxy, Next configuration, and dummy environment file. The proxy allows loopback GET/HEAD page rendering, rejects mutating methods and all API routes except the audited Trivia catalog, and does not authorize a user or fabricate game state. Production rewrites are removed there. Its changed files must never be committed or deployed.
3. In separate terminals, from the implementation checkout, run:

   ```text
   node scripts/start-preview-capture.mjs app
   node scripts/start-preview-capture.mjs shot
   ```

   These bind ports 3003 and 3002 only to loopback. The launcher refuses unexpected `.env` files and starts with a small environment allowlist, no inherited credentials, and an unreachable local Supabase URL. Existing environment/auth policies on deployed games are untouched. If the preparation worktree already exists, preserve any needed evidence and remove it with normal Git worktree tooling before preparing a new revision. Do not point captures at a stale server.
4. Run `npm run previews:capture`. Each of the 22 distinct routes gets a new anonymous browser context with service workers blocked. Non-GET/HEAD requests, other origins, and APIs are denied except the real local Trivia catalog GET. Game sockets are blocked; only the loopback Next development HMR socket is allowed so hydration can finish. The script does not click create/join/play, replace responses with mock data, change CSS/DOM, or seed storage. It rejects sign-in redirects and page errors. Inspect any new blocked request before accepting the assets.
5. Inspect **every** capture in `test-results/preview-capture/`, its text and network record, and the resulting captions. Confirm the expected title/variant/setup state, loaded UI, no names/tokens/room codes, and no account/session content. Raw PNGs and network logs are local review evidence; optimized WebPs and manifest are committed deliverables. `PREVIEW_ONLY=<capture id>` refreshes a single existing capture; for example use `card-shark-classic` for its shared selector. Partial failures never replace the manifest. A successful run removes superseded generated WebPs from the dedicated asset folder.
6. Run `npm run previews:validate`, `npm test`, `npm run build`, `npx tsc --noEmit`, and `npm run lint`. Review failures against the unchanged baseline; do not repair unrelated game behavior as part of a screenshot refresh.
7. Start `npm start -- --hostname 127.0.0.1 --port 3004`, then `npm run test:previews`. The browser suite uses `http://localhost:3004` so the existing install/resume helper participates. `PREVIEW_TEST_BASE_URL` can change the tested origin. Desktop and mobile checks traverse every catalog/detail preview, exercise hover/focus/client navigation, verify images and destinations, compare local/session storage, cookies, and the Shot Caddy IndexedDB update queue, and reject game/API/mutation requests. Service workers remain enabled for these boundary tests. An independent failure test blocks images and verifies the safe fallback and preserved launch link.
8. Visually review representative desktop and mobile screenshots from `test-results/preview-browser/`. Stop capture servers. Review the complete diff before approval; do not merge or deploy automatically.

The snapshot fixture `tests/fixtures/game-preview-routes.json` records the handoff's mappings at `75f1aeede89dba5e0e26fff271646b76c5c13dc4`. A future intentional catalog change must update it explicitly alongside a genuine capture; never change launch destinations just to obtain a different screenshot.

## Verified architecture findings and follow-up boundaries

Read-only HTTP checks on 2026-09-16 returned `X-Frame-Options: DENY` for Classic both directly through the Shot Caddy Vercel zone and through the public Play Amplified proxy. The previous iframe architecture therefore could not reliably display it.

Shot Caddy source at `cae824c48b6f5bd36762df2ced70474e13f1c221` mounts offline queue flushing, resume migration, and a production `/sw.js` registration at root scope when its game shell renders. Public `https://playamplified.com/sw.js` serves the root-worker retirement script, whereas `/play-amplified-sw.js` serves Play Amplified's worker and `/shot-caddy/sw.js` serves the Shot Caddy worker. A root `/sw.js` registration from a proxied Shot Caddy page targets the retirement script on the outer origin and can replace the same-scope Play Amplified registration before unregistering. This is a source/URL interaction verified by source inspection and HTTP responses, not an observed authenticated production worker replacement: capture contexts deliberately blocked workers. Unifying/narrowing worker scopes for explicit game launches is separate engineering work.

The existing RoomInviteSessionGuard clears room credentials/retention on launches without a room code. Shot Caddy's offline sync and resume migration can write persisted game data when its runtime mounts. Live Craps' polling starts after a session exists; initial loading is not asserted to create a room. Removing runtime embeds prevents these effects during preview browsing without changing game implementations. The request boundary and dependency checks guard against reintroducing them.

Existing game-store failures, standalone test typing/lint debt, authenticated gameplay screenshots, and cross-app service-worker ownership are separate follow-ups. No product strategy, game design, unsupported variant routing, or commerce behavior is changed here.
