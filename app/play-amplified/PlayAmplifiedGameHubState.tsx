"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MASTER_GAME_CATALOG, type MasterGameEntry } from "@/lib/play-point-core/master-game-catalog";
import type { ResumeCandidate } from "./PlayAmplifiedResumeRuntime";

type RecentGame = { id: string; playedAt: number };
type GameHubState = {
  activeGame: ResumeCandidate | null;
  recentGame: MasterGameEntry | null;
  blockNotice: string;
  endingGame: boolean;
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
  const [endingGame, setEndingGame] = useState(false);
  const endingRef = useRef(false);
  const endedKeysRef = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    try {
      const { readResumeCandidates } = await import("./PlayAmplifiedResumeRuntime");
      const candidates = await readResumeCandidates();
      setActiveGame(candidates.find((candidate) => !endedKeysRef.current.has(candidate.key)) ?? null);
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
    if (!activeGame?.endAction || endingRef.current) return false;
    const confirmed = window.confirm(`End ${activeGame.title}? This ends the live session for everyone. Completed scores and records will be kept.`);
    if (!confirmed) return false;
    endingRef.current = true;
    setEndingGame(true);
    setBlockNotice("");
    try {
      const { endPlayAmplifiedSession } = await import("./PlayAmplifiedGameHubEndAction");
      await endPlayAmplifiedSession(activeGame.endAction);
      endedKeysRef.current.add(activeGame.key);
      const recent = { id: activeGame.gameId ?? "clear-the-stack", playedAt: Date.now() };
      try {
        for (const key of activeGame.clearKeys) window.localStorage.removeItem(key);
        window.localStorage.setItem(RECENT_GAME_STORAGE_KEY, JSON.stringify(recent));
      } catch {}
      setRecentId(recent.id);
      setActiveGame(null);
      await refresh();
      setBlockNotice("");
      return true;
    } catch (error) {
      setBlockNotice(error instanceof Error ? error.message : "Could not end the game. Reconnect and try again.");
      return false;
    } finally {
      endingRef.current = false;
      setEndingGame(false);
    }
  }, [activeGame, refresh]);

  const value = useMemo(() => ({ activeGame, recentGame, blockNotice, endingGame, refresh, endActiveGame, requestLaunch, recordPlayed, clearNotice }),
    [activeGame, recentGame, blockNotice, endingGame, refresh, endActiveGame, requestLaunch, recordPlayed, clearNotice]);
  return <GameHubContext.Provider value={value}>{children}</GameHubContext.Provider>;
}

export function usePlayAmplifiedGameHub() {
  const context = useContext(GameHubContext);
  if (!context) throw new Error("Play Amplified game hub state is unavailable.");
  return context;
}
