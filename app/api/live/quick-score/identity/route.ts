import { NextRequest, NextResponse } from "next/server";
import {
  generateUniqueRecoveryCode,
  getSupabaseServerClient,
} from "@/lib/play-point-core/quick-score-supabase";
import {
  loadVerifiedPlayerIdentity,
  normalizeRecoveryCode,
} from "@/lib/play-point-core/quick-score-server";
import { setQuickScoreIdentityCookie } from "@/lib/play-point-core/quick-score-cookie";
import {
  hashQuickScoreCredential,
  QUICK_SCORE_CREDENTIAL_HASH_VERSION,
} from "@/lib/play-point-core/quick-score-credential-hash";

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
      const existing = await loadVerifiedPlayerIdentity(
        supabase,
        existingPlayerId,
        existingRecoveryCode
      );

      if (existing) {
        if (displayName && displayName.trim() && displayName !== existing.display_name) {
          const { data: updated, error: updateError } = await supabase
            .from("ppl_quick_score_players")
            .update({ display_name: displayName.trim() })
            .eq("id", existingPlayerId)
            .select("id, display_name")
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
            recoveryCode: existingRecoveryCode,
            displayName: updated.display_name,
            restored: true,
          }, { playerId: updated.id, recoveryCode: existingRecoveryCode });
        }

        return identityResponse({
          success: true,
          playerId: existing.id,
          recoveryCode: existingRecoveryCode,
          displayName: existing.display_name,
          restored: true,
        }, { playerId: existing.id, recoveryCode: existingRecoveryCode });
      }

      return NextResponse.json({ error: "Invalid player identity." }, { status: 403 });
    }

    const recoveryCode = await generateUniqueRecoveryCode();
    const recoveryCodeHash = hashQuickScoreCredential(recoveryCode);

    const { data: created, error: createError } = await supabase
      .from("ppl_quick_score_players")
      .insert({
        recovery_code: null,
        recovery_code_hash: recoveryCodeHash,
        recovery_code_version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
        display_name: displayName,
      })
      .select("id, display_name")
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
      recoveryCode,
      displayName: created.display_name,
      restored: false,
    }, { playerId: created.id, recoveryCode });
  } catch (err) {
    console.error("POST /api/live/quick-score/identity failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
