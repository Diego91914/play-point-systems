import "server-only";

import Stripe from "stripe";

let cachedClient: Stripe | null = null;

export function isUuidLikePlayerId(playerId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    playerId
  );
}

export function getStripePriceId(productKey: "quick_score_pro"): string | null {
  if (productKey !== "quick_score_pro") return null;
  const priceId = process.env.STRIPE_QUICK_SCORE_PRO_PRICE_ID?.trim();
  return priceId || null;
}

export function isStripeConfigured(productKey?: "quick_score_pro"): boolean {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  return productKey ? Boolean(getStripePriceId(productKey)) : true;
}

export function getStripeServerClient(): Stripe {
  if (cachedClient) return cachedClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY.");

  cachedClient = new Stripe(secretKey);
  return cachedClient;
}
