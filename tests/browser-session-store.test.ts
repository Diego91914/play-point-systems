import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { saveBrowserGameSession, subscribeBrowserGameSession } from "../app/games/_components/browser-session-store";
beforeEach(() => {
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("localStorage", { setItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());
it("notifies widgets in the creating or joining tab after credentials are saved", () => {
  const listener = vi.fn();
  const unsubscribe = subscribeBrowserGameSession(listener);
  saveBrowserGameSession("existing-game-key", { code: "ABCDEF", token: "test-only" });
  expect(localStorage.setItem).toHaveBeenCalledWith("existing-game-key", JSON.stringify({ code: "ABCDEF", token: "test-only" }));
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  saveBrowserGameSession("existing-game-key", {});
  expect(listener).toHaveBeenCalledTimes(1);
});
it.each(["storage", "pageshow", "focus", "popstate"])("refreshes credentials on %s and removes listeners on unmount", event => {
  const listener = vi.fn();
  const unsubscribe = subscribeBrowserGameSession(listener);
  window.dispatchEvent(new Event(event));
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  window.dispatchEvent(new Event(event));
  expect(listener).toHaveBeenCalledTimes(1);
});
it("does not announce credentials that failed to save", () => {
  vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error("storage unavailable"); });
  const listener = vi.fn();
  const unsubscribe = subscribeBrowserGameSession(listener);
  expect(() => saveBrowserGameSession("key", {})).toThrow("storage unavailable");
  expect(listener).not.toHaveBeenCalled();
  unsubscribe();
});
