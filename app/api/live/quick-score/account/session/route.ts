import { NextRequest, NextResponse } from "next/server";
import {
  issueQuickScorePlayerSession,
  requireQuickScoreAuthUser,
} from "@/lib/play-point-core/quick-score-account-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import { hashQuickScoreCredential } from "@/lib/play-point-core/quick-score-credential-hash";
import {
  clearQuickScoreIdentityCookie,
  setQuickScoreIdentityCookie,
} from "@/lib/play-point-core/quick-score-cookie";
import { loadVerifiedPlayerIdentity } from "@/lib/play-point-core/quick-score-server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

function noStore(body: Record<string, unknown>, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireQuickScoreAuthUser(request);
    const supabase = getSupabaseServerClient();
    const currentCredentials = resolveQuickScorePlayerCredentials(request);
    if (currentCredentials) {
      const currentPlayer = await loadVerifiedPlayerIdentity(
        supabase,
        currentCredentials.playerId,
        currentCredentials.recoveryCode
      );
      if (currentPlayer?.auth_user_id === authUser.id) {
        const identity = {
          ...currentCredentials,
          credentialKind: currentPlayer.credentialSource,
        };
        const response = noStore({ success: true, reused: true, ...identity });
        setQuickScoreIdentityCookie(response, identity);
        return response;
      }
    }

    const { data: player, error } = await supabase
      .from("ppl_quick_score_players")
      .select("id")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (error) throw new Error(`Failed to load email-linked player: ${error.message}`);
    if (!player) return noStore({ error: "This email account is not linked yet." }, 404);

    const identity = await issueQuickScorePlayerSession(supabase, player.id);
    const response = noStore({ success: true, ...identity });
    setQuickScoreIdentityCookie(response, identity);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account session.";
    const status = message.startsWith("Email account session") ? 401 : 500;
    return noStore({ error: message }, status);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const credentials = resolveQuickScorePlayerCredentials(request, body);
    if (!credentials) return noStore({ error: "Player session is required." }, 401);

    const supabase = getSupabaseServerClient();
    const verified = await loadVerifiedPlayerIdentity(
      supabase,
      credentials.playerId,
      credentials.recoveryCode
    );
    if (!verified || verified.credentialSource !== "account_session") {
      return noStore({ error: "Invalid player session." }, 403);
    }

    const { error } = await supabase
      .from("ppl_quick_score_player_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("player_id", credentials.playerId)
      .eq("token_hash", hashQuickScoreCredential(credentials.recoveryCode))
      .is("revoked_at", null);
    if (error) throw new Error(`Failed to revoke player session: ${error.message}`);

    const response = noStore({ success: true });
    clearQuickScoreIdentityCookie(response);
    return response;
  } catch (error) {
    return noStore(
      { error: error instanceof Error ? error.message : "Unable to revoke player session." },
      500
    );
  }
}
