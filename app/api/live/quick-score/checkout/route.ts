import { NextRequest, NextResponse } from "next/server";
import { verifyPlayerIdentity } from "@/lib/play-point-core/quick-score-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { getStripePriceId, getStripeServerClient, isStripeConfigured } from "@/lib/play-point-core/quick-score-payments";
import { isUuidLikePlayerId } from "@/lib/play-point-core/quick-score-payments";

const QUICK_SCORE_PRO_SKU = "tool.quick_score.pro";

function resolveBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  return "https://playpointsystems.com";
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured("quick_score_pro")) {
      return NextResponse.json(
        { error: "Quick Score Pro checkout is not enabled yet." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const credentials = resolveQuickScorePlayerCredentials(request, body);

    if (!credentials) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }
    const { playerId, recoveryCode } = credentials;

    if (!isUuidLikePlayerId(playerId)) {
      return NextResponse.json({ error: "Invalid player identity." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const verified = await verifyPlayerIdentity(supabase, playerId, recoveryCode);
    if (!verified) {
      return NextResponse.json({ error: "Invalid player identity." }, { status: 403 });
    }

    const { data: existingPurchase, error: purchaseLookupError } = await supabase
      .from("ppl_quick_score_purchases")
      .select("id")
      .eq("player_id", playerId)
      .eq("product_sku", QUICK_SCORE_PRO_SKU)
      .eq("status", "active")
      .limit(1);

    if (purchaseLookupError) {
      console.error("Failed checking Quick Score Pro ownership:", purchaseLookupError);
      return NextResponse.json({ error: "Unable to start checkout right now." }, { status: 500 });
    }

    if (Array.isArray(existingPurchase) && existingPurchase.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyOwned: true,
        productSku: QUICK_SCORE_PRO_SKU,
      });
    }

    const priceId = getStripePriceId("quick_score_pro");
    if (!priceId) {
      return NextResponse.json(
        { error: "Quick Score Pro price is not configured yet." },
        { status: 503 }
      );
    }

    const stripe = getStripeServerClient();
    const baseUrl = resolveBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/live/quick-score/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/live/quick-score?checkout=cancelled`,
      client_reference_id: playerId,
      metadata: {
        productSku: QUICK_SCORE_PRO_SKU,
        playerId,
      },
      allow_promotion_codes: false,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session created without redirect URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      id: session.id,
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/checkout failed:", error);
    return NextResponse.json(
      { error: "Unable to start checkout right now." },
      { status: 500 }
    );
  }
}
