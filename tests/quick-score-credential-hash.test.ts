import { describe, expect, it } from "vitest";
import {
  hashQuickScoreCredential,
  QUICK_SCORE_CREDENTIAL_HASH_VERSION,
  verifyQuickScoreStoredCredential,
  verifyQuickScoreStoredCredentialHash,
} from "../lib/play-point-core/quick-score-credential-hash";

describe("Quick Score credential hashing", () => {
  it("creates deterministic base64url SHA-256 digests", () => {
    const digest = hashQuickScoreCredential("PPL-EXAMPLE-CREDENTIAL");

    expect(digest).toHaveLength(43);
    expect(digest).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashQuickScoreCredential("PPL-EXAMPLE-CREDENTIAL")).toBe(digest);
    expect(hashQuickScoreCredential("PPL-DIFFERENT-CREDENTIAL")).not.toBe(digest);
  });

  it("verifies a versioned hash without a plaintext value", () => {
    const secret = "PPL-HIGH-ENTROPY-CREDENTIAL";

    expect(
      verifyQuickScoreStoredCredential(secret, {
        hash: hashQuickScoreCredential(secret),
        version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
        legacyValue: null,
      })
    ).toBe(true);
    expect(
      verifyQuickScoreStoredCredential("PPL-WRONG-CREDENTIAL", {
        hash: hashQuickScoreCredential(secret),
        version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
        legacyValue: null,
      })
    ).toBe(false);
  });

  it("retains compatibility with an existing plaintext credential", () => {
    expect(
      verifyQuickScoreStoredCredential("PPL-LEGACY", {
        hash: null,
        version: null,
        legacyValue: "PPL-LEGACY",
      })
    ).toBe(true);
    expect(
      verifyQuickScoreStoredCredential("PPL-WRONG", {
        hash: null,
        version: null,
        legacyValue: "PPL-LEGACY",
      })
    ).toBe(false);
  });

  it("distinguishes a versioned hash match from a legacy fallback", () => {
    expect(
      verifyQuickScoreStoredCredentialHash("PPL-LEGACY", {
        hash: null,
        version: null,
      })
    ).toBe(false);

    const secret = "PPL-CURRENT-CREDENTIAL";
    expect(
      verifyQuickScoreStoredCredentialHash(secret, {
        hash: hashQuickScoreCredential(secret),
        version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
      })
    ).toBe(true);
  });

  it("rejects unknown hash versions", () => {
    const secret = "qs-host-example";

    expect(
      verifyQuickScoreStoredCredential(secret, {
        hash: hashQuickScoreCredential(secret),
        version: 99,
        legacyValue: null,
      })
    ).toBe(false);
  });
});
