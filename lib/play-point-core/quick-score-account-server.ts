import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createQuickScorePlayerSessionToken } from "@/lib/play-point-core/quick-score-credentials";
import {
  hashQuickScoreCredential,
  QUICK_SCORE_CREDENTIAL_HASH_VERSION,
} from "@/lib/play-point-core/quick-score-credential-hash";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

type HeaderRequest = Pick<Request, "headers">;

export async function requireQuickScoreAuthUser(request: HeaderRequest): Promise<User> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match?.[1]) throw new Error("Email account session is required.");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data.user) throw new Error("Email account session is invalid or expired.");
  return data.user;
}

export async function issueQuickScorePlayerSession(
  supabase: SupabaseClient,
  playerId: string
) {
  const token = createQuickScorePlayerSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString();
  const { error } = await supabase
    .from("ppl_quick_score_player_sessions")
    .insert({
      player_id: playerId,
      token_hash: hashQuickScoreCredential(token),
      token_version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
      expires_at: expiresAt,
    });

  if (error) throw new Error(`Failed to create player session: ${error.message}`);
  return { playerId, recoveryCode: token, credentialKind: "account_session" as const, expiresAt };
}
