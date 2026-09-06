"use client";

import { useEffect, type ReactNode } from "react";

const GUEST_ROOM_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

type StoredRoomSession = {
  code?: unknown;
  playerId?: unknown;
  token?: unknown;
};

type RetentionMeta = {
  code: string;
  firstSeenAt: number;
  role: "host" | "guest" | "unknown";
};

export function RoomInviteSessionGuard({
  storageKey,
  roomApiBase,
  children,
}: {
  storageKey: string;
  roomApiBase: string;
  children: ReactNode;
}) {
  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;
    const metaKey = `${storageKey}:retention`;

    const clearRoomSession = () => {
      try {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(metaKey);
      } catch {}
    };

    const inspect = async () => {
      if (cancelled) return;
      const invitedCode = new URLSearchParams(window.location.search)
        .get("code")
        ?.trim()
        .toUpperCase();

      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(storageKey);
      } catch {
        clearRoomSession();
        return;
      }

      // Opening a game normally should start a fresh room experience. The
      // durable paid-account cookie is separate and is never cleared here.
      if (!invitedCode) {
        if (raw) clearRoomSession();
        return;
      }

      // A guest may join after this component mounts. Poll briefly until the
      // client writes the room session so we can start its 24-hour clock.
      if (!raw) return;

      let saved: StoredRoomSession;
      try {
        saved = JSON.parse(raw) as StoredRoomSession;
      } catch {
        clearRoomSession();
        return;
      }

      if (
        typeof saved.code !== "string" ||
        saved.code.trim().toUpperCase() !== invitedCode ||
        typeof saved.playerId !== "string" ||
        typeof saved.token !== "string"
      ) {
        clearRoomSession();
        return;
      }

      let meta: RetentionMeta | null = null;
      try {
        const rawMeta = window.localStorage.getItem(metaKey);
        if (rawMeta) meta = JSON.parse(rawMeta) as RetentionMeta;
      } catch {}

      if (!meta || meta.code !== invitedCode || !Number.isFinite(meta.firstSeenAt)) {
        meta = { code: invitedCode, firstSeenAt: Date.now(), role: "unknown" };
        try {
          window.localStorage.setItem(metaKey, JSON.stringify(meta));
        } catch {}
      }

      if (meta.role === "guest" && Date.now() - meta.firstSeenAt >= GUEST_ROOM_SESSION_TTL_MS) {
        clearRoomSession();
        window.location.replace(window.location.pathname + `?code=${encodeURIComponent(invitedCode)}`);
        return;
      }

      if (meta.role !== "unknown") {
        if (pollTimer !== null) window.clearInterval(pollTimer);
        pollTimer = null;
        return;
      }

      try {
        const response = await fetch(
          `${roomApiBase}/${encodeURIComponent(invitedCode)}?playerId=${encodeURIComponent(saved.playerId)}&token=${encodeURIComponent(saved.token)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const isHost = payload?.state?.me?.isHost === true;
        const nextMeta: RetentionMeta = {
          ...meta,
          role: isHost ? "host" : "guest",
        };
        try {
          window.localStorage.setItem(metaKey, JSON.stringify(nextMeta));
        } catch {}

        if (!isHost && Date.now() - nextMeta.firstSeenAt >= GUEST_ROOM_SESSION_TTL_MS) {
          clearRoomSession();
          window.location.replace(window.location.pathname + `?code=${encodeURIComponent(invitedCode)}`);
          return;
        }

        if (pollTimer !== null) window.clearInterval(pollTimer);
        pollTimer = null;
      } catch {
        // Keep the session if the network is temporarily unavailable. The next
        // page load can classify it again without falsely ejecting the player.
      }
    };

    void inspect();
    pollTimer = window.setInterval(() => void inspect(), 1000);

    return () => {
      cancelled = true;
      if (pollTimer !== null) window.clearInterval(pollTimer);
    };
  }, [roomApiBase, storageKey]);

  return children;
}
