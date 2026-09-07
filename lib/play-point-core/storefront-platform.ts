import type { PlayPointGameCatalogItem } from "./games-catalog";

export type StorefrontPlatform = "web" | "ios" | "android";
export type PurchaseProvider = "web_checkout" | "apple_iap" | "google_play" | "none";

export type StorefrontOffer = {
  productId: string;
  platform: StorefrontPlatform;
  provider: PurchaseProvider;
  available: boolean;
  priceUsd: number | null;
  purchaseProductId: string | null;
  reason: "available" | "preview" | "not_configured" | "not_for_sale";
};

/**
 * The Play Amplified SKU is the durable ownership key across every storefront.
 * Apple/Google product IDs are provider-specific aliases that can be configured
 * without changing account entitlements or the web/PWA product identity.
 */
const APPLE_PRODUCT_IDS: Readonly<Record<string, string>> = {};
const GOOGLE_PLAY_PRODUCT_IDS: Readonly<Record<string, string>> = {};

function isSaleReady(product: PlayPointGameCatalogItem): boolean {
  return (
    product.status === "live" &&
    product.purchasable &&
    product.priceUsd !== null &&
    product.priceUsd > 0
  );
}

export function getStorefrontOffer(
  product: PlayPointGameCatalogItem,
  platform: StorefrontPlatform = "web",
): StorefrontOffer {
  if (product.status === "playable_preview") {
    return {
      productId: product.sku,
      platform,
      provider: "none",
      available: false,
      priceUsd: null,
      purchaseProductId: null,
      reason: "preview",
    };
  }

  if (!isSaleReady(product)) {
    return {
      productId: product.sku,
      platform,
      provider: "none",
      available: false,
      priceUsd: product.priceUsd,
      purchaseProductId: null,
      reason: "not_for_sale",
    };
  }

  if (platform === "web") {
    return {
      productId: product.sku,
      platform,
      provider: "web_checkout",
      available: true,
      priceUsd: product.priceUsd,
      purchaseProductId: product.sku,
      reason: "available",
    };
  }

  const providerIds = platform === "ios" ? APPLE_PRODUCT_IDS : GOOGLE_PLAY_PRODUCT_IDS;
  const providerProductId = providerIds[product.sku] ?? null;

  return {
    productId: product.sku,
    platform,
    provider: platform === "ios" ? "apple_iap" : "google_play",
    available: providerProductId !== null,
    priceUsd: product.priceUsd,
    purchaseProductId: providerProductId,
    reason: providerProductId ? "available" : "not_configured",
  };
}

export function resolveStorefrontPlatform(value: string | null | undefined): StorefrontPlatform {
  if (value === "ios" || value === "android") return value;
  return "web";
}
