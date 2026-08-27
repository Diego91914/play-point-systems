import "server-only";

import type { User } from "@supabase/supabase-js";
import { PLAY_POINT_GAME_CATALOG } from "@/lib/play-point-core/games-catalog";
import type {
  GamesSessionClaims,
  GamesSessionRole,
} from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

function isPlayPointFounder(user: User): boolean {
  const appMetadata = user.app_metadata ?? {};
  return (
    appMetadata.play_point_founder === true ||
    appMetadata.play_point_role === "founder"
  );
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
  if (!data.user.email) {
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
  const currentEntitlements =
    claims.role === "founder"
      ? new Set(PLAY_POINT_GAME_CATALOG.map((game) => game.sku))
      : new Set(await loadActiveGameEntitlements(claims.sub));

  return PLAY_POINT_GAME_CATALOG.map((game) => {
    const owned = claims.role === "founder" || currentEntitlements.has(game.sku);
    return {
      ...game,
      owned,
      launchable: owned || game.ownershipAuthority === "shot_caddy",
    };
  });
}
