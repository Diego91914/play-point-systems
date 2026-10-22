import "server-only";
import type { PlayAmplifiedSession } from "./room-registry";

/** Only the fixed authoritative server supplies state, timestamps and join destination. */
export async function readShotCaddySession(code: string, now = Date.now()): Promise<PlayAmplifiedSession | null> {
  if (!/^[A-Z0-9]{6}$/.test(code) || code === "CREATE") return null;
  const response = await fetch(`https://shot-caddy-web.vercel.app/shot-caddy/api/sessions/${code}`, { cache: "no-store", signal: AbortSignal.timeout(5000), redirect: "error" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Shot Caddy session service unavailable.");
  const data = await response.json();
  const lifecycle = data.directoryLifecycle;
  if (data.success !== true || data.sessionCode !== code || typeof data.roundId !== "string" || !data.roundState || !Array.isArray(data.roundState.players)) return null;
  const createdAt = Date.parse(data.createdAt);
  const expiresAt = Date.parse(lifecycle?.expiresAt);
  if (!Number.isFinite(createdAt) || lifecycle?.status !== "active" || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
  const modes: Record<string, string> = { CLASSIC_GAME: "classic", BATTLE_MODE: "battle", CALL_YOUR_SCORE: "cys", CHALLENGE_SKINS_PRO: "csp", WOLF_MODE: "wolf", REDEMPTION_WOLF: "redemption_wolf", WOLF_PACK: "wolf_pack", CARD_SHARK: "card_shark", AROUND_THE_WORLD: "around_the_world", DISC_WARRIOR: "disc_warrior", QUEST_CADDY: "quest_caddy" };
  const mode = data.roundState.gameMode === "CLASSIC_GAME" && data.roundState.classicVariant === "CHAOS" ? "chaos" : modes[data.roundState.gameMode];
  if (!mode) return null;
  return { code, gameSku: mode === "quest_caddy" ? "quest_caddy.experience" : `shot_caddy.mode.${mode}`, joinHref: `/shot-caddy/join/${code}`, participationModel: "HOSTED_ROSTER", externalSessionId: data.roundId, createdAt: new Date(createdAt).toISOString(), expiresAt: new Date(expiresAt).toISOString() };
}
