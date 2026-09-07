import { describe, expect, it } from "vitest";
import { PLAY_POINT_GAME_CATALOG } from "../lib/play-point-core/games-catalog";
import {
  getStorefrontOffer,
  resolveStorefrontPlatform,
} from "../lib/play-point-core/storefront-platform";

function product(sku: string) {
  const match = PLAY_POINT_GAME_CATALOG.find((item) => item.sku === sku);
  if (!match) throw new Error(`Missing catalog product ${sku}`);
  return match;
}

describe("platform-aware storefront", () => {
  it("preserves sale-ready web/PWA offers", () => {
    const offer = getStorefrontOffer(product("game.chain_reaction"), "web");

    expect(offer).toMatchObject({
      productId: "game.chain_reaction",
      platform: "web",
      provider: "web_checkout",
      available: true,
      priceUsd: 5.99,
      purchaseProductId: "game.chain_reaction",
      reason: "available",
    });
  });

  it("does not expose an iOS purchase until an Apple product ID is configured", () => {
    const offer = getStorefrontOffer(product("game.chain_reaction"), "ios");

    expect(offer).toMatchObject({
      productId: "game.chain_reaction",
      platform: "ios",
      provider: "apple_iap",
      available: false,
      purchaseProductId: null,
      reason: "not_configured",
    });
  });

  it("does not accidentally sell previews on any platform", () => {
    for (const platform of ["web", "ios", "android"] as const) {
      expect(getStorefrontOffer(product("game.play_point_trivia"), platform)).toMatchObject({
        available: false,
        provider: "none",
        reason: "preview",
      });
    }
  });

  it("defaults unknown containers to the existing web/PWA behavior", () => {
    expect(resolveStorefrontPlatform(undefined)).toBe("web");
    expect(resolveStorefrontPlatform("browser")).toBe("web");
    expect(resolveStorefrontPlatform("ios")).toBe("ios");
    expect(resolveStorefrontPlatform("android")).toBe("android");
  });
});
