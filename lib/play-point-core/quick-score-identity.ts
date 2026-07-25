export const PPL_QUICK_SCORE_PLAYER_ID_KEY = "ppl_quick_score_player_id";
export const PPL_QUICK_SCORE_RECOVERY_CODE_KEY = "ppl_quick_score_recovery_code";
export const PPL_QUICK_SCORE_CREDENTIAL_KIND_KEY = "ppl_quick_score_credential_kind";

export type QuickScoreIdentity = {
  playerId: string;
  recoveryCode: string;
  credentialKind?: "recovery" | "account_session";
};

let pendingIdentityCreation: Promise<QuickScoreIdentity> | null = null;

type QuickScoreIdentityLockManager = {
  request(
    name: string,
    callback: () => Promise<QuickScoreIdentity>
  ): Promise<QuickScoreIdentity>;
};

type NavigatorWithIdentityLocks = {
  locks?: QuickScoreIdentityLockManager;
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
  const credentialKindValue =
    window.sessionStorage.getItem(PPL_QUICK_SCORE_CREDENTIAL_KIND_KEY) ||
    window.localStorage.getItem(PPL_QUICK_SCORE_CREDENTIAL_KIND_KEY) ||
    "recovery";

  if (!playerId || !recoveryCode) return null;
  return {
    playerId,
    recoveryCode,
    credentialKind: credentialKindValue === "account_session" ? "account_session" : "recovery",
  };
}

export function persistQuickScoreIdentity(identity: QuickScoreIdentity) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(PPL_QUICK_SCORE_PLAYER_ID_KEY, identity.playerId);
  window.sessionStorage.setItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY, identity.recoveryCode);
  window.localStorage.setItem(PPL_QUICK_SCORE_PLAYER_ID_KEY, identity.playerId);
  window.localStorage.setItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY, identity.recoveryCode);
  const credentialKind = identity.credentialKind ?? "recovery";
  window.sessionStorage.setItem(PPL_QUICK_SCORE_CREDENTIAL_KIND_KEY, credentialKind);
  window.localStorage.setItem(PPL_QUICK_SCORE_CREDENTIAL_KIND_KEY, credentialKind);
}

export function clearStoredQuickScoreIdentity() {
  if (typeof window === "undefined") return;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    storage.removeItem(PPL_QUICK_SCORE_PLAYER_ID_KEY);
    storage.removeItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY);
    storage.removeItem(PPL_QUICK_SCORE_CREDENTIAL_KIND_KEY);
  }
}

export async function bootstrapQuickScoreIdentitySession(
  identity: QuickScoreIdentity,
  displayName?: string
): Promise<QuickScoreIdentity> {
  try {
    return await restoreQuickScoreIdentitySession(identity, displayName);
  } catch {
    // Local scoring remains available if the cookie bootstrap request is offline.
    return identity;
  }
}

export async function restoreQuickScoreIdentitySession(
  identity: QuickScoreIdentity,
  displayName?: string
): Promise<QuickScoreIdentity> {
  const response = await fetch("/api/live/quick-score/identity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      existingPlayerId: identity.playerId,
      existingRecoveryCode: identity.recoveryCode,
      ...(displayName ? { displayName } : {}),
    }),
  });
  const data = await response.json().catch(() => ({}));
  const playerId = typeof data.playerId === "string" ? data.playerId : "";
  const recoveryCode = typeof data.recoveryCode === "string" ? data.recoveryCode : "";

  if (!response.ok || !data.restored || !playerId || !recoveryCode) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Unable to restore this Quick Score account."
    );
  }

  const restoredIdentity = {
    playerId,
    recoveryCode,
    credentialKind: identity.credentialKind ?? "recovery",
  };
  persistQuickScoreIdentity(restoredIdentity);
  return restoredIdentity;
}

async function createQuickScoreIdentity(displayName?: string): Promise<QuickScoreIdentity> {
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

  const identity = { playerId, recoveryCode, credentialKind: "recovery" as const };
  persistQuickScoreIdentity(identity);
  return identity;
}

async function createOrReuseQuickScoreIdentity(displayName?: string): Promise<QuickScoreIdentity> {
  const existing = resolveStoredQuickScoreIdentity();
  if (existing) return bootstrapQuickScoreIdentitySession(existing, displayName);

  return createQuickScoreIdentity(displayName);
}

export async function ensureQuickScoreIdentity(displayName?: string): Promise<QuickScoreIdentity> {
  const existing = resolveStoredQuickScoreIdentity();
  if (existing) return bootstrapQuickScoreIdentitySession(existing, displayName);

  if (pendingIdentityCreation) return pendingIdentityCreation;

  const locks = typeof navigator === "undefined"
    ? undefined
    : (navigator as unknown as NavigatorWithIdentityLocks).locks;
  const creation = locks
    ? locks.request("ppl-quick-score-identity-creation", () =>
        createOrReuseQuickScoreIdentity(displayName)
      )
    : createOrReuseQuickScoreIdentity(displayName);

  pendingIdentityCreation = creation;
  try {
    return await creation;
  } finally {
    if (pendingIdentityCreation === creation) pendingIdentityCreation = null;
  }
}
