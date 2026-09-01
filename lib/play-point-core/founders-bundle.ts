import type { PlayPointGameCatalogItem } from "./games-catalog";

export const QUEST_CADDY_SKU = "quest_caddy.experience";

export const FOUNDERS_BUNDLE_TIERS = [
  { minimumEligibleGames: 3, discountPercent: 10 },
  { minimumEligibleGames: 5, discountPercent: 15 },
  { minimumEligibleGames: 8, discountPercent: 25 },
] as const;

export function isFoundersBundleEligible(
  product: Pick<PlayPointGameCatalogItem, "sku" | "status" | "priceUsd">,
) {
  return (
    product.sku !== QUEST_CADDY_SKU &&
    product.status === "live" &&
    product.priceUsd !== null
  );
}

export function getFoundersBundleDiscountPercent(eligibleGameCount: number) {
  for (let index = FOUNDERS_BUNDLE_TIERS.length - 1; index >= 0; index -= 1) {
    const tier = FOUNDERS_BUNDLE_TIERS[index];
    if (eligibleGameCount >= tier.minimumEligibleGames) {
      return tier.discountPercent;
    }
  }

  return 0;
}

export function calculateFoundersBundlePricing(
  products: readonly Pick<PlayPointGameCatalogItem, "sku" | "status" | "priceUsd">[],
) {
  const paidProducts = products.filter(
    (product): product is typeof product & { priceUsd: number } => product.priceUsd !== null,
  );
  const eligibleProducts = paidProducts.filter(isFoundersBundleEligible);
  const discountPercent = getFoundersBundleDiscountPercent(eligibleProducts.length);

  const subtotalCents = paidProducts.reduce(
    (sum, product) => sum + Math.round(product.priceUsd * 100),
    0,
  );
  const eligibleSubtotalCents = eligibleProducts.reduce(
    (sum, product) => sum + Math.round(product.priceUsd * 100),
    0,
  );
  const discountCents = Math.round((eligibleSubtotalCents * discountPercent) / 100);

  return {
    eligibleGameCount: eligibleProducts.length,
    discountPercent,
    subtotalCents,
    eligibleSubtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}
