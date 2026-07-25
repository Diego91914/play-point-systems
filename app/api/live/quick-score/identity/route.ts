import { NextRequest, NextResponse } from "next/server";
import {
  generateUniqueRecoveryCode,
  getSupabaseServerClient,
} from "@/lib/play-point-core/quick-score-supabase";
import { normalizeRecoveryCode } from "@/lib/play-point-core/quick-score-server";
import { setQuickScoreIdentityCookie } from "@/lib/play-point-core/quick-score-cookie";

function identityResponse(
  body: Record<string, unknown>,
  identity: { playerId: string; recoveryCode: string }
) {
  const response = NextResponse.json(body);
  response.headers.set("Cache-Control", "no-store");
  setQuickScoreIdentityCookie(response, identity);
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const existingPlayerId =
      typeof body.existingPlayerId === "string" ? body.existingPlayerId : null;
    const existingRecoveryCode = normalizeRecoveryCode(body.existingRecoveryCode);
    const displayName = typeof body.displayName === "string" ? body.displayName : null;

    if ((existingPlayerId && !existingRecoveryCode) || (!existingPlayerId && existingRecoveryCode)) {
      return NextResponse.json(
        { error: "Both player ID and recovery code are required to restore an identity." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    if (existingPlayerId && existingRecoveryCode) {
      const { data: existing, error: existingError } = await supabase
        .from("ppl_quick_score_players")
        .select("id, recovery_code, display_name")
        .eq("id", existingPlayerId)
        .eq("recovery_code", existingRecoveryCode)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json(
          { error: `Failed to verify player: ${existingError.message}` },
          { status: 500 }
        );
      }

      if (existing) {
        if (displayName && displayName.trim() && displayName !== existing.display_name) {
          const { data: updated, error: updateError } = await supabase
            .from("ppl_quick_score_players")
            .update({ display_name: displayName.trim() })
            .eq("id", existingPlayerId)
            .select("id, recovery_code, display_name")
            .single();

          if (updateError || !updated) {
            return NextResponse.json(
              { error: `Failed to update player: ${updateError?.message ?? "Unknown error"}` },
              { status: 500 }
            );
          }

          return identityResponse({
            success: true,
            playerId: updated.id,
            recoveryCode: updated.recovery_code,
            displayName: updated.display_name,
            restored: true,
          }, { playerId: updated.id, recoveryCode: updated.recovery_code });
        }

        return identityResponse({
          success: true,
          playerId: existing.id,
          recoveryCode: existing.recovery_code,
          displayName: existing.display_name,
          restored: true,
        }, { playerId: existing.id, recoveryCode: existing.recovery_code });
      }

      return NextResponse.json({ error: "Invalid player identity." }, { status: 403 });
    }

    const recoveryCode = await generateUniqueRecoveryCode();

    const { data: created, error: createError } = await supabase
      .from("ppl_quick_score_players")
      .insert({
        recovery_code: recoveryCode,
        display_name: displayName,
      })
      .select("id, recovery_code, display_name")
      .single();

    if (createError || !created) {
      return NextResponse.json(
        { error: `Failed to create player: ${createError?.message ?? "Unknown error"}` },
        { status: 500 }
      );
    }

    return identityResponse({
      success: true,
      playerId: created.id,
      recoveryCode: created.recovery_code,
      displayName: created.display_name,
      restored: false,
    }, { playerId: created.id, recoveryCode: created.recovery_code });
  } catch (err) {
    console.error("POST /api/live/quick-score/identity failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
