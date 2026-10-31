"use client";

import { useEffect, useState } from "react";

export type MysterySession = { code: string; playerId: string; token: string };

export const MYSTERY_SESSION_KEY = "pps-mystery-session";
const SESSION_EVENT = "pps:mystery-session-change";

function readSession(): MysterySession | null {
  try {
    const raw = localStorage.getItem(MYSTERY_SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<MysterySession>;
    if (typeof value.code !== "string" || typeof value.playerId !== "string" || typeof value.token !== "string") return null;
    return { code: value.code, playerId: value.playerId, token: value.token };
  } catch {
    return null;
  }
}

export function saveMysterySession(session: MysterySession) {
  localStorage.setItem(MYSTERY_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearMysterySession() {
  localStorage.removeItem(MYSTERY_SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useMysterySession() {
  const [session, setSession] = useState<MysterySession | null>(null);

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return session;
}
