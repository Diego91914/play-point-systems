import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const play = readFileSync("app/play/page.tsx", "utf8");
const library = readFileSync("app/games/page.tsx", "utf8");
const host = readFileSync("app/play/host/page.tsx", "utf8");
const shell = readFileSync("app/components/SiteShell.tsx", "utf8");
const productCatalog = readFileSync("lib/play-point-core/games-catalog.ts", "utf8");
const masterCatalog = readFileSync("lib/play-point-core/master-game-catalog.ts", "utf8");
const demos = readFileSync("lib/play-point-core/game-experience-demos.ts", "utf8");
const scoreCaddy = readFileSync("app/live/page.tsx", "utf8");

describe("Play Amplified navigation roles", () => {
  it("keeps /play as a short action launcher instead of another catalog", () => {
    expect(play).toContain("Continue Playing");
    expect(play).toContain('href: "/play/host"');
    expect(play).toContain('href: "/play/join"');
    expect(play).toContain('href: "/live/quick-score"');
    expect(play).toContain('href: "/games"');
    expect(play).toContain('href="/play-amplified"');
    expect(play).not.toContain("PLAY_POINT_GAME_CATALOG");
    expect(play).not.toContain("PlayCategory");
  });

  it("keeps /games focused on owned access, Founder recognition, and visual covers", () => {
    expect(library).toContain("Founder · All Access");
    expect(library).toContain("Play now →");
    expect(library).toContain("MASTER_TO_PRODUCT_SKU");
    expect(library).toContain('id="ready-to-play"');
    expect(library).toContain('href="/play-amplified"');
    expect(library).toContain('import { GameCoverArt } from "@/app/play-amplified/GameCoverArt"');
    expect(library).toContain("<GameCoverArt gameId={game.id} />");
    expect(library).toContain("Visual covers identify each game at a glance.");
    expect(library).not.toContain("StorefrontLane");
    expect(library).not.toContain("getStorefrontOffer");
    expect(library).not.toContain("Explore & buy");
  });

  it("limits the host path to actual shared-room games", () => {
    expect(host).toContain("ROOM_GAME_SKUS");
    expect(host).toContain("Host a room");
    expect(host).toContain("Host room →");
    expect(host).toContain("Play Amplified does not force every game into the same room flow.");
    expect(host).toContain('href="/games"');
  });

  it("uses consumer navigation roles on the Play Amplified host", () => {
    expect(shell).toContain("playAmplifiedNavItems");
    expect(shell).toContain('{ label: "Discover", href: "/play-amplified", key: "home" }');
    expect(shell).toContain('{ label: "My Games", href: "/games", key: "games" }');
    expect(shell).toContain('href="/play/join"');
    expect(shell).toContain('isPlayAmplifiedHost ? "/play-amplified" : "/"');
  });

  it("uses the locked Game Changers terminology on active customer-facing surfaces", () => {
    for (const source of [productCatalog, masterCatalog, demos, scoreCaddy]) {
      expect(source).not.toContain("Special Plays");
      expect(source).not.toContain("power-ups");
      expect(source).not.toContain("Disruptive powers");
    }
    expect(productCatalog).toContain("Game Changers");
    expect(masterCatalog).toContain("disruptive Game Changers");
    expect(demos).toContain("GAME CHANGER");
    expect(scoreCaddy).toContain("challenges, Game Changers, competitive formats");
  });
});
