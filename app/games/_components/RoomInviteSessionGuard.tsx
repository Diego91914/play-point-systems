"use client";

import type { ReactNode } from "react";

export function RoomInviteSessionGuard({
  storageKey,
  children,
}: {
  storageKey: string;
  children: ReactNode;
}) {
  if (typeof window !== "undefined") {
    const invitedCode = new URLSearchParams(window.location.search)
      .get("code")
      ?.trim()
      .toUpperCase();

    if (invitedCode) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw) as { code?: unknown };
          if (
            typeof saved.code !== "string" ||
            saved.code.trim().toUpperCase() !== invitedCode
          ) {
            window.localStorage.removeItem(storageKey);
          }
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
  }

  return children;
}
