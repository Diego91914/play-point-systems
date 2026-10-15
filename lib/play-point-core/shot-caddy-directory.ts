import "server-only";
import { registerPlayAmplifiedSession, lookupPlayAmplifiedSession, type PlayAmplifiedSession } from "./room-registry";
import { readShotCaddySession } from "./shot-caddy-session";

/** Materialize a verified existing round; never create gameplay or overwrite a code. */
export async function registerShotCaddySession(codeInput: string): Promise<PlayAmplifiedSession | null> {
  const code = codeInput.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code) || code === "CREATE") return null;
  const existing = await lookupPlayAmplifiedSession(code);
  if (existing && existing.joinHref !== `/shot-caddy/join/${code}`) throw new Error("Play Amplified session code collision.");
  const session = await readShotCaddySession(code);
  if (!session) return null;
  if (existing) {
    if (existing.externalSessionId && existing.externalSessionId !== session.externalSessionId) throw new Error("Play Amplified session code collision.");
    return session;
  }
  try { await registerPlayAmplifiedSession(session); }
  catch (error) {
    const winner = await lookupPlayAmplifiedSession(code);
    if (winner && winner.externalSessionId === session.externalSessionId && winner.joinHref === session.joinHref) return session;
    throw error;
  }
  return session;
}
