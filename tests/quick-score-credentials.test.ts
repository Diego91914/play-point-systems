import { describe, expect, it, vi } from "vitest";
import {
  createQuickScoreHostToken,
  createQuickScoreRecoveryCode,
  createQuickScoreSessionCode,
} from "../lib/play-point-core/quick-score-credentials";

describe("Quick Score credentials", () => {
  it("does not depend on Math.random", () => {
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random must not be used for credentials");
    });

    expect(() => createQuickScoreSessionCode()).not.toThrow();
    expect(() => createQuickScoreRecoveryCode()).not.toThrow();
    expect(() => createQuickScoreHostToken()).not.toThrow();

    randomSpy.mockRestore();
  });

  it("creates six-character spectator session codes", () => {
    expect(createQuickScoreSessionCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("creates case-insensitive recovery codes with at least 128 bits of entropy", () => {
    expect(createQuickScoreRecoveryCode()).toMatch(
      /^PPL-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{26}$/
    );
  });

  it("creates 256-bit host tokens", () => {
    expect(createQuickScoreHostToken()).toMatch(/^qs-host-[A-Za-z0-9_-]{43}$/);
  });

  it("does not repeat generated credentials in a representative sample", () => {
    const sampleSize = 256;

    expect(new Set(Array.from({ length: sampleSize }, createQuickScoreRecoveryCode)).size).toBe(
      sampleSize
    );
    expect(new Set(Array.from({ length: sampleSize }, createQuickScoreHostToken)).size).toBe(
      sampleSize
    );
  });
});
