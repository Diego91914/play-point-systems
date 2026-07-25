import { describe, expect, it } from "vitest";
import {
  PPL_QUICK_SCORE_HOST_COOKIE,
  PPL_QUICK_SCORE_IDENTITY_COOKIE,
  buildQuickScoreHostRequestHeaders,
  buildQuickScoreIdentityRequestHeaders,
  parseQuickScoreRecoveryKey,
  resolveQuickScoreHostToken,
  resolveQuickScorePlayerCredentials,
  serializeQuickScoreHostCookie,
  serializeQuickScoreIdentityCookie,
  serializeQuickScoreRecoveryKey,
} from "../lib/play-point-core/quick-score-auth";

describe("Quick Score request authorization", () => {
  it("round-trips player credentials through the Authorization header", () => {
    const identity = {
      playerId: "8f149252-f25d-4f7c-860c-c85b92a75e07",
      recoveryCode: "ppl-abcd-2345",
    };
    const request = new Request("https://example.test/api/live/quick-score/clubs", {
      headers: buildQuickScoreIdentityRequestHeaders(identity),
    });

    expect(resolveQuickScorePlayerCredentials(request)).toEqual({
      ...identity,
      recoveryCode: identity.recoveryCode.toUpperCase(),
    });
    expect(request.url).not.toContain(identity.recoveryCode);
  });

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

  it("temporarily accepts legacy query-string player credentials", () => {
    const request = new Request(
      "https://example.test/api/live/quick-score/clubs?playerId=player-1&recoveryCode=ppl-old-code"
    );

    expect(resolveQuickScorePlayerCredentials(request)).toEqual({
      playerId: "player-1",
      recoveryCode: "PPL-OLD-CODE",
    });
  });

  it("prefers the Authorization header over legacy query parameters", () => {
    const request = new Request(
      "https://example.test/api/live/quick-score/clubs?playerId=legacy&recoveryCode=PPL-LEGACY",
      {
        headers: buildQuickScoreIdentityRequestHeaders({
          playerId: "current",
          recoveryCode: "PPL-CURRENT",
        }),
      }
    );

    expect(resolveQuickScorePlayerCredentials(request)?.playerId).toBe("current");
  });

  it("prefers the HttpOnly cookie value over compatibility credentials", () => {
    const cookieIdentity = {
      playerId: "cookie-player",
      recoveryCode: "PPL-COOKIE-CODE",
    };
    const request = new Request(
      "https://example.test/api/live/quick-score/clubs?playerId=legacy&recoveryCode=PPL-LEGACY",
      {
        headers: {
          ...buildQuickScoreIdentityRequestHeaders({
            playerId: "header-player",
            recoveryCode: "PPL-HEADER-CODE",
          }),
          Cookie: `${PPL_QUICK_SCORE_IDENTITY_COOKIE}=${serializeQuickScoreIdentityCookie(
            cookieIdentity
          )}`,
        },
      }
    );

    expect(resolveQuickScorePlayerCredentials(request)).toEqual(cookieIdentity);
  });

  it("accepts a legacy request-body identity when no cookie or header exists", () => {
    const request = new Request("https://example.test/api/live/quick-score/clubs", {
      method: "POST",
    });

    expect(
      resolveQuickScorePlayerCredentials(request, {
        playerId: "body-player",
        recoveryCode: "ppl-body-code",
      })
    ).toEqual({ playerId: "body-player", recoveryCode: "PPL-BODY-CODE" });
  });

  it("round-trips host credentials through the Authorization header", () => {
    const hostToken = "qs-host-example_token";
    const request = new Request("https://example.test/api/live/quick-score/sessions/ABC123", {
      headers: buildQuickScoreHostRequestHeaders(hostToken),
    });

    expect(resolveQuickScoreHostToken(request)).toBe(hostToken);
    expect(request.url).not.toContain(hostToken);
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
    expect(resolveQuickScoreHostToken(request, "XYZ789", "legacy-host-token")).toBe(
      "legacy-host-token"
    );
  });
});
