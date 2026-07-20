import { NextRequest, NextResponse } from "next/server";
import {
  normalizeRecoveryCode,
  verifyPlayerIdentity,
} from "@/lib/play-point-core/quick-score-server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const QUICK_SCORE_PRO_SKU = "tool.quick_score.pro";

export async function GET(request: NextRequest) {
  try {
    const playerId = request.nextUrl.searchParams.get("playerId")?.trim() ?? "";
    const recoveryCode = normalizeRecoveryCode(
      request.nextUrl.searchParams.get("recoveryCode")
    );

    if (!playerId || !recoveryCode) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const verified = await verifyPlayerIdentity(supabase, playerId, recoveryCode);
    if (!verified) {
      return NextResponse.json({ error: "Invalid player identity." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("ppl_quick_score_purchases")
      .select("product_sku")
      .eq("player_id", playerId)
      .eq("product_sku", QUICK_SCORE_PRO_SKU)
      .eq("status", "active")
      .limit(1);

    if (error) {
      throw new Error(`Failed to load Quick Score entitlement: ${error.message}`);
    }

    const proEnabled = Array.isArray(data) && data.length > 0;

    return NextResponse.json({
      success: true,
      entitlements: {
        modeSkus: [],
        packSkus: [],
        organizerSkus: [],
        toolSkus: proEnabled ? [QUICK_SCORE_PRO_SKU] : [],
      },
    });
  } catch (error) {
    console.error("GET /api/live/quick-score/entitlement failed:", error);
    return NextResponse.json(
      { error: "Unable to load Quick Score Pro access." },
      { status: 500 }
    );
  }
}
