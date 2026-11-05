import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearMysterySession, parseMysterySession, readMysterySessionSnapshot, saveMysterySession, subscribeMysterySession } from "../app/games/mystery/useMysterySession";

const session = { code: "ABCDEF", playerId: "player", token: "test-token" };
describe("Last Call shared session", () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) });
    vi.stubGlobal("window", new EventTarget());
  });
  afterEach(() => vi.unstubAllGlobals());
  it("notifies already mounted widgets immediately on create, join and clear", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMysterySession(listener);
    saveMysterySession(session);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(parseMysterySession(readMysterySessionSnapshot())).toEqual(session);
    clearMysterySession();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(readMysterySessionSnapshot()).toBeNull();
    unsubscribe();
    saveMysterySession(session);
    expect(listener).toHaveBeenCalledTimes(2);
  });
  it("receives cross-tab changes and keeps snapshots stable between writes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMysterySession(listener);
    saveMysterySession(session);
    const snapshot = readMysterySessionSnapshot();
    expect(readMysterySessionSnapshot()).toBe(snapshot);
    window.dispatchEvent(new Event("storage"));
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
  it.each([null, "null", "[]", "invalid", JSON.stringify({ ...session, token: "" })])("rejects malformed credentials: %s", raw => {
    expect(parseMysterySession(raw)).toBeNull();
  });
  it("tolerates unavailable browser storage without crashing widgets", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("storage blocked"); } });
    expect(readMysterySessionSnapshot()).toBeNull();
  });
});
