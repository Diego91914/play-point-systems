import { describe, expect, it } from "vitest";
import {
  PPL_QUICK_SCORE_HOST_COOKIE,
  PPL_QUICK_SCORE_IDENTITY_COOKIE,
  parseQuickScoreRecoveryKey,
  resolveQuickScoreHostToken,
  resolveQuickScorePlayerCredentials,
  serializeQuickScoreHostCookie,
  serializeQuickScoreIdentityCookie,
  serializeQuickScoreRecoveryKey,
} from "../lib/play-point-core/quick-score-auth";

describe("Quick Score request authorization", () => {
  it("round-trips a portable account recovery key", () => {
    const identity = {
      playerId: "8f149252-f25d-4f7c-860c-c85b92a75e07",
      recoveryCode: "ppl-abcd-2345",
    };

    expect(parseQuickScoreRecoveryKey(serializeQuickScoreRecoveryKey(identity))).toEqual({
      playerId: identity.playerId,
      recoveryCode: identity.recoveryCode.toUpperCase(),
    });
    expect(parseQuickScoreRecoveryKey("missing-separator")).toBeNull();
    expect(parseQuickScoreRecoveryKey(null)).toBeNull();
  });

  it("rejects legacy query-string and Authorization-header player credentials", () => {
    const request = new Request(
      "https://example.test/api/live/quick-score/clubs?playerId=player-1&recoveryCode=ppl-old-code",
      { headers: { Authorization: "QuickScore header-player.PPL-HEADER-CODE" } }
    );

    expect(resolveQuickScorePlayerCredentials(request)).toBeNull();
  });

  it("reads player credentials only from the HttpOnly cookie", () => {
    const cookieIdentity = {
      playerId: "cookie-player",
      recoveryCode: "PPL-COOKIE-CODE",
    };
    const request = new Request(
      "https://example.test/api/live/quick-score/clubs?playerId=legacy&recoveryCode=PPL-LEGACY",
      {
        headers: {
          Authorization: "QuickScore header-player.PPL-HEADER-CODE",
          Cookie: `${PPL_QUICK_SCORE_IDENTITY_COOKIE}=${serializeQuickScoreIdentityCookie(
            cookieIdentity
          )}`,
        },
      }
    );

    expect(resolveQuickScorePlayerCredentials(request)).toEqual(cookieIdentity);
  });

  it("does not accept request-body identity values", () => {
    const request = new Request("https://example.test/api/live/quick-score/clubs", {
      method: "POST",
    });

    expect(
      resolveQuickScorePlayerCredentials(request)
    ).toBeNull();
  });

  it("rejects legacy query-string and Authorization-header host credentials", () => {
    const request = new Request(
      "https://example.test/api/live/quick-score/sessions/ABC123?hostToken=query-token",
      { headers: { Authorization: "QuickScoreHost header-token" } }
    );
    expect(resolveQuickScoreHostToken(request, "ABC123")).toBe("");
  });

  it("uses a host cookie only for its matching session", () => {
    const hostToken = "qs-host-cookie-token";
    const request = new Request("https://example.test/api/live/quick-score/sessions/ABC123", {
      headers: {
        Cookie: `${PPL_QUICK_SCORE_HOST_COOKIE}=${serializeQuickScoreHostCookie(
          "ABC123",
          hostToken
        )}`,
      },
    });

    expect(resolveQuickScoreHostToken(request, "ABC123")).toBe(hostToken);
    expect(resolveQuickScoreHostToken(request, "XYZ789")).toBe("");
  });
});
