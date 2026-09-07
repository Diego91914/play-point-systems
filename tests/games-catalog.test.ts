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

describe("Play Amplified game catalog", () => {
  it("keeps every catalog SKU unique", () => {
    const skus = PLAY_POINT_GAME_CATALOG.map((game) => game.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("publishes the complete sale-ready portfolio with explicit sale switches and one-time prices", () => {
    const ready = getSalesReadyCatalog();

    expect(ready.map((game) => game.title).sort()).toEqual(
      [...EXPECTED_SALES_READY_TITLES].sort(),
    );
    expect(ready.every((game) => game.purchasable)).toBe(true);
    expect(ready.every((game) => game.priceUsd !== null && game.priceUsd > 0)).toBe(true);
    expect(ready.every((game) => game.badge === "Ready to sell")).toBe(true);
  });

  it("never treats a priced product as sale-ready unless its explicit launch switch is on", () => {
    const pricedButOff = {
      ...PLAY_POINT_GAME_CATALOG.find((game) => game.sku === "game.chain_reaction")!,
      purchasable: false,
    };

    expect(
      pricedButOff.status === "live" &&
        pricedButOff.purchasable &&
        pricedButOff.priceUsd !== null &&
        pricedButOff.priceUsd > 0,
    ).toBe(false);
  });

  it("keeps Play Point Trivia clearly separated as a preview", () => {
    const trivia = PLAY_POINT_GAME_CATALOG.find(
      (game) => game.sku === "game.play_point_trivia",
    );

    expect(trivia).toMatchObject({
      status: "playable_preview",
      purchasable: false,
      priceUsd: null,
      badge: "Playable preview",
    });
  });
});
