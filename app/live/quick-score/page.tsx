"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QUICK_SCORE_GAMES,
  applyQuickScorePoints,
  createQuickScoreSession,
  getQuickScoreCurrentScoreLabel,
  getQuickScoreLastPlay,
  getQuickScorePreviousScoreLabel,
  getQuickScoreGameConfig,
  normalizePointOptions,
  undoQuickScorePlay,
  type QuickScoreCompetitor,
  type QuickScoreGameConfig,
  type QuickScoreGameId,
  type QuickScoreSession,
} from "@/lib/play-point-core/quick-score";
import type {
  QuickScoreClubSummary,
  QuickScoreEventRecord,
  QuickScoreMatchRecord,
} from "@/lib/play-point-core/quick-score-club";
import { buildQuickScoreIdentityRequestHeaders } from "@/lib/play-point-core/quick-score-auth";

const SESSION_STORAGE_KEY = "quickScore.session.v1";
const PPL_QUICK_SCORE_PLAYER_ID_KEY = "ppl_quick_score_player_id";
const PPL_QUICK_SCORE_RECOVERY_CODE_KEY = "ppl_quick_score_recovery_code";
const QUICK_SCORE_PRO_SKU = "tool.quick_score.pro";

type QuickScoreSetupStep = "GAME" | "PLAYERS" | "START";
type QuickScoreScreenMode = "SETUP" | "LIVE" | "GAME_OVER";

type QuickScoreDraft = {
  gameId: QuickScoreGameId;
  competitorNames: string[];
  genericTargetScore: number;
  genericTargetScoreInput: string;
  genericPointOptions: number[];
};

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type QuickScoreIdentity = {
  playerId: string;
  recoveryCode: string;
};

type QuickScoreLaunchContext = {
  clubId: string;
  eventId: string;
  clubName: string;
  eventName: string;
};

function resolveStoredQuickScoreIdentity(): QuickScoreIdentity | null {
  if (typeof window === "undefined") return null;

  const playerId =
    window.sessionStorage.getItem(PPL_QUICK_SCORE_PLAYER_ID_KEY) ||
    window.localStorage.getItem(PPL_QUICK_SCORE_PLAYER_ID_KEY) ||
    "";
  const recoveryCode =
    window.sessionStorage.getItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY) ||
    window.localStorage.getItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY) ||
    "";

  if (!playerId || !recoveryCode) return null;
  return { playerId, recoveryCode };
}

function persistQuickScoreIdentity(identity: QuickScoreIdentity) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PPL_QUICK_SCORE_PLAYER_ID_KEY, identity.playerId);
  window.sessionStorage.setItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY, identity.recoveryCode);
  window.localStorage.setItem(PPL_QUICK_SCORE_PLAYER_ID_KEY, identity.playerId);
  window.localStorage.setItem(PPL_QUICK_SCORE_RECOVERY_CODE_KEY, identity.recoveryCode);
}

function makeDefaultDraft(): QuickScoreDraft {
  const defaultGame = QUICK_SCORE_GAMES[0]!;
  return {
    gameId: defaultGame.id,
    competitorNames: [...defaultGame.suggestedNames.slice(0, defaultGame.minCompetitors)],
    genericTargetScore: 21,
    genericTargetScoreInput: "21",
    genericPointOptions: [1, 2, 3, 5],
  };
}

function buildDraftFromGame(game: QuickScoreGameConfig, previous: QuickScoreDraft): QuickScoreDraft {
  const competitorCount = Math.max(game.minCompetitors, Math.min(previous.competitorNames.length, game.maxCompetitors));
  const names = Array.from({ length: competitorCount }, (_, index) => {
    const existing = previous.competitorNames[index]?.trim();
    if (existing) return existing;
    return game.suggestedNames[index] ?? `${game.competitorNoun} ${index + 1}`;
  });

  return {
    ...previous,
    gameId: game.id,
    competitorNames: names,
    genericTargetScore: game.id === "GENERIC_POINTS" ? previous.genericTargetScore : game.targetScore,
    genericTargetScoreInput:
      game.id === "GENERIC_POINTS" ? previous.genericTargetScoreInput : String(game.targetScore),
    genericPointOptions: game.id === "GENERIC_POINTS" ? previous.genericPointOptions : game.pointOptions,
  };
}

function normalizeQuickScoreDraft(raw: QuickScoreDraft): QuickScoreDraft {
  const nextTargetScore =
    Number.isFinite(raw.genericTargetScore) && raw.genericTargetScore >= 1
      ? Math.floor(raw.genericTargetScore)
      : 21;
  const nextInput =
    typeof raw.genericTargetScoreInput === "string" && raw.genericTargetScoreInput.length > 0
      ? raw.genericTargetScoreInput
      : String(nextTargetScore);

  return {
    ...raw,
    genericTargetScore: nextTargetScore,
    genericTargetScoreInput: nextInput,
    genericPointOptions: normalizePointOptions(raw.genericPointOptions ?? [1, 2, 3, 5]),
  };
}

function ensureCompetitorNames(names: string[], game: QuickScoreGameConfig): string[] {
  return names.map((name) => name.trim()).filter((name) => name.length > 0).map((name, index) => name || `${game.competitorNoun} ${index + 1}`);
}

function getSessionConfigFromDraft(draft: QuickScoreDraft): {
  game: QuickScoreGameConfig;
  competitorNames: string[];
  targetScore?: number;
  pointOptions?: number[];
} {
  const game = getQuickScoreGameConfig(draft.gameId);
  const competitorNames = draft.competitorNames.map((name, index) => {
    const trimmed = name.trim();
    return trimmed || game.suggestedNames[index] || `${game.competitorNoun} ${index + 1}`;
  });

  if (draft.gameId !== "GENERIC_POINTS") {
    return { game, competitorNames };
  }

  return {
    game,
    competitorNames,
    targetScore: Math.max(1, Math.floor(draft.genericTargetScore || 21)),
    pointOptions: normalizePointOptions(draft.genericPointOptions),
  };
}

function formatLastPlay(session: QuickScoreSession | null): string {
  if (!session) return "Waiting for the first score";
  const lastPlay = getQuickScoreLastPlay(session);
  if (!lastPlay) return "Waiting for the first score";
  return `${lastPlay.competitorName} scored ${lastPlay.pointsAdded}. Total: ${lastPlay.newScore}.`;
}

function getCompetitorScore(session: QuickScoreSession, competitorId: string): number {
  return session.scores[competitorId] ?? 0;
}

function getScoreboardLines(session: QuickScoreSession | null): string[] {
  if (!session) return [];
  return session.competitors.map((competitor) => `${competitor.name} ${session.scores[competitor.id] ?? 0}`);
}

function getWinner(session: QuickScoreSession): QuickScoreCompetitor | null {
  return session.competitors.find((competitor) => competitor.id === session.winnerCompetitorId) ?? null;
}

