import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("app/play-amplified/page.tsx", "utf8");
const pwa = readFileSync("app/play-amplified/PlayAmplifiedPwa.tsx", "utf8");
const resumeRuntime = readFileSync("app/play-amplified/PlayAmplifiedResumeRuntime.ts", "utf8");
const worker = readFileSync("public/play-amplified-sw.js", "utf8");
const manifest = readFileSync("app/play-amplified-manifest.webmanifest/route.ts", "utf8");
const featuredArt = readFileSync("app/play-amplified/FeaturedGameArt.tsx", "utf8");

describe("Play Amplified consumer home", () => {
  it("keeps the four primary play actions on the front door", () => {
    expect(home).toContain('href: "/play/host"');
    expect(home).toContain('href: "/play/join"');
    expect(home).toContain('href: "/games"');
    expect(home).toContain('href: "/live/quick-score"');
  });

  it("presents primary actions as a native-style play launcher", () => {
    expect(home).toContain('type QuickActionKind = "host" | "join" | "games" | "score"');
    expect(home).toContain("Instant access");
    expect(home).toContain("Play now");
    expect(home).toContain("grid grid-cols-2 gap-3 sm:grid-cols-4");
    expect(home).toContain("<QuickActionIcon kind={action.kind} />");
  });

  it("keeps previews inside their real catalog lanes", () => {
    for (const lane of ["social", "course", "backyard", "adventure", "trivia"]) {
      expect(home).toContain(`getMasterGamesByLane("${lane}")`);
    }
    expect(home).not.toContain('.filter((game) => game.status === "live")');
    expect(home).not.toContain("PREVIEW_GAME_FORMATS.map");
  });

  it("uses a mobile swipe rail for featured games and balances the fifth category tile", () => {
    expect(home).toContain("snap-x snap-mandatory");
    expect(home).toContain("w-[82vw]");
    expect(home).toContain('index === 4 ? "col-span-2 lg:col-span-1"');
  });

  it("gives five flagship games distinct artwork while preserving authentic screenshots", () => {
    for (const id of ["shot-classic", "clear-the-stack", "phone-holdem", "live-craps", "quest-digital"]) {
      expect(home).toContain(`"${id}"`);
      expect(featuredArt).toContain(`gameId === "${id}"`);
    }
    expect(home).toContain("<GameScreenshot gameId={game.id} />");
    expect(home).toContain("<FeaturedGameArt gameId={featuredId} />");
    expect(home).toContain("xl:grid-cols-5");
  });

  it("only offers recent server-valid rooms instead of every historical local session", () => {
    expect(pwa).toContain('await import("./PlayAmplifiedResumeRuntime")');
    expect(pwa).not.toMatch(/\bfetch\s*\(/);
    expect(resumeRuntime).toContain("RESUME_MAX_AGE_MS = 24 * 60 * 60 * 1000");
    expect(resumeRuntime).toContain("readRecentRetention");
    expect(resumeRuntime).toContain('fetch("/api/games/social-room-control"');
    expect(resumeRuntime).toContain("validateTriviaResume");
    expect(resumeRuntime).toContain("payload?.ended === true");
    expect(resumeRuntime).toContain("removeLocalKeys(clearKeys)");
    expect(pwa).not.toContain("candidates.length - 1");
  });

  it("lets a player resume, save for later, or exit the remembered game explicitly", () => {
    expect(pwa).toContain("play-amplified-resume-dismissed");
    expect(pwa).toContain("max-w-2xl");
    expect(pwa).toContain("RESUME");
    expect(pwa).toContain("SAVE FOR LATER");
    expect(pwa).toContain("EXIT");
    expect(pwa).toContain("const exitResume = () =>");
    expect(pwa).toContain("removeLocalKeys(primary.clearKeys)");
    expect(pwa).not.toContain("current.slice(1)");
  });

  it("keeps installation compact and reveals manual instructions only on demand", () => {
    expect(pwa).toContain("play-amplified-install-dismissed");
    expect(pwa).toContain("installHelpOpen");
    expect(pwa).toContain("Keep it one tap away");
    expect(pwa).toContain('aria-expanded={installHelpOpen}');
    expect(pwa).toContain('{installHelpOpen ? "HIDE" : "HOW"}');
    expect(pwa).not.toContain("Add Play Amplified to your Home Screen");
  });

  it("does not render PWA chrome until the browser confirms a Play Amplified host", () => {
    expect(pwa).toContain("const [clientReady, setClientReady] = useState(false);");
    expect(pwa).toContain("setClientReady(true);");
    expect(pwa).toContain("if (!clientReady) return null;");
  });

  it("refreshes the installed PWA shell instead of pinning an old app surface", () => {
    expect(worker).toContain('const CACHE_NAME = "play-amplified-shell-v3"');
    expect(worker).toContain("fetch(request)");
    expect(worker).toContain('caches.match("/play-amplified")');
    expect(manifest).toContain('start_url: "/play-amplified?source=pwa"');
    expect(manifest).toContain('"cache-control": "no-cache, must-revalidate"');
    expect(pwa).toContain('SERVICE_WORKER_REFRESH_KEY = "play-amplified-sw-v3-reloaded"');
    expect(pwa).toContain('addEventListener("controllerchange", onControllerChange)');
    expect(pwa).toContain("window.location.reload()");
  });
});
