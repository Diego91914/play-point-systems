export type QuickScorePlayerCredentials = {
  playerId: string;
  recoveryCode: string;
};

type QuickScoreRequest = Pick<Request, "headers">;

export const PPL_QUICK_SCORE_IDENTITY_COOKIE = "ppl_quick_score_identity";
export const PPL_QUICK_SCORE_HOST_COOKIE = "ppl_quick_score_host";

export function normalizeRecoveryCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function serializeQuickScoreIdentityCookie(
  identity: QuickScorePlayerCredentials
): string {
  return `${identity.playerId}.${normalizeRecoveryCode(identity.recoveryCode)}`;
}

export function serializeQuickScoreRecoveryKey(
  identity: QuickScorePlayerCredentials
): string {
  return serializeQuickScoreIdentityCookie(identity);
}

function readCookie(request: QuickScoreRequest, name: string): string {
  const cookieHeader = request.headers.get("cookie") ?? "";

  for (const entry of cookieHeader.split(";")) {
    const [entryName, ...valueParts] = entry.trim().split("=");
    if (entryName === name) return valueParts.join("=").trim();
  }

  return "";
}

export function parseQuickScoreRecoveryKey(value: unknown): QuickScorePlayerCredentials | null {
  if (typeof value !== "string") return null;

  const separatorIndex = value.indexOf(".");
  if (separatorIndex < 1) return null;

  const playerId = value.slice(0, separatorIndex).trim();
  const recoveryCode = normalizeRecoveryCode(value.slice(separatorIndex + 1));
  return playerId && recoveryCode ? { playerId, recoveryCode } : null;
}

export function resolveQuickScorePlayerCredentials(
  request: QuickScoreRequest
): QuickScorePlayerCredentials | null {
  return parseQuickScoreRecoveryKey(
    readCookie(request, PPL_QUICK_SCORE_IDENTITY_COOKIE)
  );
}

export function serializeQuickScoreHostCookie(sessionCode: string, hostToken: string): string {
  return `${sessionCode.trim().toUpperCase()}.${hostToken.trim()}`;
}

export function resolveQuickScoreHostToken(
  request: QuickScoreRequest,
  sessionCode?: string
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

  return "";
}
