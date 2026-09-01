import { describe, expect, it } from "vitest";
import { PLAY_POINT_GAME_CATALOG } from "../lib/play-point-core/games-catalog";
import {
  calculateFoundersBundlePricing,
  getFoundersBundleDiscountPercent,
  isFoundersBundleEligible,
} from "../lib/play-point-core/founders-bundle";

describe("Play Amplified Founder's bundle", () => {
  it("uses the launch discount ladder", () => {
    expect(getFoundersBundleDiscountPercent(0)).toBe(0);
    expect(getFoundersBundleDiscountPercent(2)).toBe(0);
    expect(getFoundersBundleDiscountPercent(3)).toBe(10);
    expect(getFoundersBundleDiscountPercent(4)).toBe(10);
    expect(getFoundersBundleDiscountPercent(5)).toBe(15);
    expect(getFoundersBundleDiscountPercent(7)).toBe(15);
    expect(getFoundersBundleDiscountPercent(8)).toBe(25);
    expect(getFoundersBundleDiscountPercent(20)).toBe(25);
  });

  it("keeps Quest Caddy out of bundle eligibility", () => {
    const questCaddy = PLAY_POINT_GAME_CATALOG.find(
      (game) => game.sku === "quest_caddy.experience",
    );
    const chainReaction = PLAY_POINT_GAME_CATALOG.find(
      (game) => game.sku === "game.chain_reaction",
    );

    expect(questCaddy).toBeDefined();
    expect(chainReaction).toBeDefined();
    expect(isFoundersBundleEligible(questCaddy!)).toBe(false);
    expect(isFoundersBundleEligible(chainReaction!)).toBe(true);
  });

  it("discounts only eligible games and leaves Quest Caddy at full price", () => {
    const selectedSkus = [
      "game.chain_reaction",
      "game.how_close",
      "game.inside_man",
      "quest_caddy.experience",
    ];
    const selectedGames = PLAY_POINT_GAME_CATALOG.filter((game) =>
      selectedSkus.includes(game.sku),
    );

    const pricing = calculateFoundersBundlePricing(selectedGames);

    expect(pricing.eligibleGameCount).toBe(3);
    expect(pricing.discountPercent).toBe(10);
    expect(pricing.subtotalCents).toBe(4496);
    expect(pricing.eligibleSubtotalCents).toBe(1997);
    expect(pricing.discountCents).toBe(200);
    expect(pricing.totalCents).toBe(4296);
  });
});
