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

describe("Clear the Stack platform resume", () => {
  it("discovers the account's authoritative room without local credentials", async () => {
    vi.stubGlobal("window", { localStorage: new MemoryStorage() });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ room: {
      id: "host-room", code: "ABC234", updated_at: "2026-11-04T18:00:00Z", game_state: { phase: "playing" },
    } })));
    const { readResumeCandidates } = await import("../app/play-amplified/PlayAmplifiedResumeRuntime");
    const candidates = await readResumeCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ title: "Clear the Stack", href: "/games/clear-the-stack", connection: "online" });
  });
  it.each([401, 503])("preserves the saved host route during HTTP %s", async status => {
    const localStorage = new MemoryStorage();
    localStorage.setItem("pps-clear-stack-host-room", "saved-room");
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
    const { readResumeCandidates } = await import("../app/play-amplified/PlayAmplifiedResumeRuntime");
    expect((await readResumeCandidates())[0]).toMatchObject({ title: "Clear the Stack", connection: status === 401 ? "reconnect" : "offline" });
    expect(localStorage.getItem("pps-clear-stack-host-room")).toBe("saved-room");
  });
  it("does not restore a session when the account has no live room", async () => {
    const localStorage = new MemoryStorage();
    localStorage.setItem("pps-clear-stack-host-room", "old-room");
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ room: null })));
    const { readResumeCandidates } = await import("../app/play-amplified/PlayAmplifiedResumeRuntime");
    expect(await readResumeCandidates()).toEqual([]);
  });
});
