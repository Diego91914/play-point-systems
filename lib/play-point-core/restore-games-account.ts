// Reuse the verified identity handoff; browser claims never grant Founder access.
export async function restoreGamesAccount(
  accessToken: string,
  request: typeof fetch = fetch,
): Promise<boolean> {
  const handoff = await request("/api/account/play-point-handoff", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (handoff.status === 401) return false;
  const payload = await handoff.json().catch(() => ({}));
  if (!handoff.ok || typeof payload.handoffCode !== "string") {
    throw new Error("Unable to verify your existing account. Please retry.");
  }
  const restored = await request("/api/games/account/shot-caddy-handoff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: payload.handoffCode }),
    cache: "no-store",
  });
  if (!restored.ok) {
    throw new Error("Unable to restore your Play Amplified account. Please retry.");
  }
  return true;
}