function getQuickScoreGameAccent(gameId: QuickScoreGameId): {
  glowClass: string;
  panelClass: string;
  chipClass: string;
  buttonClass: string;
} {
  switch (gameId) {
    case "CORNHOLE":
      return {
        glowClass:
          "bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.16),_transparent_34%)]",
        panelClass:
          "border-amber-300/18 bg-[linear-gradient(180deg,rgba(120,53,15,0.2),rgba(16,24,39,0.9))]",
        chipClass: "border-amber-300/25 bg-amber-300/12 text-amber-50",
        buttonClass: "bg-[linear-gradient(90deg,#fde68a,#fbbf24,#fb923c)] text-slate-950",
      };
    case "HORSESHOES":
      return {
        glowClass:
          "bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.16),_transparent_34%)]",
        panelClass:
          "border-lime-300/18 bg-[linear-gradient(180deg,rgba(20,83,45,0.22),rgba(16,24,39,0.9))]",
        chipClass: "border-lime-300/25 bg-lime-300/12 text-lime-50",
        buttonClass: "bg-[linear-gradient(90deg,#bef264,#4ade80,#2dd4bf)] text-slate-950",
      };
    case "WASHERS":
      return {
        glowClass:
          "bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.16),_transparent_34%)]",
        panelClass:
          "border-sky-300/18 bg-[linear-gradient(180deg,rgba(14,116,144,0.2),rgba(15,23,42,0.9))]",
        chipClass: "border-sky-300/25 bg-sky-300/12 text-sky-50",
        buttonClass: "bg-[linear-gradient(90deg,#93c5fd,#67e8f9,#22d3ee)] text-slate-950",
      };
    case "PICKLEBALL":
      return {
        glowClass:
          "bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.16),_transparent_34%)]",
        panelClass:
          "border-emerald-300/18 bg-[linear-gradient(180deg,rgba(6,95,70,0.22),rgba(15,23,42,0.9))]",
        chipClass: "border-emerald-300/25 bg-emerald-300/12 text-emerald-50",
        buttonClass: "bg-[linear-gradient(90deg,#86efac,#34d399,#2dd4bf)] text-slate-950",
      };
    case "GENERIC_POINTS":
    default:
      return {
        glowClass:
          "bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.14),_transparent_34%)]",
        panelClass:
          "border-cyan-300/18 bg-[linear-gradient(180deg,rgba(14,165,233,0.16),rgba(15,23,42,0.92))]",
        chipClass: "border-cyan-300/25 bg-cyan-300/12 text-cyan-50",
        buttonClass: "bg-[linear-gradient(90deg,#7dd3fc,#67e8f9,#fcd34d)] text-slate-950",
      };
  }
}

