export type QuickScorePlayerCredentials = {
  playerId: string;
  recoveryCode: string;
};

type QuickScoreRequest = Pick<Request, "headers" | "url">;

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

export function resolveQuickScorePlayerCredentials(
  request: QuickScoreRequest
): QuickScorePlayerCredentials | null {
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
  return playerId && recoveryCode ? { playerId, recoveryCode } : null;
}

export function buildQuickScoreHostRequestHeaders(hostToken: string): Record<string, string> {
  return {
    Authorization: `QuickScoreHost ${hostToken.trim()}`,
  };
}

export function resolveQuickScoreHostToken(request: QuickScoreRequest): string {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^QuickScoreHost\s+([^\s]+)$/i);
  if (match?.[1]) return match[1];

  // Temporary compatibility path for tabs running a pre-migration build.
  return new URL(request.url).searchParams.get("hostToken")?.trim() ?? "";
}
