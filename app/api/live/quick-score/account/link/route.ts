import { NextRequest, NextResponse } from "next/server";
import { requireQuickScoreAuthUser } from "@/lib/play-point-core/quick-score-account-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  hashQuickScoreCredential,
  QUICK_SCORE_CREDENTIAL_HASH_VERSION,
} from "@/lib/play-point-core/quick-score-credential-hash";
import { loadVerifiedPlayerIdentity } from "@/lib/play-point-core/quick-score-server";
import {
  generateUniqueRecoveryCode,
  getSupabaseServerClient,
} from "@/lib/play-point-core/quick-score-supabase";

function noStore(body: Record<string, unknown>, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireQuickScoreAuthUser(request);
    const supabase = getSupabaseServerClient();
    const { data: alreadyLinked, error: linkedError } = await supabase
      .from("ppl_quick_score_players")
      .select("id")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (linkedError) throw new Error(`Failed to load linked player: ${linkedError.message}`);
    if (alreadyLinked) {
      return noStore({ success: true, linked: true, playerId: alreadyLinked.id });
    }

    const credentials = resolveQuickScorePlayerCredentials(request);
    if (credentials) {
      const player = await loadVerifiedPlayerIdentity(
        supabase,
        credentials.playerId,
        credentials.recoveryCode
      );
      if (!player) return noStore({ error: "Invalid Quick Score identity." }, 403);
      if (player.auth_user_id && player.auth_user_id !== authUser.id) {
        return noStore({ error: "This Quick Score account is already linked to another email." }, 409);
      }

      const { data: linked, error: linkError } = await supabase
        .from("ppl_quick_score_players")
        .update({ auth_user_id: authUser.id, updated_at: new Date().toISOString() })
        .eq("id", player.id)
        .is("auth_user_id", null)
        .select("id")
        .maybeSingle();

      if (linkError) throw new Error(`Failed to link Quick Score account: ${linkError.message}`);
      if (!linked && !player.auth_user_id) {
        return noStore({ error: "Quick Score account linking changed in another session." }, 409);
      }
      return noStore({ success: true, linked: true, playerId: player.id });
    }

    const recoveryCode = await generateUniqueRecoveryCode();
    const { data: created, error: createError } = await supabase
      .from("ppl_quick_score_players")
      .insert({
        auth_user_id: authUser.id,
        recovery_code: null,
        recovery_code_hash: hashQuickScoreCredential(recoveryCode),
        recovery_code_version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
      })
      .select("id")
      .single();

    if (createError || !created) {
      throw new Error(`Failed to create linked player: ${createError?.message ?? "Unknown error"}`);
    }

    return noStore({
      success: true,
      linked: true,
      created: true,
      playerId: created.id,
      recoveryCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to link email account.";
    const status = message.startsWith("Email account session") ? 401 : 500;
    return noStore({ error: message }, status);
  }
}
