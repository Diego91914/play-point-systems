import { describe, expect, it } from "vitest";
import {
  buildQuickScoreHostRequestHeaders,
  buildQuickScoreIdentityRequestHeaders,
  resolveQuickScoreHostToken,
  resolveQuickScorePlayerCredentials,
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

  it("round-trips host credentials through the Authorization header", () => {
    const hostToken = "qs-host-example_token";
    const request = new Request("https://example.test/api/live/quick-score/sessions/ABC123", {
      headers: buildQuickScoreHostRequestHeaders(hostToken),
    });

    expect(resolveQuickScoreHostToken(request)).toBe(hostToken);
    expect(request.url).not.toContain(hostToken);
  });
});