export default function QuickScorePage() {
  const [hydrated, setHydrated] = useState(false);
  const [setupStep, setSetupStep] = useState<QuickScoreSetupStep>("GAME");
  const [screenMode, setScreenMode] = useState<QuickScoreScreenMode>("SETUP");
  const [draft, setDraft] = useState<QuickScoreDraft>(makeDefaultDraft);
  const [session, setSession] = useState<QuickScoreSession | null>(null);
  const [bigScreenMode, setBigScreenMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [joinBaseUrl, setJoinBaseUrl] = useState("");
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [accountPlayerId, setAccountPlayerId] = useState("");
  const [accountRecoveryCode, setAccountRecoveryCode] = useState("");
  const [quickScoreProEnabled, setQuickScoreProEnabled] = useState(false);
  const [entitlementsLoading, setEntitlementsLoading] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [proStatusMessage, setProStatusMessage] = useState("");
  const [launchContext, setLaunchContext] = useState<QuickScoreLaunchContext>({
    clubId: "",
    eventId: "",
    clubName: "",
    eventName: "",
  });
  const [clubSaveClubs, setClubSaveClubs] = useState<QuickScoreClubSummary[]>([]);
  const [clubSaveEvents, setClubSaveEvents] = useState<QuickScoreEventRecord[]>([]);
  const [clubSaveMatches, setClubSaveMatches] = useState<QuickScoreMatchRecord[]>([]);
  const [clubSaveLoading, setClubSaveLoading] = useState(false);
  const [clubSaveEventsLoading, setClubSaveEventsLoading] = useState(false);
  const [selectedClubSaveId, setSelectedClubSaveId] = useState("");
  const [selectedClubEventId, setSelectedClubEventId] = useState("");
  const [newClubEventName, setNewClubEventName] = useState("");
  const [clubSaveError, setClubSaveError] = useState("");
  const [clubSaveStatus, setClubSaveStatus] = useState("");
  const [clubSaveBusy, setClubSaveBusy] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        setupStep?: QuickScoreSetupStep;
        screenMode?: QuickScoreScreenMode;
        draft?: QuickScoreDraft;
        session?: QuickScoreSession | null;
        bigScreenMode?: boolean;
        sessionCode?: string | null;
        hostToken?: string | null;
        joinBaseUrl?: string;
        lastSyncedAt?: string | null;
      };

       if (parsed.draft) setDraft(normalizeQuickScoreDraft(parsed.draft));
      if (parsed.session) setSession(parsed.session);
      if (parsed.setupStep) setSetupStep(parsed.setupStep);
      if (parsed.screenMode) setScreenMode(parsed.screenMode);
      if (parsed.bigScreenMode) setBigScreenMode(parsed.bigScreenMode);
      if (parsed.sessionCode) setSessionCode(parsed.sessionCode);
      if (parsed.hostToken) setHostToken(parsed.hostToken);
      if (parsed.joinBaseUrl) setJoinBaseUrl(parsed.joinBaseUrl);
      if (parsed.lastSyncedAt) setLastSyncedAt(parsed.lastSyncedAt);
    } catch {
      // Ignore stale state and start fresh.
    }
    setJoinBaseUrl(window.location.origin);
    setNetworkOnline(window.navigator.onLine);

    const identity = resolveStoredQuickScoreIdentity();
    if (identity) {
      setAccountPlayerId(identity.playerId);
      setAccountRecoveryCode(identity.recoveryCode);
    }

    const checkoutState = new URLSearchParams(window.location.search).get("checkout");
    const launchParams = new URLSearchParams(window.location.search);
    setLaunchContext((current) => ({
      ...current,
      clubId: launchParams.get("clubId")?.trim() ?? "",
      eventId: launchParams.get("eventId")?.trim() ?? "",
    }));
    if (checkoutState === "success") {
      setProStatusMessage("Quick Score Pro unlocked on this device.");
    } else if (checkoutState === "cancelled") {
      setProStatusMessage("Checkout cancelled. Local scoring stays free.");
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        setupStep,
        screenMode,
        draft,
        session,
        bigScreenMode,
        sessionCode,
        hostToken,
        joinBaseUrl,
        lastSyncedAt,
      })
    );
  }, [bigScreenMode, draft, hostToken, hydrated, joinBaseUrl, lastSyncedAt, screenMode, session, sessionCode, setupStep]);

  useEffect(() => {
    if (!hydrated || screenMode !== "LIVE") return;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hydrated, screenMode]);

  useEffect(() => {
    async function requestWakeLock() {
      if (screenMode !== "LIVE" || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
      try {
        const wakeLock = (navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
        }).wakeLock;
        if (!wakeLock) return;
        wakeLockRef.current = await wakeLock.request("screen");
      } catch {
        wakeLockRef.current = null;
      }
    }

    void requestWakeLock();
    return () => {
      if (wakeLockRef.current) {
        void wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [screenMode]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const activeGame = useMemo(() => getQuickScoreGameConfig(draft.gameId), [draft.gameId]);
  const lastPlayText = useMemo(() => formatLastPlay(session), [session]);
  const previousScoreText = useMemo(
    () => (session ? getQuickScorePreviousScoreLabel(session) : "No previous score yet"),
    [session]
  );
  const currentScoreText = useMemo(
    () => (session ? getQuickScoreCurrentScoreLabel(session) : "No score yet"),
    [session]
  );
  const currentScoreLines = useMemo(() => getScoreboardLines(session), [session]);
  const winner = useMemo(() => (session ? getWinner(session) : null), [session]);
  const rankedCompetitors = useMemo(() => {
    if (!session) return [];
    return [...session.competitors].sort((left, right) => {
      const scoreDelta = getCompetitorScore(session, right.id) - getCompetitorScore(session, left.id);
      if (scoreDelta !== 0) return scoreDelta;
      return session.competitors.findIndex((entry) => entry.id === left.id) - session.competitors.findIndex((entry) => entry.id === right.id);
    });
  }, [session]);
  const leader = rankedCompetitors[0] ?? null;
  const runnerUp = rankedCompetitors[1] ?? null;
  const leaderMargin =
    session && leader && runnerUp
      ? getCompetitorScore(session, leader.id) - getCompetitorScore(session, runnerUp.id)
      : 0;
  const gameAccent = useMemo(() => getQuickScoreGameAccent(draft.gameId), [draft.gameId]);
  const joinUrl = sessionCode ? `${joinBaseUrl}/live/quick-score/${sessionCode}` : "";

  const pushRemoteSession = useCallback(async (nextSession: QuickScoreSession, force = false) => {
    try {
      if (!networkOnline || (!quickScoreProEnabled && !force)) return;

      if (!sessionCode || !hostToken) {
        const response = await fetch("/api/live/quick-score/sessions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: nextSession }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || "Unable to create spectator session.");
        }
        setSessionCode((data as { sessionCode?: string }).sessionCode ?? null);
        setHostToken((data as { hostToken?: string }).hostToken ?? null);
        setLastSyncedAt(new Date().toISOString());
        setSyncError("");
        return;
      }

      const response = await fetch(`/api/live/quick-score/sessions/${sessionCode}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostToken,
          session: nextSession,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to sync spectator board.");
      }
      setLastSyncedAt(new Date().toISOString());
      setSyncError("");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Spectator sync unavailable.");
    }
  }, [hostToken, networkOnline, quickScoreProEnabled, sessionCode]);

  const loadQuickScoreProStatus = useCallback(async (
    identity: QuickScoreIdentity,
    options?: { syncActiveSession?: boolean }
  ) => {
    setEntitlementsLoading(true);

    try {
      const response = await fetch("/api/live/quick-score/entitlement?runtime=qr_mvp_v12", {
        headers: buildQuickScoreIdentityRequestHeaders(identity),
      });
      if (!response.ok) {
        throw new Error("Unable to load Quick Score Pro access.");
      }

      const data = await response.json().catch(() => ({}));
      const toolSkus = Array.isArray((data as { entitlements?: { toolSkus?: unknown[] } }).entitlements?.toolSkus)
        ? ((data as { entitlements?: { toolSkus?: unknown[] } }).entitlements?.toolSkus ?? []).filter(
            (value): value is string => typeof value === "string"
          )
        : [];
      const proEnabled = toolSkus.includes(QUICK_SCORE_PRO_SKU);

      setQuickScoreProEnabled(proEnabled);
      if (proEnabled && options?.syncActiveSession && session) {
        void pushRemoteSession(session, true);
      }
    } catch {
      // Keep local scoring playable even if entitlement refresh fails.
    } finally {
      setEntitlementsLoading(false);
    }
  }, [pushRemoteSession, session]);

  const ensureAnonymousAccount = useCallback(async (): Promise<QuickScoreIdentity | null> => {
    if (accountPlayerId && accountRecoveryCode) {
      return { playerId: accountPlayerId, recoveryCode: accountRecoveryCode };
    }

    const storedIdentity = resolveStoredQuickScoreIdentity();
    if (storedIdentity) {
      setAccountPlayerId(storedIdentity.playerId);
      setAccountRecoveryCode(storedIdentity.recoveryCode);
      return storedIdentity;
    }

    try {
      const response = await fetch("/api/live/quick-score/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setCheckoutError("Could not create an account for Quick Score Pro right now.");
        return null;
      }

      const data = await response.json().catch(() => ({}));
      const playerId = typeof data.playerId === "string" ? data.playerId : "";
      const recoveryCode = typeof data.recoveryCode === "string" ? data.recoveryCode : "";
      if (!playerId || !recoveryCode) {
        setCheckoutError("Quick Score Pro account setup returned invalid data.");
        return null;
      }

      const identity = { playerId, recoveryCode };
      persistQuickScoreIdentity(identity);
      setAccountPlayerId(identity.playerId);
      setAccountRecoveryCode(identity.recoveryCode);
      return identity;
    } catch {
      setCheckoutError("Could not create an account for Quick Score Pro right now.");
      return null;
    }
  }, [accountPlayerId, accountRecoveryCode]);

  const loadClubSaveEvents = useCallback(async (clubId: string, preferredEventId = "") => {
    const identity = await ensureAnonymousAccount();
    if (!identity || !clubId) return;

    setClubSaveEventsLoading(true);
    setClubSaveError("");

    try {
      const requestOptions = {
        headers: buildQuickScoreIdentityRequestHeaders(identity),
      };

      const [eventsResponse, matchesResponse] = await Promise.all([
        fetch(`/api/live/quick-score/clubs/${clubId}/events`, requestOptions),
        fetch(`/api/live/quick-score/clubs/${clubId}/matches`, requestOptions),
      ]);

      const [eventsData, matchesData] = await Promise.all([
        eventsResponse.json().catch(() => ({})),
        matchesResponse.json().catch(() => ({})),
      ]);

      if (!eventsResponse.ok) {
        throw new Error((eventsData as { error?: string }).error || "Unable to load events.");
      }

      if (!matchesResponse.ok) {
        throw new Error((matchesData as { error?: string }).error || "Unable to load matches.");
      }

      const events = Array.isArray((eventsData as { events?: unknown[] }).events)
        ? ((eventsData as { events?: QuickScoreEventRecord[] }).events ?? [])
        : [];
      const matches = Array.isArray((matchesData as { matches?: unknown[] }).matches)
        ? ((matchesData as { matches?: QuickScoreMatchRecord[] }).matches ?? [])
        : [];

      setClubSaveEvents(events);
      setClubSaveMatches(matches);

      const nextEventId =
        (preferredEventId && events.some((event) => event.id === preferredEventId)
          ? preferredEventId
          : selectedClubEventId && events.some((event) => event.id === selectedClubEventId)
          ? selectedClubEventId
          : "") ?? "";

      setSelectedClubEventId(nextEventId);
      const selectedEvent = events.find((event) => event.id === nextEventId) ?? null;
      setLaunchContext((current) => ({
        ...current,
        eventId: nextEventId || current.eventId,
        eventName: selectedEvent?.name ?? current.eventName,
      }));
    } catch (error) {
      setClubSaveError(error instanceof Error ? error.message : "Unable to load club events.");
    } finally {
      setClubSaveEventsLoading(false);
    }
  }, [ensureAnonymousAccount, selectedClubEventId]);

  const loadClubSaveOptions = useCallback(async (preferredClubId = "", preferredEventId = "") => {
    const identity = await ensureAnonymousAccount();
    if (!identity) return;

    setClubSaveLoading(true);
    setClubSaveError("");

    try {
      const response = await fetch("/api/live/quick-score/clubs", {
        headers: buildQuickScoreIdentityRequestHeaders(identity),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to load clubs.");
      }

      const clubs = Array.isArray((data as { clubs?: unknown[] }).clubs)
        ? ((data as { clubs?: QuickScoreClubSummary[] }).clubs ?? [])
        : [];
      setClubSaveClubs(clubs);

      const nextClubId =
        (preferredClubId && clubs.some((club) => club.id === preferredClubId)
          ? preferredClubId
          : selectedClubSaveId && clubs.some((club) => club.id === selectedClubSaveId)
          ? selectedClubSaveId
          : clubs[0]?.id) ?? "";

      setSelectedClubSaveId(nextClubId);
      const selectedClub = clubs.find((club) => club.id === nextClubId) ?? null;
      setLaunchContext((current) => ({
        ...current,
        clubId: nextClubId || current.clubId,
        clubName: selectedClub?.name ?? current.clubName,
      }));

      if (nextClubId) {
        await loadClubSaveEvents(nextClubId, preferredEventId);
      } else {
        setClubSaveEvents([]);
        setClubSaveMatches([]);
      }
    } catch (error) {
      setClubSaveError(error instanceof Error ? error.message : "Unable to load clubs.");
    } finally {
      setClubSaveLoading(false);
    }
  }, [ensureAnonymousAccount, loadClubSaveEvents, selectedClubSaveId]);

  useEffect(() => {
    if (!hydrated || !accountPlayerId || !accountRecoveryCode) return;
    void loadQuickScoreProStatus({
      playerId: accountPlayerId,
      recoveryCode: accountRecoveryCode,
    });
  }, [accountPlayerId, accountRecoveryCode, hydrated, loadQuickScoreProStatus]);

  useEffect(() => {
    if (!hydrated) return;
    if (screenMode !== "GAME_OVER" && !launchContext.clubId) return;
    void loadClubSaveOptions(launchContext.clubId, launchContext.eventId);
  }, [hydrated, launchContext.clubId, launchContext.eventId, loadClubSaveOptions, screenMode]);

  async function createClubSaveEvent() {
    if (!selectedClubSaveId || !newClubEventName.trim()) {
      setClubSaveError("Event name is required.");
      return;
    }

    const identity = await ensureAnonymousAccount();
    if (!identity) return;

    setClubSaveBusy(true);
    setClubSaveError("");
    setClubSaveStatus("");

    try {
      const response = await fetch(`/api/live/quick-score/clubs/${selectedClubSaveId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: identity.playerId,
          recoveryCode: identity.recoveryCode,
          name: newClubEventName,
          eventType: "casual",
          status: "live",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to create event.");
      }

      const event = (data as { event?: QuickScoreEventRecord }).event;
      if (event) {
        const nextEvents = [event, ...clubSaveEvents];
        setClubSaveEvents(nextEvents);
        setSelectedClubEventId(event.id);
        setLaunchContext((current) => ({
          ...current,
          clubId: selectedClubSaveId,
          eventId: event.id,
          eventName: event.name,
        }));
      }
      setNewClubEventName("");
      setClubSaveStatus("Event created. This match will save into it.");
    } catch (error) {
      setClubSaveError(error instanceof Error ? error.message : "Unable to create event.");
    } finally {
      setClubSaveBusy(false);
    }
  }

  async function saveCurrentMatchToClub() {
    if (!session || screenMode !== "GAME_OVER") return;
    if (!selectedClubSaveId) {
      setClubSaveError("Choose a club first.");
      return;
    }

    const identity = await ensureAnonymousAccount();
    if (!identity) return;

    setClubSaveBusy(true);
    setClubSaveError("");
    setClubSaveStatus("");

    try {
      const response = await fetch(`/api/live/quick-score/clubs/${selectedClubSaveId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: identity.playerId,
          recoveryCode: identity.recoveryCode,
          eventId: selectedClubEventId || undefined,
          sessionCode,
          session,
          status: "complete",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to save match.");
      }

      const match = (data as { match?: QuickScoreMatchRecord }).match;
      const selectedClub = clubSaveClubs.find((club) => club.id === selectedClubSaveId) ?? null;
      const selectedEvent = clubSaveEvents.find((event) => event.id === selectedClubEventId) ?? null;

      if (match) {
        setClubSaveMatches((current) => [match, ...current.filter((entry) => entry.id !== match.id)]);
        const nextSession: QuickScoreSession = {
          ...session,
          context: {
            ...session.context,
            clubId: selectedClubSaveId,
            eventId: selectedClubEventId || null,
            matchId: match.id,
          },
        };
        setSession(nextSession);
      }

      setLaunchContext((current) => ({
        ...current,
        clubId: selectedClubSaveId,
        eventId: selectedClubEventId,
        clubName: selectedClub?.name ?? current.clubName,
        eventName: selectedEvent?.name ?? current.eventName,
      }));
      setClubSaveStatus(
        selectedEvent
          ? `Saved to ${selectedClub?.name ?? "club"} • ${selectedEvent.name}.`
          : `Saved to ${selectedClub?.name ?? "club"}.`
      );
    } catch (error) {
      setClubSaveError(error instanceof Error ? error.message : "Unable to save match.");
    } finally {
      setClubSaveBusy(false);
    }
  }

  async function startQuickScoreProCheckout() {
    setCheckoutBusy(true);
    setCheckoutError("");
    setProStatusMessage("");

    try {
      const identity = await ensureAnonymousAccount();
      if (!identity) return;

      const response = await fetch("/api/live/quick-score/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...identity,
          productId: "quick_score_pro",
          successPath: "/live/quick-score",
          cancelPath: "/live/quick-score",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to start Quick Score Pro checkout.");
      }

      if ((data as { alreadyOwned?: boolean }).alreadyOwned) {
        setProStatusMessage("Quick Score Pro is already unlocked for this account.");
        await loadQuickScoreProStatus(identity, { syncActiveSession: true });
        return;
      }

      const url = typeof (data as { url?: string }).url === "string" ? (data as { url?: string }).url : "";
      if (!url) {
        throw new Error("Checkout session created without a redirect URL.");
      }

      window.location.href = url;
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Unable to start Quick Score Pro checkout."
      );
    } finally {
      setCheckoutBusy(false);
    }
  }

  function selectGame(gameId: QuickScoreGameId) {
    const game = getQuickScoreGameConfig(gameId);
    setDraft((current) => buildDraftFromGame(game, current));
  }

  function updateGenericTargetScoreInput(nextValue: string) {
    setDraft((current) => {
      const parsed = Number(nextValue);
      return {
        ...current,
        genericTargetScoreInput: nextValue,
        genericTargetScore:
          Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : current.genericTargetScore,
      };
    });
  }

  function updateCompetitorName(index: number, nextName: string) {
    setDraft((current) => ({
      ...current,
      competitorNames: current.competitorNames.map((name, entryIndex) => (entryIndex === index ? nextName : name)),
    }));
  }

  function addCompetitor() {
    setDraft((current) => {
      const game = getQuickScoreGameConfig(current.gameId);
      if (current.competitorNames.length >= game.maxCompetitors) return current;
      return {
        ...current,
        competitorNames: [
          ...current.competitorNames,
          game.suggestedNames[current.competitorNames.length] ?? `${game.competitorNoun} ${current.competitorNames.length + 1}`,
        ],
      };
    });
  }

  function removeCompetitor(index: number) {
    setDraft((current) => {
      const game = getQuickScoreGameConfig(current.gameId);
      if (current.competitorNames.length <= game.minCompetitors) return current;
      return {
        ...current,
        competitorNames: current.competitorNames.filter((_, entryIndex) => entryIndex !== index),
      };
    });
  }

  function toggleGenericPoint(value: number) {
    setDraft((current) => {
      const exists = current.genericPointOptions.includes(value);
      const next = exists
        ? current.genericPointOptions.filter((entry) => entry !== value)
        : [...current.genericPointOptions, value];
      return {
        ...current,
        genericPointOptions: normalizePointOptions(next),
      };
    });
  }

  function clearClubSaveMessages() {
    setClubSaveError("");
    setClubSaveStatus("");
  }

  function startGame() {
    const { game, competitorNames, targetScore, pointOptions } = getSessionConfigFromDraft(draft);
    const nextSession = createQuickScoreSession({
      gameId: game.id,
      competitorNames,
      targetScore,
      pointOptions,
      context:
        launchContext.clubId || launchContext.eventId
          ? {
              clubId: launchContext.clubId || null,
              eventId: launchContext.eventId || null,
            }
          : undefined,
    });

    setSession(nextSession);
    setScreenMode("LIVE");
    setSettingsOpen(false);
    clearClubSaveMessages();
    void pushRemoteSession(nextSession);
  }

  function scorePoints(competitorId: string, points: number) {
    if (!session) return;
    const nextSession = applyQuickScorePoints(session, competitorId, points);
    setSession(nextSession);
    void pushRemoteSession(nextSession);
    if (nextSession.status === "COMPLETE") {
      setScreenMode("GAME_OVER");
      setSettingsOpen(false);
    }
  }

  function undoLastPlay() {
    if (!session) return;
    const nextSession = undoQuickScorePlay(session);
    setSession(nextSession);
    void pushRemoteSession(nextSession);
  }

  function playAgain() {
    const { game, competitorNames, targetScore, pointOptions } = getSessionConfigFromDraft(draft);
    const nextSession = createQuickScoreSession({
      gameId: game.id,
      competitorNames,
      targetScore,
      pointOptions,
      context:
        session?.context?.clubId || session?.context?.eventId
          ? {
              clubId: session?.context?.clubId ?? null,
              eventId: session?.context?.eventId ?? null,
            }
          : undefined,
    });
    setSession(nextSession);
    setScreenMode("LIVE");
    setSettingsOpen(false);
    clearClubSaveMessages();
    void pushRemoteSession(nextSession);
  }

  async function toggleBigScreenMode() {
    setBigScreenMode((current) => !current);
    setSettingsOpen(false);

    if (typeof document === "undefined") return;
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Fullscreen is best effort only.
    }
  }

  function resetToSetup() {
    setScreenMode("SETUP");
    setSetupStep("GAME");
    setSettingsOpen(false);
    setSession(null);
    setBigScreenMode(false);
    setSyncError("");
    clearClubSaveMessages();
  }

  async function installQuickScore() {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice.catch(() => undefined);
    setInstallPromptEvent(null);
  }

  async function reconnectSpectatorBoard() {
    if (!session) return;
    await pushRemoteSession(session);
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#07111d] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          Loading Quick Score...
        </div>
      </main>
    );
  }

  return (
    <main
      className={[
        "min-h-screen overflow-x-hidden text-white",
        screenMode === "SETUP" ? "bg-[#0a1320]" : bigScreenMode ? "bg-[#03060c]" : "bg-[#07111d]",
      ].join(" ")}
    >
      <div className="pointer-events-none fixed inset-0 opacity-95">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(150,230,211,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,206,134,0.12),_transparent_28%),linear-gradient(180deg,_#0d1a2c_0%,_#07111d_54%,_#04070d_100%)]" />
        <div className="absolute left-[-8%] top-[14%] h-72 w-72 rounded-full bg-[#8cc8ff]/10 blur-3xl" />
        <div className="absolute right-[-6%] top-[10%] h-80 w-80 rounded-full bg-[#8cf1c7]/10 blur-3xl" />
        <div className="absolute bottom-[8%] left-[10%] h-80 w-80 rounded-full bg-[#ffd58a]/8 blur-3xl" />
      </div>
      {screenMode !== "SETUP" && (
        <div className="pointer-events-none fixed inset-0 opacity-75">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(97,214,184,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(255,198,114,0.18),_transparent_28%),linear-gradient(180deg,_#091527_0%,_#07111d_54%,_#04070d_100%)]" />
        </div>
      )}

      <div className={["relative mx-auto px-4 py-6 sm:px-6", bigScreenMode ? "max-w-7xl" : "max-w-3xl"].join(" ")}>
        {screenMode === "SETUP" && (
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(17,28,44,0.96),rgba(11,23,40,0.92)_48%,rgba(8,14,25,0.98))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.36)] sm:p-7">
            <div className={`pointer-events-none absolute inset-0 opacity-90 ${gameAccent.glowClass}`} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
                Play Point Live · Quick Score
              </div>
              <Link
                href="/live"
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold text-white/74 transition hover:bg-white/10 hover:text-white"
              >
                Play Point Live Home
              </Link>
            </div>
            <h1 className="relative mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">A scoreboard in your pocket.</h1>
            <p className="relative mt-4 max-w-2xl text-base leading-7 text-white/74">
              Built for cornhole, horseshoes, washers, pickleball, and any backyard game where the score should never slow the fun down.
            </p>

            <div className="relative mt-5 flex flex-wrap gap-3">
              <Link
                href="/live/quick-score/clubs"
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
              >
                Open Club Memory
              </Link>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/66">
                Quick Match stays instant. Clubs save your recurring group.
              </div>
            </div>

            {(launchContext.clubId || launchContext.eventId) && (
              <div className="relative mt-5 rounded-[24px] border border-emerald-300/18 bg-emerald-400/10 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/72">
                  Club Match Context
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  {launchContext.clubName || "Club-selected Quick Match"}
                </div>
                <div className="mt-2 text-sm text-emerald-50/88">
                  {launchContext.eventName
                    ? `This scoreboard is attached to ${launchContext.eventName}. Finish the match and save the result back into your club history.`
                    : "This scoreboard is attached to a Quick Score club. Finish the match and save it back into the club memory layer."}
                </div>
              </div>
            )}

            <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { id: "GAME", label: "1. Game" },
                { id: "PLAYERS", label: "2. Players" },
                { id: "START", label: "3. Start" },
              ].map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setSetupStep(step.id as QuickScoreSetupStep)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left text-sm font-black transition duration-200",
                    setupStep === step.id
                      ? "border-cyan-200/65 bg-[linear-gradient(135deg,rgba(125,211,252,0.22),rgba(255,255,255,0.08))] text-cyan-50 shadow-[0_18px_40px_rgba(103,232,249,0.12)]"
                      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-white/70 hover:bg-white/8",
                  ].join(" ")}
                >
                  {step.label}
                </button>
              ))}
            </div>

            {installPromptEvent && (
              <div className="mt-5 rounded-[28px] border border-amber-300/20 bg-amber-400/10 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/75">Installable</div>
                <div className="mt-2 text-sm text-amber-50/90">
                  Install Quick Score to keep a scoreboard in your pocket and make offline launches easier.
                </div>
                <button
                  type="button"
                  onClick={installQuickScore}
                  className="mt-4 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_18px_50px_rgba(252,211,77,0.18)] transition hover:brightness-105"
                >
                  Install Quick Score
                </button>
              </div>
            )}

            {setupStep === "GAME" && (
              <div className="relative mt-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Choose a scoreboard</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {QUICK_SCORE_GAMES.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => selectGame(game.id)}
                      className={[
                        "rounded-[24px] border p-4 text-left transition duration-200",
                        draft.gameId === game.id
                          ? "border-cyan-200/70 bg-[linear-gradient(145deg,rgba(125,211,252,0.22),rgba(8,14,25,0.82))] text-cyan-50 shadow-[0_20px_50px_rgba(103,232,249,0.14)]"
                          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-white/80 hover:bg-white/8",
                      ].join(" ")}
                    >
                      <div className="text-lg font-black">{game.name}</div>
                      <div className="mt-1 text-sm text-white/65">{game.sportLabel}</div>
                      <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
                        Target {game.targetScore} | Buttons {game.pointOptions.map((value) => `+${value}`).join(" ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {setupStep === "PLAYERS" && (
              <div className="relative mt-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Name the board</div>
                <div className="mt-3 space-y-3">
                  {draft.competitorNames.map((name, index) => (
                    <div
                      key={`competitor-${index}`}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.7))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-black text-white">
                          {activeGame.competitorNoun} {index + 1}
                        </div>
                        {draft.competitorNames.length > activeGame.minCompetitors && (
                          <button
                            type="button"
                            onClick={() => removeCompetitor(index)}
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/75"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        id={`quick-score-competitor-${index}`}
                        name={`quick-score-competitor-${index}`}
                        type="text"
                        value={name}
                        onChange={(event) => updateCompetitorName(index, event.target.value)}
                        placeholder={activeGame.suggestedNames[index] ?? `${activeGame.competitorNoun} ${index + 1}`}
                        autoCorrect="off"
                        autoCapitalize="words"
                        spellCheck={false}
                        inputMode="text"
                        enterKeyHint="next"
                        aria-label={`${activeGame.competitorNoun} ${index + 1} name`}
                        className="sc-webkit-input-fix mt-3 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 caret-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-300/30"
                      />
                    </div>
                  ))}
                </div>

                {draft.competitorNames.length < activeGame.maxCompetitors && (
                  <button
                    type="button"
                    onClick={addCompetitor}
                    className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/15"
                  >
                    Add {activeGame.competitorNoun}
                  </button>
                )}
              </div>
            )}

            {setupStep === "START" && (
              <div className="relative mt-6 space-y-4">
                <div className={`rounded-[28px] border p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] ${gameAccent.panelClass}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/70">Ready to start</div>
                  <div className="mt-3 text-3xl font-black text-white">{activeGame.name}</div>
                  <div className="mt-2 text-sm text-emerald-50/90">
                    {ensureCompetitorNames(draft.competitorNames, activeGame).join(" vs ")}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Target</div>
                      <div className="mt-2 text-2xl font-black text-white">
                        {draft.gameId === "GENERIC_POINTS" ? draft.genericTargetScore : activeGame.targetScore}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Buttons</div>
                      <div className="mt-2 text-lg font-black text-white">
                        {(draft.gameId === "GENERIC_POINTS" ? normalizePointOptions(draft.genericPointOptions) : activeGame.pointOptions)
                          .map((value) => `+${value}`)
                          .join(" ")}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Win</div>
                      <div className="mt-2 text-lg font-black text-white">
                        {activeGame.winRule.type === "WIN_BY_TWO" ? `Win by ${activeGame.winRule.winBy}` : "First to target"}
                      </div>
                    </div>
                  </div>
                </div>

                {draft.gameId === "GENERIC_POINTS" && (
                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Generic setup</div>
                    <label className="mt-4 block">
                      <span className="text-sm font-black text-white">Target score</span>
                      <input
                        type="number"
                        min="1"
                        value={draft.genericTargetScoreInput}
                        onChange={(event) => updateGenericTargetScoreInput(event.target.value)}
                        className="sc-webkit-input-fix mt-2 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 caret-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-300/30"
                      />
                    </label>

                    <div className="mt-4 text-sm font-black text-white">Allowed point buttons</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 10].map((value) => {
                        const active = draft.genericPointOptions.includes(value);
                        return (
                          <button
                            key={`generic-point-${value}`}
                            type="button"
                            onClick={() => toggleGenericPoint(value)}
                            className={[
                              "rounded-full border px-4 py-2 text-sm font-black transition",
                              active
                                ? "border-cyan-200/70 bg-cyan-300/15 text-cyan-50"
                                : "border-white/12 bg-white/5 text-white/75 hover:bg-white/10",
                            ].join(" ")}
                          >
                            +{value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {setupStep !== "GAME" && (
                <button
                  type="button"
                  onClick={() =>
                    setSetupStep((current) =>
                      current === "START" ? "PLAYERS" : "GAME"
                    )
                  }
                  className="rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-black text-white/80 transition hover:bg-white/10"
                >
                  Back
                </button>
              )}

              {setupStep !== "START" ? (
                <button
                  type="button"
                  onClick={() =>
                    setSetupStep((current) =>
                      current === "GAME" ? "PLAYERS" : "START"
                    )
                  }
                  className={`rounded-2xl px-5 py-3 text-sm font-black shadow-[0_18px_50px_rgba(125,211,252,0.2)] transition hover:brightness-105 ${gameAccent.buttonClass}`}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startGame}
                  className={`rounded-2xl px-5 py-3 text-sm font-black shadow-[0_18px_50px_rgba(110,231,183,0.24)] transition hover:brightness-105 ${gameAccent.buttonClass}`}
                >
                  Start Scoreboard
                </button>
              )}
            </div>
          </section>
        )}

        {(screenMode === "LIVE" || screenMode === "GAME_OVER") && session && (
          <section className="flex flex-col gap-4">
            <div className="order-1 flex items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(17,28,44,0.88),rgba(7,17,29,0.84))] px-4 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur sm:px-5 lg:order-none">
              <button
                type="button"
                onClick={undoLastPlay}
                disabled={session.history.length < 1 || screenMode === "GAME_OVER"}
                className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Undo
              </button>
              <div className="text-center">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">{session.gameName}</div>
                <div
                  className={[
                    "mt-1 font-black text-white",
                    bigScreenMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
                  ].join(" ")}
                >
                  {currentScoreLines.map((line) => (
                    <div key={line} className="whitespace-nowrap leading-tight">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen((current) => !current)}
                className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Settings
              </button>
            </div>

            {bigScreenMode && leader && (
              <div className="order-2 rounded-[32px] border border-emerald-300/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(12,24,37,0.92)_42%,rgba(8,14,25,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.26)] lg:order-none">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:items-end">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/78">Leader</div>
                    <div className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">{leader.name}</div>
                    <div className="mt-3 text-lg font-semibold text-emerald-50/90">
                      {leaderMargin > 0
                        ? `Ahead by ${leaderMargin}`
                        : runnerUp
                        ? `Tied with ${runnerUp.name}`
                        : "Solo scoreboard"}
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-black/20 px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Current Score</div>
                    <div className="mt-3 text-3xl font-black text-white sm:text-4xl">
                      {currentScoreLines.map((line) => (
                        <div key={line} className="whitespace-nowrap leading-tight">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-black/20 px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Game Status</div>
                    <div className="mt-3 text-3xl font-black text-white sm:text-4xl">
                      {screenMode === "GAME_OVER" ? "Final" : "Live"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsOpen && (
              <div className="order-3 rounded-[28px] border border-white/10 bg-[#0b1728]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] lg:order-none">
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={toggleBigScreenMode}
                    className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-4 text-left text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
                  >
                    {bigScreenMode ? "Exit Big Screen" : "Open Big Screen"}
                  </button>
                  <button
                    type="button"
                    onClick={playAgain}
                    className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-4 text-left text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={resetToSetup}
                    className="rounded-2xl border border-white/12 bg-white/5 px-4 py-4 text-left text-sm font-black text-white transition hover:bg-white/10"
                  >
                    New Setup
                  </button>
                </div>
              </div>
            )}

            {quickScoreProEnabled ? (
              <div className="order-6 rounded-[28px] border border-cyan-300/18 bg-cyan-400/10 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.2)] lg:order-none">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Spectator Board</div>
                    <div className="mt-2 text-sm text-cyan-50/90">
                      Viewers can see the score, but only this phone can change it.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Status</div>
                    <div className="mt-1 text-sm font-black text-white">
                      {!networkOnline ? "Offline" : sessionCode ? "Live" : "Starting"}
                    </div>
                    <div className="mt-1 text-[11px] text-white/60">
                      {lastSyncedAt
                        ? `Updated ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                        : "Waiting for first sync"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="rounded-2xl border border-white/18 bg-white p-3">
                    <QRCodeSVG value={joinUrl || `${joinBaseUrl}/live/quick-score`} size={138} level="M" includeMargin />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Join Link</div>
                      <div className="mt-2 break-all text-sm font-semibold text-white">
                        {joinUrl || "Creating spectator link..."}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => joinUrl && navigator.clipboard.writeText(joinUrl)}
                        disabled={!joinUrl}
                        className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={reconnectSpectatorBoard}
                        disabled={!session || !networkOnline}
                        className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Refresh / Reconnect
                      </button>
                    </div>
                    {proStatusMessage && <div className="text-sm text-emerald-200">{proStatusMessage}</div>}
                    {syncError && <div className="text-sm text-amber-200">{syncError}</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="order-6 rounded-[28px] border border-amber-300/18 bg-amber-400/10 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.2)] lg:order-none">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/75">Quick Score Pro</div>
                    <div className="mt-2 text-sm text-amber-50/90">
                      Unlock QR spectator board, hosted sync, and premium scoreboard tools while local scoring stays free.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Status</div>
                    <div className="mt-1 text-sm font-black text-white">
                      {entitlementsLoading ? "Checking" : "Locked"}
                    </div>
                    <div className="mt-1 text-[11px] text-white/60">
                      Local scoring is always available.
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
                    QR spectator board, hosted sync, saved match history, custom presets, and premium scoreboard polish.
                  </div>
                  <button
                    type="button"
                    onClick={startQuickScoreProCheckout}
                    disabled={checkoutBusy}
                    className="rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-slate-950 shadow-[0_18px_50px_rgba(252,211,77,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkoutBusy ? "Opening Checkout..." : "Unlock Quick Score Pro"}
                  </button>
                </div>

                {proStatusMessage && <div className="mt-3 text-sm text-emerald-200">{proStatusMessage}</div>}
                {checkoutError && <div className="mt-3 text-sm text-amber-100">{checkoutError}</div>}
                <div className="mt-3 text-xs leading-6 text-amber-50/65">
                  Purchase details and price are shown before payment. By continuing, you agree to the{" "}
                  <Link href="/terms" className="font-semibold text-amber-100 underline decoration-amber-200/35 underline-offset-4">Terms</Link>
                  {" "}and acknowledge the{" "}
                  <Link href="/privacy" className="font-semibold text-amber-100 underline decoration-amber-200/35 underline-offset-4">Privacy Policy</Link>.
                </div>
              </div>
            )}

            <div className="order-5 grid gap-4 sm:grid-cols-2 lg:order-none">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Previous Score</div>
                <div className={["mt-3 font-black text-white", bigScreenMode ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"].join(" ")}>
                  {previousScoreText}
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Last Play</div>
                <div className={["mt-3 font-black text-white", bigScreenMode ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"].join(" ")}>
                  {lastPlayText}
                </div>
              </div>
            </div>

            <div
              className={[
                "order-4 grid gap-4 lg:order-none",
                bigScreenMode && session.competitors.length > 1
                  ? "lg:grid-cols-2"
                  : session.competitors.length > 2
                  ? "lg:grid-cols-2"
                  : "",
              ].join(" ")}
            >
              {(bigScreenMode ? rankedCompetitors : session.competitors).map((competitor, index) => (
                <div
                  key={competitor.id}
                  className={[
                    "rounded-[32px] border p-5 shadow-[0_20px_70px_rgba(0,0,0,0.26)] backdrop-blur",
                    screenMode === "GAME_OVER" && winner?.id === competitor.id
                      ? "border-emerald-200/65 bg-[linear-gradient(180deg,rgba(52,211,153,0.18),rgba(15,23,42,0.88))]"
                      : bigScreenMode && leader?.id === competitor.id
                      ? "border-cyan-200/45 bg-[linear-gradient(180deg,rgba(103,232,249,0.14),rgba(15,23,42,0.88))]"
                      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{activeGame.competitorNoun}</div>
                      <div className={["mt-2 font-black text-white", bigScreenMode ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"].join(" ")}>
                        {competitor.name}
                      </div>
                    </div>
                    {screenMode === "GAME_OVER" && winner?.id === competitor.id ? (
                      <div className="rounded-full border border-emerald-200/50 bg-emerald-300/20 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-50">
                        Winner
                      </div>
                    ) : bigScreenMode ? (
                      <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/72">
                        #{index + 1}
                      </div>
                    ) : null}
                  </div>

                  {bigScreenMode && (
                    <div className="mt-4 text-sm font-semibold text-white/62">
                      {leader?.id === competitor.id
                        ? "Current leader"
                        : leader
                        ? `${leader.name} leads by ${Math.max(0, getCompetitorScore(session, leader.id) - getCompetitorScore(session, competitor.id))}`
                        : "Scoreboard active"}
                    </div>
                  )}

                  <div className={["mt-5 font-black tracking-tight text-white", bigScreenMode ? "text-[5.5rem] leading-none sm:text-[7.5rem]" : "text-6xl sm:text-7xl"].join(" ")}>
                    {getCompetitorScore(session, competitor.id)}
                  </div>

                  {screenMode === "LIVE" && (
                    <div className={["mt-6 flex flex-wrap gap-3", bigScreenMode ? "justify-start" : ""].join(" ")}>
                      {session.config.pointOptions.map((points) => (
                        <button
                          key={`${competitor.id}-${points}`}
                          type="button"
                          onClick={() => scorePoints(competitor.id, points)}
                          className={[
                            "rounded-2xl border font-black transition",
                            bigScreenMode ? "min-w-[112px] px-6 py-5 text-2xl" : "min-w-[88px] px-5 py-4 text-xl",
                            points === 0
                              ? "border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
                              : "border-cyan-300/25 bg-cyan-400/12 text-cyan-50 hover:bg-cyan-400/18",
                          ].join(" ")}
                        >
                          +{points}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {screenMode === "GAME_OVER" && winner && (
              <div className="order-7 rounded-[32px] border border-amber-300/22 bg-amber-400/10 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:order-none">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/80">Game Over</div>
                <div className="mt-3 text-4xl font-black text-white sm:text-5xl">{winner.name} wins.</div>
                <div className="mt-3 text-lg text-amber-50/90">Final score: {currentScoreText}</div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={playAgain}
                    className="rounded-2xl bg-emerald-300 px-5 py-4 text-left text-base font-black text-slate-950 shadow-[0_18px_50px_rgba(110,231,183,0.2)] transition hover:brightness-105"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={resetToSetup}
                    className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-left text-base font-black text-white transition hover:bg-white/10"
                  >
                    Return Home
                  </button>
                </div>

                <div className="mt-6 rounded-[28px] border border-cyan-300/18 bg-cyan-400/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">
                        Save To Club
                      </div>
                      <div className="mt-2 text-xl font-black text-white">Turn this result into club history</div>
                      <div className="mt-2 text-sm text-cyan-50/88">
                        Save the final result to a recurring group now, or leave it as a one-off quick match.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadClubSaveOptions(launchContext.clubId, launchContext.eventId)}
                      className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
                    >
                      Refresh Clubs
                    </button>
                  </div>

                  {clubSaveLoading ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70">
                      Loading club options...
                    </div>
                  ) : clubSaveClubs.length < 1 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/12 bg-black/20 px-4 py-4">
                      <div className="text-sm text-white/76">No clubs yet. Create one first, then this flow can start building match history.</div>
                      <Link
                        href="/live/quick-score/clubs"
                        className="mt-3 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
                      >
                        Create Club
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-3">
                          <label className="block">
                            <div className="text-sm font-bold text-white/84">Club</div>
                            <select
                              value={selectedClubSaveId}
                              onChange={(event) => {
                                const nextClubId = event.target.value;
                                setSelectedClubSaveId(nextClubId);
                                setSelectedClubEventId("");
                                void loadClubSaveEvents(nextClubId);
                              }}
                              className="mt-2 w-full rounded-2xl border border-white/12 bg-[#07111d] px-4 py-3 text-base font-semibold text-white outline-none focus:border-cyan-300/35"
                            >
                              {clubSaveClubs.map((club) => (
                                <option key={club.id} value={club.id}>
                                  {club.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <div className="text-sm font-bold text-white/84">Event</div>
                            <select
                              value={selectedClubEventId}
                              onChange={(event) => {
                                const nextEventId = event.target.value;
                                setSelectedClubEventId(nextEventId);
                                const eventRecord = clubSaveEvents.find((entry) => entry.id === nextEventId) ?? null;
                                setLaunchContext((current) => ({
                                  ...current,
                                  eventId: nextEventId,
                                  eventName: eventRecord?.name ?? "",
                                }));
                              }}
                              className="mt-2 w-full rounded-2xl border border-white/12 bg-[#07111d] px-4 py-3 text-base font-semibold text-white outline-none focus:border-cyan-300/35"
                            >
                              <option value="">No event selected</option>
                              {clubSaveEvents.map((event) => (
                                <option key={event.id} value={event.id}>
                                  {event.name} ({event.status})
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-sm font-bold text-white/84">Create event on the fly</div>
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                              <input
                                type="text"
                                value={newClubEventName}
                                onChange={(event) => setNewClubEventName(event.target.value)}
                                placeholder="Friday Night Cornhole"
                                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/30"
                              />
                              <button
                                type="button"
                                onClick={createClubSaveEvent}
                                disabled={clubSaveBusy || !selectedClubSaveId}
                                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Create Event
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-sm font-bold text-white/84">Recent club results</div>
                          {clubSaveEventsLoading ? (
                            <div className="mt-3 text-sm text-white/64">Loading club history...</div>
                          ) : clubSaveMatches.length < 1 ? (
                            <div className="mt-3 text-sm text-white/64">No saved results in this club yet.</div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {clubSaveMatches.slice(0, 3).map((match) => (
                                <div key={match.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                  <div className="text-sm font-black text-white">
                                    {Array.isArray(match.teamLabels) && match.teamLabels.length > 0
                                      ? match.teamLabels.join(" vs ")
                                      : "Saved Quick Score match"}
                                  </div>
                                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/48">
                                    {match.sportKey} • {match.status}
                                  </div>
                                  <div className="mt-2 text-sm text-white/70">
                                    {typeof match.summary.finalScoreLabel === "string"
                                      ? match.summary.finalScoreLabel
                                      : "Saved result"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={saveCurrentMatchToClub}
                        disabled={clubSaveBusy || !selectedClubSaveId}
                        className="rounded-2xl bg-[linear-gradient(90deg,#7dd3fc,#67e8f9,#fcd34d)] px-5 py-4 text-sm font-black text-slate-950 shadow-[0_18px_50px_rgba(125,211,252,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {clubSaveBusy ? "Saving Match..." : "Save Match To Club"}
                      </button>

                      {clubSaveStatus && <div className="text-sm text-emerald-200">{clubSaveStatus}</div>}
                      {clubSaveError && <div className="text-sm text-amber-100">{clubSaveError}</div>}
                    </div>
                  )}
                </div>

                <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">More backyard games</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Link
                    href="/mode/disc-warrior"
                    className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-4 text-left text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16"
                  >
                    Try Disc Warrior
                  </Link>
                  <Link
                    href="/mode/card-shark"
                    className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-4 text-left text-sm font-black text-sky-50 transition hover:bg-sky-400/16"
                  >
                    Try Card Shark
                  </Link>
                  <Link
                    href="/mode/around-the-world"
                    className="rounded-2xl border border-orange-300/20 bg-orange-400/10 px-4 py-4 text-left text-sm font-black text-orange-50 transition hover:bg-orange-400/16"
                  >
                    Try Around the World
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
