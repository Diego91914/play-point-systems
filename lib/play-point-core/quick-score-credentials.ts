import { randomBytes, randomInt } from "node:crypto";

const QUICK_SCORE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRandomCharacters(length: number): string {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += QUICK_SCORE_CODE_ALPHABET[randomInt(QUICK_SCORE_CODE_ALPHABET.length)];
  }

  return value;
}

export function createQuickScoreSessionCode(): string {
  return generateRandomCharacters(6);
}

export function createQuickScoreRecoveryCode(): string {
  // Twenty-six base32 characters provide 130 bits of entropy while remaining
  // case-insensitive and easy to transcribe with the existing recovery flow.
  return `PPL-${generateRandomCharacters(26)}`;
}

export function createQuickScoreHostToken(): string {
  return `qs-host-${randomBytes(32).toString("base64url")}`;
}

export function createQuickScorePlayerSessionToken(): string {
  return `PPLS-${generateRandomCharacters(32)}`;
}
