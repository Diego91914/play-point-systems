import { describe, expect, it } from "vitest";
import {
  PLAY_POINT_GAME_CATALOG,
  getSalesReadyCatalog,
} from "../lib/play-point-core/games-catalog";

const EXPECTED_SALES_READY_TITLES = [
  "Call Your Score",
  "Card Shark",
  "Chain Reaction",
  "Challenge Skins Pro",
  "How Close Are We?",
  "On My List",
  "Phone Hold'em",
  "Quest Caddy",
  "Shot Caddy Battle",
  "Shot Caddy Chaos",
  "Shot Caddy Classic",
  "The Inside Man",
] as const;

describe("Play Point game catalog", () => {
  it("keeps every catalog SKU unique", () => {
    const skus = PLAY_POINT_GAME_CATALOG.map((game) => game.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("publishes the complete sale-ready portfolio with one-time prices", () => {
    const ready = getSalesReadyCatalog();

    expect(ready.map((game) => game.title).sort()).toEqual(
      [...EXPECTED_SALES_READY_TITLES].sort(),
    );
    expect(ready.every((game) => game.priceUsd !== null && game.priceUsd > 0)).toBe(true);
    expect(ready.every((game) => game.badge === "Ready to sell")).toBe(true);
  });

  it("keeps Play Point Trivia clearly separated as a preview", () => {
    const trivia = PLAY_POINT_GAME_CATALOG.find(
      (game) => game.sku === "game.play_point_trivia",
    );

    expect(trivia).toMatchObject({
      status: "playable_preview",
      priceUsd: null,
      badge: "Playable preview",
    });
  });
});
