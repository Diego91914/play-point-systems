export const PPL_QUICK_SCORE_PLAYER_ID_KEY = "ppl_quick_score_player_id";
export const PPL_QUICK_SCORE_RECOVERY_CODE_KEY = "ppl_quick_score_recovery_code";

export type QuickScoreIdentity = {
  playerId: string;
  recoveryCode: string;
};

export function resolveStoredQuickScoreIdentity(): QuickScoreIdentity | null {
  if (typeof window === "undefined") return null;

  const playerId =
    window.sessionStorage.getItem(PPL_QUICK_SCORE_PLAYER_ID_KEY) ||
    window.localStorage.getItem(PPL_QUICK_SCORE_PLAYER_ID_KEY) ||
    "";
  const recoveryCode =
    window.sessionStorage.getItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY) ||
    window.localStorage.getItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY) ||
    "";

  if (!playerId || !recoveryCode) return null;
  return { playerId, recoveryCode };
}

export function persistQuickScoreIdentity(identity: QuickScoreIdentity) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(PPL_QUICK_SCORE_PLAYER_ID_KEY, identity.playerId);
  window.sessionStorage.setItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY, identity.recoveryCode);
  window.localStorage.setItem(PPL_QUICK_SCORE_PLAYER_ID_KEY, identity.playerId);
  window.localStorage.setItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY, identity.recoveryCode);
}

export async function ensureQuickScoreIdentity(displayName?: string): Promise<QuickScoreIdentity> {
  const existing = resolveStoredQuickScoreIdentity();
  if (existing) return existing;

  const response = await fetch("/api/live/quick-score/identity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(displayName ? { displayName } : {}),
  });

  const data = await response.json().catch(() => ({}));
  const playerId = typeof data.playerId === "string" ? data.playerId : "";
  const recoveryCode = typeof data.recoveryCode === "string" ? data.recoveryCode : "";

  if (!response.ok || !playerId || !recoveryCode) {
    throw new Error((data as { error?: string }).error || "Unable to create a Quick Score identity.");
  }

  const identity = { playerId, recoveryCode };
  persistQuickScoreIdentity(identity);
  return identity;
}
