"use client";

import { useMemo, useSyncExternalStore } from "react";

export type MysterySession = { code: string; playerId: string; token: string };

export const MYSTERY_SESSION_KEY = "pps-mystery-session";
const SESSION_EVENT = "pps:mystery-session-change";

export function readMysterySessionSnapshot(): string | null {
  try { return localStorage.getItem(MYSTERY_SESSION_KEY); } catch { return null; }
}

export function parseMysterySession(raw: string | null): MysterySession | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<MysterySession> | null;
    if (!value || typeof value.code !== "string" || typeof value.playerId !== "string" || typeof value.token !== "string") return null;
    if (!value.code || !value.playerId || !value.token) return null;
    return { code: value.code, playerId: value.playerId, token: value.token };
  } catch { return null; }
}

export function subscribeMysterySession(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const serverSnapshot = () => null;

export function saveMysterySession(session: MysterySession) {
  localStorage.setItem(MYSTERY_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearMysterySession() {
  localStorage.removeItem(MYSTERY_SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useMysterySession() {
  const raw = useSyncExternalStore(subscribeMysterySession, readMysterySessionSnapshot, serverSnapshot);
  return useMemo(() => parseMysterySession(raw), [raw]);
}
