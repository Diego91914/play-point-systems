import { beforeEach, describe, expect, it } from "vitest";
import {
  checkContactRateLimit,
  resetContactRateLimitsForTests,
} from "../app/lib/contact-security";

describe("contact form rate limiting", () => {
  beforeEach(() => resetContactRateLimitsForTests());

  it("allows five attempts in a fifteen-minute window", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkContactRateLimit("test-ip", 1_000).allowed).toBe(true);
    }
    expect(checkContactRateLimit("test-ip", 1_000).allowed).toBe(false);
  });

  it("opens a new window after fifteen minutes", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      checkContactRateLimit("test-ip", 1_000);
    }
    expect(checkContactRateLimit("test-ip", 901_001).allowed).toBe(true);
  });

  it("tracks different request identities separately", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      checkContactRateLimit("first-ip", 1_000);
    }
    expect(checkContactRateLimit("second-ip", 1_000).allowed).toBe(true);
  });
});
