import type { ResumeCandidate } from "./PlayAmplifiedResumeRuntime";

export async function closeClearStackGame(endAction: NonNullable<ResumeCandidate["endAction"]>) {
  const response = await fetch("/api/games/clear-the-stack/room", {
    method: "PATCH",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: endAction.roomId, version: endAction.version, action: "close" }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not end the game. Reconnect and try again.");
}
