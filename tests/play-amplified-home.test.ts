import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("app/play-amplified/page.tsx", "utf8");
const pwa = readFileSync("app/play-amplified/PlayAmplifiedPwa.tsx", "utf8");
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

  it("dismisses the compact remembered-game prompt for the browser session", () => {
    expect(pwa).toContain("play-amplified-resume-dismissed");
    expect(pwa).toContain("max-w-2xl");
    expect(pwa).toContain("RESUME");
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
});
