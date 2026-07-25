export type QuickScorePlayerCredentials = {
  playerId: string;
  recoveryCode: string;
};

type QuickScoreRequest = Pick<Request, "headers" | "url">;
type QuickScoreCredentialInput = {
  playerId?: unknown;
  recoveryCode?: unknown;
};

export const PPL_QUICK_SCORE_IDENTITY_COOKIE = "ppl_quick_score_identity";
export const PPL_QUICK_SCORE_HOST_COOKIE = "ppl_quick_score_host";

export function normalizeRecoveryCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function buildQuickScoreIdentityRequestHeaders(
  identity: QuickScorePlayerCredentials
): Record<string, string> {
  return {
    Authorization: `QuickScore ${identity.playerId}.${normalizeRecoveryCode(identity.recoveryCode)}`,
  };
}

export function serializeQuickScoreIdentityCookie(
  identity: QuickScorePlayerCredentials
): string {
  return `${identity.playerId}.${normalizeRecoveryCode(identity.recoveryCode)}`;
}

function readCookie(request: QuickScoreRequest, name: string): string {
  const cookieHeader = request.headers.get("cookie") ?? "";

  for (const entry of cookieHeader.split(";")) {
    const [entryName, ...valueParts] = entry.trim().split("=");
    if (entryName === name) return valueParts.join("=").trim();
  }

  return "";
}

function parseSerializedPlayerCredentials(value: string): QuickScorePlayerCredentials | null {
  const separatorIndex = value.indexOf(".");
  if (separatorIndex < 1) return null;

  const playerId = value.slice(0, separatorIndex).trim();
  const recoveryCode = normalizeRecoveryCode(value.slice(separatorIndex + 1));
  return playerId && recoveryCode ? { playerId, recoveryCode } : null;
}

export function resolveQuickScorePlayerCredentials(
  request: QuickScoreRequest,
  legacyCredentials?: QuickScoreCredentialInput
): QuickScorePlayerCredentials | null {
  const cookieCredentials = parseSerializedPlayerCredentials(
    readCookie(request, PPL_QUICK_SCORE_IDENTITY_COOKIE)
  );
  if (cookieCredentials) return cookieCredentials;

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^QuickScore\s+([^\s.]+)\.([^\s]+)$/i);

  if (match) {
    const playerId = match[1]?.trim() ?? "";
    const recoveryCode = normalizeRecoveryCode(match[2]);
    if (playerId && recoveryCode) return { playerId, recoveryCode };
  }

  // Temporary compatibility path for tabs running a pre-migration build.
  const searchParams = new URL(request.url).searchParams;
  const playerId = searchParams.get("playerId")?.trim() ?? "";
  const recoveryCode = normalizeRecoveryCode(searchParams.get("recoveryCode"));
  if (playerId && recoveryCode) return { playerId, recoveryCode };

  const legacyPlayerId =
    typeof legacyCredentials?.playerId === "string" ? legacyCredentials.playerId.trim() : "";
  const legacyRecoveryCode = normalizeRecoveryCode(legacyCredentials?.recoveryCode);
  return legacyPlayerId && legacyRecoveryCode
    ? { playerId: legacyPlayerId, recoveryCode: legacyRecoveryCode }
    : null;
}

export function buildQuickScoreHostRequestHeaders(hostToken: string): Record<string, string> {
  return {
    Authorization: `QuickScoreHost ${hostToken.trim()}`,
  };
}

export function serializeQuickScoreHostCookie(sessionCode: string, hostToken: string): string {
  return `${sessionCode.trim().toUpperCase()}.${hostToken.trim()}`;
}

export function resolveQuickScoreHostToken(
  request: QuickScoreRequest,
  sessionCode?: string,
  legacyHostToken?: unknown
): string {
  const serializedCookie = readCookie(request, PPL_QUICK_SCORE_HOST_COOKIE);
  const separatorIndex = serializedCookie.indexOf(".");
  if (separatorIndex > 0) {
    const cookieSessionCode = serializedCookie.slice(0, separatorIndex).trim().toUpperCase();
    const cookieHostToken = serializedCookie.slice(separatorIndex + 1).trim();
    if (
      cookieHostToken &&
      (!sessionCode || cookieSessionCode === sessionCode.trim().toUpperCase())
    ) {
      return cookieHostToken;
    }
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^QuickScoreHost\s+([^\s]+)$/i);
  if (match?.[1]) return match[1];

  // Temporary compatibility path for tabs running a pre-migration build.
  const queryHostToken = new URL(request.url).searchParams.get("hostToken")?.trim() ?? "";
  if (queryHostToken) return queryHostToken;

  return typeof legacyHostToken === "string" ? legacyHostToken.trim() : "";
}
