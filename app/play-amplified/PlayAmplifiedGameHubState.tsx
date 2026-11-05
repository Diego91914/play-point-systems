"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MASTER_GAME_CATALOG, type MasterGameEntry } from "@/lib/play-point-core/master-game-catalog";
import type { ResumeCandidate } from "./PlayAmplifiedResumeRuntime";

type RecentGame = { id: string; playedAt: number };
type GameHubState = {
  activeGame: ResumeCandidate | null;
  recentGame: MasterGameEntry | null;
  blockNotice: string;
  refresh: () => Promise<void>;
  endActiveGame: () => Promise<boolean>;
  requestLaunch: () => boolean;
  recordPlayed: (game: MasterGameEntry) => void;
  clearNotice: () => void;
};

const RECENT_GAME_STORAGE_KEY = "pa_recently_played_game_v1";
const GameHubContext = createContext<GameHubState | null>(null);

function storedRecent(): RecentGame | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_GAME_STORAGE_KEY) ?? "null") as Partial<RecentGame> | null;
    if (value && typeof value.id === "string" && MASTER_GAME_CATALOG.some((game) => game.id === value.id))
      return { id: value.id, playedAt: typeof value.playedAt === "number" ? value.playedAt : 0 };

    // One-time migration from existing local game history into its own recency record.
    if (window.localStorage.getItem("pps-clear-stack-host-room")) {
      const migrated = { id: "clear-the-stack", playedAt: Date.now() };
      window.localStorage.setItem(RECENT_GAME_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return null;
}

export function PlayAmplifiedGameHubStateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeGame, setActiveGame] = useState<ResumeCandidate | null>(null);
  const [recentId, setRecentId] = useState<string | null>(null);
  const [blockNotice, setBlockNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const { readResumeCandidates } = await import("./PlayAmplifiedResumeRuntime");
      const candidates = await readResumeCandidates();
      setActiveGame(candidates[0] ?? null);
    } catch {
      // Keep the last known active game if discovery fails while offline.
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/play-amplified") {
      setActiveGame(null);
      return;
    }
    setRecentId(storedRecent()?.id ?? null);
    void refresh();
    const onResume = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("pageshow", onResume);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.removeEventListener("pageshow", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, [refresh, pathname]);

  const recentGame = useMemo(() => recentId ? MASTER_GAME_CATALOG.find((game) => game.id === recentId) ?? null : null, [recentId]);

  const recordPlayed = useCallback((game: MasterGameEntry) => {
    const recent = { id: game.id, playedAt: Date.now() };
    try { window.localStorage.setItem(RECENT_GAME_STORAGE_KEY, JSON.stringify(recent)); } catch {}
    setRecentId(game.id);
    setBlockNotice("");
  }, []);

  const requestLaunch = useCallback(() => {
    if (!activeGame) return true;
    setBlockNotice(`End ${activeGame.title} before starting another game.`);
    return false;
  }, [activeGame]);

  const clearNotice = useCallback(() => setBlockNotice(""), []);

  const endActiveGame = useCallback(async () => {
    if (!activeGame?.endAction) return false;
    const confirmed = window.confirm("End Clear the Stack? This closes the live game for everyone and disconnects its spectator link.");
    if (!confirmed) return false;
    try {
      const { closeClearStackGame } = await import("./PlayAmplifiedGameHubEndAction");
      await closeClearStackGame(activeGame.endAction);
      const recent = { id: activeGame.gameId ?? "clear-the-stack", playedAt: Date.now() };
      try {
        window.localStorage.setItem(RECENT_GAME_STORAGE_KEY, JSON.stringify(recent));
        window.localStorage.removeItem("pps-clear-stack-host-room");
      } catch {}
      setRecentId(recent.id);
      await refresh();
      setBlockNotice("");
      return true;
    } catch (error) {
      setBlockNotice(error instanceof Error ? error.message : "Could not end the game. Reconnect and try again.");
      return false;
    }
  }, [activeGame, refresh]);

  const value = useMemo(() => ({ activeGame, recentGame, blockNotice, refresh, endActiveGame, requestLaunch, recordPlayed, clearNotice }),
    [activeGame, recentGame, blockNotice, refresh, endActiveGame, requestLaunch, recordPlayed, clearNotice]);
  return <GameHubContext.Provider value={value}>{children}</GameHubContext.Provider>;
}

export function usePlayAmplifiedGameHub() {
  const context = useContext(GameHubContext);
  if (!context) throw new Error("Play Amplified game hub state is unavailable.");
  return context;
}
