import { createHash, timingSafeEqual } from "node:crypto";

export const QUICK_SCORE_CREDENTIAL_HASH_VERSION = 1;

export type QuickScoreStoredCredential = {
  hash?: unknown;
  version?: unknown;
  legacyValue?: unknown;
};

export function hashQuickScoreCredential(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyQuickScoreStoredCredential(
  presentedValue: string,
  stored: QuickScoreStoredCredential
): boolean {
  if (!presentedValue) return false;

  if (
    stored.version === QUICK_SCORE_CREDENTIAL_HASH_VERSION &&
    typeof stored.hash === "string"
  ) {
    const presentedHash = hashQuickScoreCredential(presentedValue);
    if (safeStringEqual(presentedHash, stored.hash)) return true;
  }

  return typeof stored.legacyValue === "string"
    ? safeStringEqual(presentedValue, stored.legacyValue)
    : false;
}
