import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("server-only", () => ({}));

import {
  setQuickScoreHostCookie,
  setQuickScoreIdentityCookie,
} from "../lib/play-point-core/quick-score-cookie";

describe("Quick Score session cookies", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sets an HttpOnly, same-site identity cookie scoped to Quick Score APIs", () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = NextResponse.json({ success: true });

    setQuickScoreIdentityCookie(response, {
      playerId: "player-id",
      recoveryCode: "PPL-RECOVERY-CODE",
    });

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("ppl_quick_score_identity=");
    expect(cookie).toContain("Path=/api/live/quick-score");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
  });

  it("marks production host cookies Secure", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = NextResponse.json({ success: true });

    setQuickScoreHostCookie(response, "ABC123", "qs-host-token");

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("ppl_quick_score_host=ABC123.qs-host-token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=lax");
  });
});
