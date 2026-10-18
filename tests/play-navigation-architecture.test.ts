import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const play = readFileSync("app/play/page.tsx", "utf8");
const library = readFileSync("app/games/page.tsx", "utf8");
const host = readFileSync("app/play/host/page.tsx", "utf8");
const join = readFileSync("app/play/join/page.tsx", "utf8");
const shell = readFileSync("app/components/SiteShell.tsx", "utf8");
const shellClient = readFileSync("app/components/SiteShellClient.tsx", "utf8");
const shellBrand = readFileSync("lib/site-shell-brand.ts", "utf8");
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
    expect(library).toContain('"clear-the-stack": "game.clear_the_stack"');
    expect(library).toContain('id="ready-to-play"');
    expect(library).toContain('href="/play-amplified"');
    expect(library).toContain('import { GameCoverArt } from "@/app/play-amplified/GameCoverArt"');
    expect(library).toContain("<GameCoverArt gameId={game.id} />");
    expect(library).toContain("Visual covers identify each game at a glance.");
    expect(library).not.toContain("StorefrontLane");
    expect(library).not.toContain("getStorefrontOffer");
    expect(library).not.toContain("Explore & buy");
  });

  it("limits the host path to actual shared-room games without using commerce as capability", () => {
    expect(host).toContain("ROOM_GAME_IDS");
    expect(host).toContain("MASTER_GAME_CATALOG");
    expect(host).not.toContain("PLAY_POINT_GAME_CATALOG");
    for (const gameId of [
      "chain-reaction",
      "how-close",
      "on-my-list",
      "all-about-you",
      "inside-man",
      "phone-holdem",
      "live-craps",
      "last-call",
      "play-point-trivia",
    ]) {
      expect(host).toContain(`"${gameId}"`);
    }
    expect(host).toContain("game.launchHref");
    expect(host).toContain("Host a room");
    expect(host).toContain("Host room →");
    expect(host).toContain("Play Amplified does not force every game into the same room flow.");
    expect(host).toContain('href="/games"');
  });

  it("renders Play Amplified shell identity without waiting for hostname detection", () => {
    for (const source of [play, library, host]) {
      expect(source).toContain('variant="play-amplified"');
    }
    expect(shell).toContain('variant?: "auto" | "company" | "play-amplified"');
    expect(shell).toContain("await headers()");
    expect(shell).toContain("isPlayAmplifiedShell(hostname, current)");
    expect(shell).toContain('variant === "play-amplified"');
    expect(shell).toContain('variant === "auto"');
    expect(shell).not.toContain("window.location.hostname");
    expect(shellClient).not.toContain("useSyncExternalStore");
    expect(join).not.toContain('"use client"');
    expect(join).toContain("GuestJoinGameClient");
    expect(join).toContain('<SiteShell current="play" variant="play-amplified">');
  });

  it("uses consumer navigation roles on the Play Amplified host", () => {
    expect(shellBrand).toContain('{ label: "Discover", href: "/play-amplified", key: "home" }');
    expect(shellBrand).toContain('{ label: "My Games", href: "/games", key: "games" }');
    expect(shellClient).toContain("getSiteShellNavigationItems(isPlayAmplifiedHost)");
    expect(shellClient).toContain("getSiteShellHomeHref(isPlayAmplifiedHost)");
    expect(shellClient).toContain('href="/play/join"');
  });

  it("uses the locked Game Changers terminology on active customer-facing surfaces", () => {
    for (const source of [productCatalog, masterCatalog, demos, scoreCaddy]) {
      expect(source).not.toContain("Special Plays");
      expect(source).not.toContain("power-ups");
      expect(source).not.toContain("Disruptive powers");
    }
    expect(productCatalog).toContain("Game Changers");
    expect(masterCatalog).toContain("Game Changers");
    expect(demos).toContain("Game Changers");
    expect(scoreCaddy).toContain("challenges, Game Changers, competitive formats");
  });
});
