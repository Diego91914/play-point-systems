import { NextRequest, NextResponse } from "next/server";
import { isUuidLikePlayerId } from "@/lib/play-point-core/quick-score-payments";
import { getStripeServerClient, isStripeConfigured } from "@/lib/play-point-core/quick-score-payments";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const QUICK_SCORE_PRO_SKU = "tool.quick_score.pro";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured("quick_score_pro")) {
      return NextResponse.json(
        { error: "Quick Score Pro checkout is not enabled yet." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    const stripe = getStripeServerClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.mode !== "payment") {
      return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment has not completed yet." }, { status: 402 });
    }

    const playerId = session.metadata?.playerId ?? session.client_reference_id ?? "";
    const productSku = session.metadata?.productSku ?? QUICK_SCORE_PRO_SKU;

    if (!isUuidLikePlayerId(playerId)) {
      return NextResponse.json({ error: "Checkout session is missing a valid player." }, { status: 400 });
    }

    if (productSku !== QUICK_SCORE_PRO_SKU) {
      return NextResponse.json({ error: "Checkout session product is invalid." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data: existingBySession, error: existingBySessionError } = await supabase
      .from("ppl_quick_score_purchases")
      .select("id, player_id, product_sku, status")
      .eq("provider", "stripe")
      .eq("provider_txn_id", session.id)
      .maybeSingle();

    if (existingBySessionError) {
      console.error("Failed loading Quick Score Pro purchase by session:", existingBySessionError);
      return NextResponse.json({ error: "Unable to verify checkout right now." }, { status: 500 });
    }

    if (existingBySession) {
      return NextResponse.json({
        success: true,
        playerId: existingBySession.player_id,
        productSku: existingBySession.product_sku,
        status: existingBySession.status,
      });
    }

    const { error: insertError } = await supabase.from("ppl_quick_score_purchases").insert({
      player_id: playerId,
      product_sku: productSku,
      provider: "stripe",
      provider_txn_id: session.id,
      status: "active",
      purchased_at: new Date(session.created * 1000).toISOString(),
    });

    if (insertError) {
      console.error("Failed creating Quick Score Pro purchase:", insertError);
      return NextResponse.json({ error: "Unable to persist purchase right now." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      playerId,
      productSku,
      status: "active",
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/checkout/verify failed:", error);
    return NextResponse.json({ error: "Unable to verify checkout right now." }, { status: 500 });
  }
}
