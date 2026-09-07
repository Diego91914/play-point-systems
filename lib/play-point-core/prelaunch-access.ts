import type { GamesSessionClaims } from "@/lib/play-point-core/games-session";

export const PUBLIC_PLAY_ENABLED =
  process.env.PLAY_AMPLIFIED_PUBLIC_PLAY === "true";

export function canHostDuringPrelaunch(
  claims: GamesSessionClaims,
  requiredSku?: string,
): boolean {
  if (claims.role === "founder") return true;
  if (!PUBLIC_PLAY_ENABLED) return false;
  if (!requiredSku) return true;
  return claims.entitlements.includes("*") || claims.entitlements.includes(requiredSku);
}

export function prelaunchHostError(): string {
  return "Play Amplified is currently in private preview. Hosting is limited to Founder/test access until public purchasing is enabled.";
}
