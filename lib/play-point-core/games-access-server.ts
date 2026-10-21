import "server-only";

import type { User } from "@supabase/supabase-js";
import { PLAY_POINT_GAME_CATALOG } from "@/lib/play-point-core/games-catalog";
import {
  isPrivilegedGamesSession,
  type GamesSessionClaims,
  type GamesSessionRole,
} from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { isFounderAppMetadata, matchesVerifiedAccountLink } from "@/lib/play-point-core/verified-account-link";

function isPlayPointFounder(user: User): boolean {
  return isFounderAppMetadata(user.app_metadata);
}

export async function requireGamesSupabaseUser(request: Request): Promise<User> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match?.[1]) {
    throw new Error("Play Point account sign-in is required.");
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data.user) {
    throw new Error("Play Point account session is invalid or expired.");
  }
  if (!data.user.email || !(data.user.email_confirmed_at || data.user.confirmed_at)) {
    throw new Error("A verified email account is required.");
  }

  return data.user;
}

export async function loadActiveGameEntitlements(userId: string): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ppl_game_entitlements")
    .select("game_sku, expires_at")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to load game ownership: ${error.message}`);
  }

  const now = Date.now();
  return Array.from(
    new Set(
      (data ?? [])
        .filter((row) => {
          if (!row.expires_at) return true;
          const expiresAt = Date.parse(row.expires_at);
          return Number.isFinite(expiresAt) && expiresAt > now;
        })
        .map((row) => row.game_sku)
        .filter((sku): sku is string => typeof sku === "string" && sku.length > 0)
    )
  ).sort();
}

export async function buildGamesSessionInput(user: User): Promise<{
  sub: string;
  email: string;
  role: GamesSessionRole;
  entitlements: string[];
}> {
  const founder = isPlayPointFounder(user);
  return {
    sub: user.id,
    email: user.email ?? "",
    role: founder ? "founder" : "member",
    entitlements: founder ? ["*"] : await loadActiveGameEntitlements(user.id),
  };
}

export async function loadGamesLibraryForClaims(claims: GamesSessionClaims) {
  const privileged = isPrivilegedGamesSession(claims);
  const currentEntitlements = privileged
    ? new Set(PLAY_POINT_GAME_CATALOG.map((game) => game.sku))
    : new Set(await loadActiveGameEntitlements(claims.sub));

  return PLAY_POINT_GAME_CATALOG.map((game) => {
    const owned = privileged || currentEntitlements.has(game.sku);
    return {
      ...game,
      owned,
      launchable: owned || game.ownershipAuthority === "shot_caddy",
    };
  });
}

/**
 * Shot Caddy proves its own account login, not a Play Amplified identity.
 * Only an independently reviewed, service-role-only link bridges the two.
 */
export async function resolveLinkedShotCaddySessionInput(
  externalAccountId: string,
  handoffEmail: string,
): Promise<Awaited<ReturnType<typeof buildGamesSessionInput>> | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalAccountId) || !handoffEmail.trim()) return null;
  const supabase = getSupabaseServerClient();
  const { data: link, error: linkError } = await supabase
    .from("ppl_external_account_links")
    .select("external_account_id, play_point_user_id")
    .eq("provider", "shot_caddy")
    .eq("external_account_id", externalAccountId)
    .maybeSingle();

  if (linkError) throw new Error("Unable to verify the account link: " + linkError.message);
  if (!link) return null;

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(link.play_point_user_id);
  if (userError || !userData.user) throw new Error("The linked Play Amplified account is unavailable.");

  if (!matchesVerifiedAccountLink({
    externalAccountId,
    handoffEmail,
    link,
    user: userData.user,
  })) return null;

  // Ignore Shot Caddy's founder grant and mint a canonical Play Amplified
  // subject with local app_metadata role and local entitlements.
  return buildGamesSessionInput(userData.user);
}
