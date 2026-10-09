import "server-only";
import { registerPlayAmplifiedSession, resolvePlayAmplifiedSession, type PlayAmplifiedSession } from "./room-registry";

/** Materialize only a session verified by the existing authoritative Shot Caddy server. */
export async function registerShotCaddySession(codeInput: string): Promise<PlayAmplifiedSession | null> {
  const code = codeInput.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code) || code === "CREATE") return null;
  const existing = await resolvePlayAmplifiedSession(code);
  if (existing) {
    if (existing.joinHref !== `/shot-caddy/join/${code}`) throw new Error("Play Amplified session code collision.");
    return existing;
  }
  const response = await fetch(`https://shot-caddy-web.vercel.app/shot-caddy/api/sessions/${code}`, { cache: "no-store", signal: AbortSignal.timeout(5000), redirect: "error" });
  if (!response.ok) return null;
  const data = await response.json();
  if (data.success !== true || data.sessionCode !== code || typeof data.roundId !== "string" || !data.roundState || !Array.isArray(data.roundState.players)) return null;
  const createdAt = Date.parse(data.createdAt);
  if (!Number.isFinite(createdAt)) return null;
  const expiresAt = createdAt + 86400000;
  if (expiresAt <= Date.now()) return null;
  const modes: Record<string, string> = { CLASSIC_GAME: "classic", BATTLE_MODE: "battle", CALL_YOUR_SCORE: "cys", CHALLENGE_SKINS_PRO: "csp", WOLF_MODE: "wolf", REDEMPTION_WOLF: "redemption_wolf", WOLF_PACK: "wolf_pack", CARD_SHARK: "card_shark", AROUND_THE_WORLD: "around_the_world", DISC_WARRIOR: "disc_warrior", QUEST_CADDY: "quest_caddy" };
  const mode = data.roundState.gameMode === "CLASSIC_GAME" && data.roundState.classicVariant === "CHAOS" ? "chaos" : modes[data.roundState.gameMode];
  if (!mode) return null;
  const session: PlayAmplifiedSession = { code, gameSku: mode === "quest_caddy" ? "quest_caddy.experience" : `shot_caddy.mode.${mode}`, joinHref: `/shot-caddy/join/${code}`, participationModel: "HOSTED_ROSTER", externalSessionId: data.roundId, createdAt: new Date(createdAt).toISOString(), expiresAt: new Date(expiresAt).toISOString() };
  try { await registerPlayAmplifiedSession(session); }
  catch (error) {
    // Concurrent registration may have won; never overwrite another game's entry.
    const winner = await resolvePlayAmplifiedSession(code);
    if (winner && winner.externalSessionId === session.externalSessionId && winner.joinHref === session.joinHref) return winner;
    throw error;
  }
  return session;
}
