import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("app/play-amplified/page.tsx", "utf8");
const pwa = readFileSync("app/play-amplified/PlayAmplifiedPwa.tsx", "utf8");
const resumeRuntime = readFileSync("app/play-amplified/PlayAmplifiedResumeRuntime.ts", "utf8");
const worker = readFileSync("public/play-amplified-sw.js", "utf8");
const manifest = readFileSync("app/play-amplified-manifest.webmanifest/route.ts", "utf8");
const featuredArt = readFileSync("app/play-amplified/FeaturedGameArt.tsx", "utf8");
const coverArt = readFileSync("app/play-amplified/GameCoverArt.tsx", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");

describe("Play Amplified consumer home", () => {
  it("keeps the four primary play actions on the front door", () => {
    expect(home).toContain('href: "/play/host"');
    expect(home).toContain('href: "/play/join"');
    expect(home).toContain('href: "/games"');
    expect(home).toContain('href: "/live/quick-score"');
  });

  it("keeps Play now compact so games remain the visual focus", () => {
    expect(home).toContain('type QuickActionKind = "host" | "join" | "games" | "score"');
    expect(home).toContain("Instant access");
    expect(home).toContain("Play now");
    expect(home).toContain("grid grid-cols-2 gap-2 sm:grid-cols-4");
    expect(home).toContain("<QuickActionIcon kind={action.kind} />");
    expect(home).not.toContain("min-h-40");
  });

  it("keeps previews inside their real catalog lanes", () => {
    for (const lane of ["social", "course", "backyard", "adventure", "trivia"]) {
      expect(home).toContain(`getMasterGamesByLane("${lane}")`);
    }
    expect(home).not.toContain('.filter((game) => game.status === "live")');
    expect(home).not.toContain("PREVIEW_GAME_FORMATS.map");
  });

  it("uses editorial hierarchy instead of a uniform dashboard grid", () => {
    expect(home).toContain("function LeadGameCard");
    expect(home).toContain("function EditorialGameCard");
    expect(home).toContain("Featured in this category");
    expect(home).toContain("Games with their own world.");
    expect(home).toContain("lg:grid-cols-2");
    expect(home).toContain("md:grid-cols-3");
    expect(home).not.toContain("xl:grid-cols-5");
    expect(home).not.toContain("View game →");
  });

  it("gives the five signature games large editorial artwork", () => {
    for (const id of ["shot-classic", "clear-the-stack", "phone-holdem", "live-craps", "quest-digital"]) {
      expect(home).toContain(`"${id}"`);
      expect(featuredArt).toContain(`gameId === "${id}"`);
    }
    expect(home).toContain("<FeaturedGameArt gameId={id} />");
    expect(home).toContain("min-h-[360px]");
  });

  it("uses immersive full-bleed game art for the full library", () => {
    const ids = [
      "chain-reaction", "how-close", "on-my-list", "all-about-you", "inside-man", "phone-holdem", "live-craps", "last-call",
      "shot-classic", "shot-chaos", "battle-mode", "call-your-score", "challenge-skins-pro", "wolf", "redemption-wolf", "wolf-pack",
      "card-shark-classic", "card-shark-stud", "card-shark-draw", "atw-ladder", "atw-sprint", "atw-survival", "disc-warrior", "clear-the-stack",
      "quest-digital", "quest-disc-golf", "play-point-trivia",
    ];
    expect(home).toContain('import { GameCoverArt } from "./GameCoverArt"');
    expect(home).toContain("<GameCoverArt gameId={game.id} immersive />");
    expect(coverArt).toContain("const covers: Record<string, CoverIdentity>");
    expect(coverArt).toContain("data-game-cover={gameId}");
    expect(coverArt).toContain("immersive = false");
    for (const id of ids) expect(coverArt).toContain(id);
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

  it("keeps installation collapsed until the user asks for it", () => {
    expect(pwa).toContain("play-amplified-install-dismissed");
    expect(pwa).toContain("installCardOpen");
    expect(pwa).toContain("Keep it one tap away");
    expect(pwa).toContain('aria-expanded={installHelpOpen}');
    expect(pwa).toContain('{installHelpOpen ? "HIDE" : "HOW"}');
    expect(pwa).toContain("Install app");
    expect(pwa).toContain("bottom-4 right-4");
    expect(pwa).not.toContain("fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl overflow-hidden");
  });

  it("does not render PWA chrome until the browser confirms a Play Amplified host", () => {
    expect(pwa).toContain("const [clientReady, setClientReady] = useState(false);");
    expect(pwa).toContain("setClientReady(true);");
    expect(pwa).toContain("if (!clientReady) return null;");
  });

  it("keeps the installed icon as a permanent launcher while app releases update in place", () => {
    expect(worker).toContain('const CACHE_NAME = "play-amplified-shell-v4"');
    expect(worker).not.toContain('  "/play-amplified",');
    expect(worker).toContain('fetch(request, { cache: "no-store" })');
    expect(worker).toContain('caches.match("/offline")');
    expect(manifest).toContain('id: "/"');
    expect(manifest).toContain('start_url: "/play-amplified?source=pwa"');
    expect(manifest).toContain('"cache-control": "no-cache, no-store, must-revalidate"');
    expect(pwa).toContain('updateViaCache: "none"');
    expect(pwa).toContain('addEventListener("controllerchange", onControllerChange)');
    expect(pwa).toContain('addEventListener("visibilitychange", updateServiceWorker)');
    expect(pwa).toContain('addEventListener("pageshow", updateServiceWorker)');
    expect(pwa).toContain("window.location.reload()");
    expect(nextConfig).toContain('source: "/play-amplified-sw.js"');
    expect(nextConfig).toContain('value: "no-cache, no-store, must-revalidate"');
    expect(proxy).toContain('target.pathname = "/play-amplified"');
    expect(proxy).toContain('response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")');
  });
});
