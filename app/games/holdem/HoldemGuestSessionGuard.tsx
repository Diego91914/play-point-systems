"use client";

import { useEffect, type ReactNode } from "react";

const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

type Credentials = { code?: unknown; playerId?: unknown; token?: unknown };
type RetentionMeta = { code: string; firstSeenAt: number; role: "host" | "guest" | "unknown" };

export function HoldemGuestSessionGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const inspect = async () => {
      if (cancelled) return;
      const code = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase() ?? "";
      if (!code) return;

      const storageKey = `pps-holdem-${code}`;
      const metaKey = `${storageKey}:retention`;
      const clear = () => {
        try {
          window.localStorage.removeItem(storageKey);
          window.localStorage.removeItem(metaKey);
        } catch {}
      };

      let raw: string | null = null;
      try { raw = window.localStorage.getItem(storageKey); } catch { clear(); return; }
      if (!raw) return;

      let credentials: Credentials;
      try { credentials = JSON.parse(raw) as Credentials; } catch { clear(); return; }
      if (
        typeof credentials.code !== "string" || credentials.code.toUpperCase() !== code ||
        typeof credentials.playerId !== "string" || typeof credentials.token !== "string"
      ) {
        clear();
        return;
      }

      let meta: RetentionMeta | null = null;
      try {
        const rawMeta = window.localStorage.getItem(metaKey);
        if (rawMeta) meta = JSON.parse(rawMeta) as RetentionMeta;
      } catch {}
      if (!meta || meta.code !== code || !Number.isFinite(meta.firstSeenAt)) {
        meta = { code, firstSeenAt: Date.now(), role: "unknown" };
        try { window.localStorage.setItem(metaKey, JSON.stringify(meta)); } catch {}
      }

      if (meta.role === "guest" && Date.now() - meta.firstSeenAt >= GUEST_SESSION_TTL_MS) {
        clear();
        window.location.replace(`/games/holdem?code=${encodeURIComponent(code)}`);
        return;
      }

      if (meta.role !== "unknown") {
        if (timer !== null) window.clearInterval(timer);
        timer = null;
        return;
      }

      try {
        const response = await fetch(`/api/games/holdem/${encodeURIComponent(code)}`, {
          cache: "no-store",
          headers: {
            "x-holdem-player-id": credentials.playerId,
            "x-holdem-token": credentials.token,
          },
        });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const isHost = payload?.table?.me?.isHost === true;
        const nextMeta: RetentionMeta = { ...meta, role: isHost ? "host" : "guest" };
        try { window.localStorage.setItem(metaKey, JSON.stringify(nextMeta)); } catch {}

        if (!isHost && Date.now() - nextMeta.firstSeenAt >= GUEST_SESSION_TTL_MS) {
          clear();
          window.location.replace(`/games/holdem?code=${encodeURIComponent(code)}`);
          return;
        }

        if (timer !== null) window.clearInterval(timer);
        timer = null;
      } catch {}
    };

    void inspect();
    timer = window.setInterval(() => void inspect(), 1000);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearInterval(timer);
    };
  }, []);

  return children;
}
