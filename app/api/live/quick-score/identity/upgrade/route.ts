import { NextRequest, NextResponse } from "next/server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  hashQuickScoreCredential,
  QUICK_SCORE_CREDENTIAL_HASH_VERSION,
  verifyQuickScoreStoredCredentialHash,
} from "@/lib/play-point-core/quick-score-credential-hash";
import { setQuickScoreIdentityCookie } from "@/lib/play-point-core/quick-score-cookie";
import {
  loadVerifiedPlayerIdentity,
  normalizeRecoveryCode,
} from "@/lib/play-point-core/quick-score-server";
import {
  generateUniqueRecoveryCode,
  getSupabaseServerClient,
} from "@/lib/play-point-core/quick-score-supabase";

function noStoreResponse(body: Record<string, unknown>, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const credentials = resolveQuickScorePlayerCredentials(request, body);
    if (!credentials) {
      return noStoreResponse({ error: "Player identity is required." }, 401);
    }

    const supabase = getSupabaseServerClient();
    const existing = await loadVerifiedPlayerIdentity(
      supabase,
      credentials.playerId,
      credentials.recoveryCode
    );
    if (!existing) {
      return noStoreResponse({ error: "Invalid player identity." }, 403);
    }

    const alreadyUsesHash = verifyQuickScoreStoredCredentialHash(
      credentials.recoveryCode,
      {
        hash: existing.recovery_code_hash,
        version: existing.recovery_code_version,
      }
    );
    if (alreadyUsesHash) {
      const response = noStoreResponse({
        success: true,
        upgraded: false,
        alreadySecure: true,
        playerId: existing.id,
      });
      setQuickScoreIdentityCookie(response, credentials);
      return response;
    }

    const legacyRecoveryCode = normalizeRecoveryCode(credentials.recoveryCode);
    const recoveryCode = await generateUniqueRecoveryCode();
    const { data: upgraded, error: upgradeError } = await supabase
      .from("ppl_quick_score_players")
      .update({
        recovery_code: null,
        recovery_code_hash: hashQuickScoreCredential(recoveryCode),
        recovery_code_version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("recovery_code", legacyRecoveryCode)
      .select("id")
      .maybeSingle();

    if (upgradeError) {
      return noStoreResponse(
        { error: `Failed to upgrade recovery security: ${upgradeError.message}` },
        500
      );
    }
    if (!upgraded) {
      return noStoreResponse(
        { error: "Recovery security changed in another session. Refresh and try again." },
        409
      );
    }

    const response = noStoreResponse({
      success: true,
      upgraded: true,
      playerId: upgraded.id,
      recoveryCode,
    });
    setQuickScoreIdentityCookie(response, {
      playerId: upgraded.id,
      recoveryCode,
    });
    return response;
  } catch (error) {
    console.error("POST /api/live/quick-score/identity/upgrade failed:", error);
    return noStoreResponse(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500
    );
  }
}
