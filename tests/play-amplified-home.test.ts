import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("app/play-amplified/page.tsx", "utf8");
const pwa = readFileSync("app/play-amplified/PlayAmplifiedPwa.tsx", "utf8");
const gameHub = readFileSync("app/play-amplified/PlayAmplifiedGameHubState.tsx", "utf8");
const gameCards = readFileSync("app/play-amplified/PlayAmplifiedGameHubCards.tsx", "utf8");
const resumeRuntime = readFileSync("app/play-amplified/PlayAmplifiedResumeRuntime.ts", "utf8");
const worker = readFileSync("public/play-amplified-sw.js", "utf8");
const manifest = readFileSync("app/play-amplified-manifest.webmanifest/route.ts", "utf8");
const editorialCoverArt = readFileSync("app/play-amplified/EditorialGameCoverArt.tsx", "utf8");
const libraryCoverArt = readFileSync("app/play-amplified/GameCoverArt.tsx", "utf8");
const games = readFileSync("app/games/page.tsx", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");

describe("Play Amplified consumer home", () => {
  it("introduces the platform with compact Host and Explore actions", () => {
    expect(home).toContain("Play together.");
    expect(home).toContain("Stay in the moment.");
    expect(home).toContain("Explore games");
    expect(home).toContain("Host a game");
    expect(home).not.toContain("Last Call: Murder at Blackwood House</div>");
  });

  it("puts active and recently played games ahead of the catalog", () => {
    expect(home.indexOf("<GameHubActivityCards />")).toBeLessThan(home.indexOf("Explore our games"));
    expect(gameCards).toContain("Active game");
    expect(gameCards).toContain("Recently played");
    expect(gameCards).toContain("PLAY AGAIN");
    expect(gameHub).toContain('"pa_recently_played_game_v1"');
    expect(gameHub).toContain('localStorage.setItem(RECENT_GAME_STORAGE_KEY, JSON.stringify(recent))');
  });

  it("keeps storefront text at the navigation contrast floor", () => {
    const lowOpacityText = (source: string) =>
      [...source.matchAll(/text-(?:white|cyan-[0-9]+)[/]([0-9]+)/g)]
        .map((match) => Number(match[1]))
        .filter((opacity) => opacity < 55);
    expect(lowOpacityText(home)).toEqual([]);
    expect(lowOpacityText(pwa)).toEqual([]);
  });

  it("keeps previews inside their real catalog lanes", () => {
    for (const lane of ["social", "course", "backyard", "adventure", "trivia"]) {
      expect(home).toContain(`getMasterGamesByLane("${lane}")`);
    }
    expect(home).not.toContain('.filter((game) => game.status === "live")');
    expect(home).not.toContain("PREVIEW_GAME_FORMATS.map");
  });

  it("shows a two-column category dashboard and square game tiles", () => {
    expect(home).toContain("Disc Golf & Putting");
    expect(home).toContain("Trivia");
    expect(home).toContain("Social & Cards");
    expect(home).toContain("Mystery & Adventure");
    expect(home).toContain("grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4");
    expect(gameCards).toContain("aspect-square");
    expect(home).toContain("View all");
  });

  it("keeps Last Call secondary among cross-category featured games", () => {
    expect(home).toContain('const featuredIds = ["last-call", "clear-the-stack", "shot-chaos", "play-point-trivia"]');
    expect(home.indexOf('aria-labelledby="featured-games-heading"')).toBeGreaterThan(home.indexOf('id="game-categories"'));
    expect(home).toContain("Featured games");
    expect(home).not.toContain("min-h-[390px]");
  });

  it("uses immersive full-bleed game art for the full library", () => {
    const ids = [
      "chain-reaction", "how-close", "on-my-list", "all-about-you", "inside-man", "phone-holdem", "live-craps", "last-call",
      "shot-classic", "shot-chaos", "battle-mode", "call-your-score", "challenge-skins-pro", "wolf", "redemption-wolf", "wolf-pack",
      "card-shark-classic", "card-shark-stud", "card-shark-draw", "atw-ladder", "atw-sprint", "atw-survival", "disc-warrior", "clear-the-stack",
      "quest-digital", "quest-disc-golf", "play-point-trivia",
    ];
    expect(gameCards).toContain('import { EditorialGameCoverArt } from "./EditorialGameCoverArt"');
    expect(gameCards).toContain("<EditorialGameCoverArt gameId={game.id} immersive />");
    expect(editorialCoverArt).toContain("const covers: Record<string, CoverIdentity>");
    expect(editorialCoverArt).toContain("data-game-cover={gameId}");
    expect(editorialCoverArt).toContain("immersive = false");
    expect(games).toContain('import { GameCoverArt } from "@/app/play-amplified/GameCoverArt"');
    expect(games).toContain("<GameCoverArt gameId={game.id} />");
    for (const id of ids) {
      expect(editorialCoverArt).toContain(id);
      expect(libraryCoverArt).toContain(id);
    }
  });

  it("keeps active game credentials available through outages and foregrounds the current session", () => {
    expect(gameHub).toContain('await import("./PlayAmplifiedResumeRuntime")');
    expect(gameHub).toContain("await readResumeCandidates()");
    expect(gameHub).toContain('await import("./PlayAmplifiedGameHubEndAction")');
    expect(pwa).not.toMatch(/\bfetch\s*\(/);
    expect(resumeRuntime).not.toContain("RESUME_MAX_AGE_MS");
    expect(resumeRuntime).not.toContain("removeLocalKeys");
    expect(resumeRuntime).toContain('fetch("/api/games/social-room-control"');
    expect(resumeRuntime).toContain("validateTriviaResume");
    expect(resumeRuntime).toContain("payload?.ended === true");
    expect(resumeRuntime).toContain('connection = "offline"');
    expect(pwa).not.toContain("window.location.replace");
    expect(gameHub).toContain('addEventListener("pageshow", onResume)');
    expect(pwa).not.toContain("candidates.length - 1");
  });

  it("keeps a prominent Return to Game action without credential-clearing controls", () => {
    expect(gameCards).toContain("RETURN TO GAME");
    expect(gameCards).toContain("END GAME");
    expect(pwa).not.toContain("SAVE FOR LATER");
    expect(pwa).not.toContain("EXIT");
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
