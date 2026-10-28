import { afterEach, describe, expect, it, vi } from "vitest";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Play Amplified resume recovery", () => {
  it.each([
    ["host", "pps-mystery-session", "/games/mystery"],
    ["guest", "pps-chain-reaction-session", "/games/chain-reaction"],
  ])("retains the %s credential and offers retry when the server is unreachable", async (_role, key, route) => {
    const localStorage = new MemoryStorage();
    const stored = { code: "ABC234", playerId: "player-1", token: "session-token", updatedAt: 1 };
    localStorage.setItem(key, JSON.stringify(stored));
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const { readResumeCandidates } = await import("../app/play-amplified/PlayAmplifiedResumeRuntime");
    const candidates = await readResumeCandidates();
    const candidate = candidates.find((item) => item.key === key);

    expect(candidate?.href).toContain(route);
    expect(candidate?.connection).toBe("offline");
    expect(localStorage.getItem(key)).toBe(JSON.stringify(stored));
  });

  it("does not expire a server-valid session based on local age", async () => {
    const localStorage = new MemoryStorage();
    const stored = { code: "ABC234", playerId: "player-1", token: "session-token", updatedAt: 1 };
    localStorage.setItem("pps-chain-reaction-session", JSON.stringify(stored));
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ended: false }) }));

    const { readResumeCandidates } = await import("../app/play-amplified/PlayAmplifiedResumeRuntime");
    const candidates = await readResumeCandidates();

    expect(candidates.find((item) => item.key === "pps-chain-reaction-session")?.connection).toBe("online");
    expect(localStorage.getItem("pps-chain-reaction-session")).toBe(JSON.stringify(stored));
  });

  it("recognizes terminal server state without deleting the saved guest credential", async () => {
    const localStorage = new MemoryStorage();
    const stored = { code: "ABC234", playerId: "player-1", token: "session-token", updatedAt: 1 };
    localStorage.setItem("pps-chain-reaction-session", JSON.stringify(stored));
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ended: true }) }));

    const { readResumeCandidates } = await import("../app/play-amplified/PlayAmplifiedResumeRuntime");
    const candidates = await readResumeCandidates();

    expect(candidates.some((item) => item.key === "pps-chain-reaction-session")).toBe(false);
    expect(localStorage.getItem("pps-chain-reaction-session")).toBe(JSON.stringify(stored));
  });
});
