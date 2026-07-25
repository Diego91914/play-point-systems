import { afterEach, describe, expect, it, vi } from "vitest";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  } satisfies Storage;
}

async function loadIdentityModule() {
  vi.resetModules();
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  vi.stubGlobal("window", { localStorage, sessionStorage });
  vi.stubGlobal("navigator", {});
  return {
    module: await import("../lib/play-point-core/quick-score-identity"),
    localStorage,
    sessionStorage,
  };
}

describe("Quick Score browser identity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shares one identity creation across concurrent callers", async () => {
    const { module, localStorage } = await loadIdentityModule();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          playerId: "player-created-once",
          recoveryCode: "PPL-CREATED-ONCE",
          restored: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      module.ensureQuickScoreIdentity(),
      module.ensureQuickScoreIdentity(),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(localStorage.getItem(module.PPL_QUICK_SCORE_PLAYER_ID_KEY)).toBe(
      "player-created-once"
    );
    expect(localStorage.getItem(module.PPL_QUICK_SCORE_CREDENTIAL_KIND_KEY)).toBe("recovery");
  });

  it("persists and clears an email account device session", async () => {
    const { module, localStorage, sessionStorage } = await loadIdentityModule();
    module.persistQuickScoreIdentity({
      playerId: "email-linked-player",
      recoveryCode: "PPLS-DEVICESESSION23456789ABCDEFGHJK",
      credentialKind: "account_session",
    });

    expect(module.resolveStoredQuickScoreIdentity()).toEqual({
      playerId: "email-linked-player",
      recoveryCode: "PPLS-DEVICESESSION23456789ABCDEFGHJK",
      credentialKind: "account_session",
    });

    module.clearStoredQuickScoreIdentity();
    expect(module.resolveStoredQuickScoreIdentity()).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("strictly rejects an invalid recovery key without replacing stored identity", async () => {
    const { module, localStorage } = await loadIdentityModule();
    localStorage.setItem(module.PPL_QUICK_SCORE_PLAYER_ID_KEY, "current-player");
    localStorage.setItem(module.PPL_QUICK_SCORE_RECOVERY_CODE_KEY, "PPL-CURRENT");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Invalid player identity." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(
      module.restoreQuickScoreIdentitySession({
        playerId: "other-player",
        recoveryCode: "PPL-WRONG",
      })
    ).rejects.toThrow("Invalid player identity.");

    expect(localStorage.getItem(module.PPL_QUICK_SCORE_PLAYER_ID_KEY)).toBe("current-player");
    expect(localStorage.getItem(module.PPL_QUICK_SCORE_RECOVERY_CODE_KEY)).toBe("PPL-CURRENT");
  });
});
