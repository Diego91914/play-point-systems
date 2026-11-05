"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const CHANGE_EVENT = "pps:browser-session-change";

// This only observes existing browser credentials. Server APIs still authorize
// membership and own game state; this is not an active-game registry.
export function saveBrowserGameSession(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeBrowserGameSession(onChange: () => void) {
  for (const event of [CHANGE_EVENT, "storage", "pageshow", "focus", "popstate"]) window.addEventListener(event, onChange);
  return () => {
    for (const event of [CHANGE_EVENT, "storage", "pageshow", "focus", "popstate"]) window.removeEventListener(event, onChange);
  };
}
const emptySnapshot = () => null;

export function useBrowserGameSession<T>(key: string | (() => string)) {
  const snapshot = useCallback(() => {
    try { return localStorage.getItem(typeof key === "function" ? key() : key); } catch { return null; }
  }, [key]);
  const raw = useSyncExternalStore(subscribeBrowserGameSession, snapshot, emptySnapshot);
  return useMemo(() => {
    try { return raw ? JSON.parse(raw) as T : null; } catch { return null; }
  }, [raw]);
}

export function useBrowserLocationSearch() {
  return useSyncExternalStore(subscribeBrowserGameSession, () => window.location.search, () => "");
}
