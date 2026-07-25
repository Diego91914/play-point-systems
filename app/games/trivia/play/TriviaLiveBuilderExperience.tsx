"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BIBLE_CANON_POLICY,
  BIBLE_TRANSLATION_POLICY,
  formatDifficultyFilterLabel,
  MAX_TRIVIA_TEAM_COUNT,
  MIN_TRIVIA_TEAM_COUNT,
  PLAYPOINT_RUNTIME_ROUNDS,
  type TriviaGameMode,
  type TriviaTeamId,
  type RuntimeCatalogCategorySummary,
  type RuntimeDeck,
  type RuntimeDeckCard,
  type RuntimeDeckRound,
  type RuntimeDifficultyFilter,
} from "./trivia-runtime-types";
import { formatTriviaWinnerHeading } from "./trivia-result-utils";
import { formatTriviaTeamWinnerHeading, getTriviaTeamLabel, type TriviaTeamStanding } from "./trivia-team-utils";
import { formatTriviaStreakRule } from "./trivia-streak-scoring";
import { subscribeToTriviaStream } from "./trivia-live-stream";
import { TriviaProjectorMode } from "./TriviaProjectorMode";
import {
  calculateTriviaCorrectPoints,
  formatTriviaScoringSummary,
  getTriviaCountdownProgress,
  getTriviaQuestionStartCountdown,
  TRIVIA_PACING_OPTIONS,
  type TriviaPacingMode,
} from "./trivia-live-timing";

type HostPlayer = {
  id: string;
  name: string;
  teamId: TriviaTeamId | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  currentStreak: number;
  bestStreak: number;
};

type HostResolutionRow = {
  playerId: string;
  playerName: string;
  response: string;
  responseText: string;
  outcome: "correct" | "wrong" | "skip";
  wager: number | null;
  delta: number;
  speedBonus: number;
  streakBonus: number;
  nextScore: number;
};

type HostResolution = {
  card: RuntimeDeckCard;
  correctSlot: string;
  correctText: string;
  rows: HostResolutionRow[];
};

type HostSnapshot = {
  sessionId: string;
  roomCode: string;
  joinUrl: string;
  qrUrl: string;
  status: "lobby" | "in-progress" | "completed";
  phase: "lobby" | "wager-open" | "question-countdown" | "question-open" | "answer-reveal" | "completed";
  serverTimeMs: number;
  cardIndex: number;
  deck: RuntimeDeck;
  currentCard: RuntimeDeckCard | null;
  questionOpenedAtMs: number | null;
  questionTimerSeconds: number | null;
  pacingMode: TriviaPacingMode;
  gameMode: TriviaGameMode;
  teamCount: number;
  players: HostPlayer[];
  leaderboard: HostPlayer[];
  teamLeaderboard: TriviaTeamStanding[];
  answeredPlayerIds: string[];
  submittedCount: number;
  waitingForCount: number;
  wageredPlayerIds: string[];
  wagerSubmittedCount: number;
  wagerWaitingForCount: number;
  resolution: HostResolution | null;
  canStart: boolean;
  canReveal: boolean;
  canAdvance: boolean;
};

type CatalogPayload = {
  generatedAt: string;
  categories: RuntimeCatalogCategorySummary[];
};

const HOST_CONNECTION_STORAGE_KEY = "play-point-trivia-host-connection-v2";
const LEGACY_HOST_CONNECTION_STORAGE_KEY = "play-point-trivia-host-connection-v1";

const requestJson = async <T,>(url: string, init?: RequestInit, bearerToken?: string | null) => {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
};

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPoints(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function TeamStandings({ standings }: { standings: TriviaTeamStanding[] }) {
  return (
    <div className="grid gap-3">
      {standings.map((team, index) => (
        <div key={team.id} className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/8 px-4 py-4">
          <div>
            <div className="text-sm font-black text-white">{index + 1}. {team.label}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
              {team.playerCount} player{team.playerCount === 1 ? "" : "s"} | {team.correctCount} right
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatPoints(team.score)}</div>
        </div>
      ))}
    </div>
  );
}

function getCountdownState(snapshot: HostSnapshot | null, nowMs: number) {
  if (!snapshot?.currentCard || snapshot.phase !== "question-open" || snapshot.questionOpenedAtMs === null) {
    return null;
  }

  const timerSeconds = Math.max(snapshot.questionTimerSeconds ?? 10, 1);
  const elapsedMs = Math.max(0, nowMs - snapshot.questionOpenedAtMs);
  const remainingSeconds = Math.max(0, timerSeconds - Math.floor(elapsedMs / 1000));
  const isExpired = elapsedMs >= timerSeconds * 1000;
  const availablePoints = isExpired ? 0 : calculateTriviaCorrectPoints(
    snapshot.currentCard.scoring.correct,
    elapsedMs,
    timerSeconds,
    snapshot.currentCard.scoring.mode,
  );

  return {
    remainingSeconds,
    availablePoints,
    isExpired,
    progressPercent: getTriviaCountdownProgress(elapsedMs, timerSeconds),
  };
}

export function TriviaLiveBuilderExperience() {
  const [catalog, setCatalog] = useState<RuntimeCatalogCategorySummary[]>([]);
  const [catalogGeneratedAt, setCatalogGeneratedAt] = useState<string | null>(null);
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<RuntimeDifficultyFilter>("mixed");
  const [selectedPacingMode, setSelectedPacingMode] = useState<TriviaPacingMode>("standard");
  const [selectedGameMode, setSelectedGameMode] = useState<TriviaGameMode>("individual");
  const [selectedTeamCount, setSelectedTeamCount] = useState(MIN_TRIVIA_TEAM_COUNT);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [snapshot, setSnapshot] = useState<HostSnapshot | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [hasHostCredential, setHasHostCredential] = useState(false);
  const [clockNowMs, setClockNowMs] = useState(Date.now());
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const [streamConnected, setStreamConnected] = useState(false);
  const [projectorMode, setProjectorMode] = useState(false);
  const snapshotServerTimeMs = snapshot?.serverTimeMs;
  const snapshotPhase = snapshot?.phase;

  useEffect(() => {
    const storedConnection = window.localStorage.getItem(HOST_CONNECTION_STORAGE_KEY);
    const legacyConnection = window.sessionStorage.getItem(LEGACY_HOST_CONNECTION_STORAGE_KEY);

    if (!storedConnection && !legacyConnection) {
      return;
    }

    try {
      const connection = JSON.parse(storedConnection ?? legacyConnection!) as { sessionId?: string; hostToken?: string };
      const legacyHostToken = storedConnection ? null : connection.hostToken ?? null;

      if (!connection.sessionId || (!storedConnection && !legacyHostToken)) {
        throw new Error("Invalid stored host connection.");
      }

      setHostToken(legacyHostToken);
      setHasHostCredential(true);
      requestJson<HostSnapshot>(
        `/api/trivia/sessions/${connection.sessionId}`,
        undefined,
        legacyHostToken,
      )
        .then((nextSnapshot) => {
          setSnapshot(nextSnapshot);
          window.localStorage.setItem(
            HOST_CONNECTION_STORAGE_KEY,
            JSON.stringify({ sessionId: connection.sessionId }),
          );
          window.sessionStorage.removeItem(LEGACY_HOST_CONNECTION_STORAGE_KEY);
          setHostToken(null);
        })
        .catch(() => {
          window.localStorage.removeItem(HOST_CONNECTION_STORAGE_KEY);
          window.sessionStorage.removeItem(LEGACY_HOST_CONNECTION_STORAGE_KEY);
          setHostToken(null);
          setHasHostCredential(false);
        });
    } catch {
      window.localStorage.removeItem(HOST_CONNECTION_STORAGE_KEY);
      window.sessionStorage.removeItem(LEGACY_HOST_CONNECTION_STORAGE_KEY);
      setHasHostCredential(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    requestJson<CatalogPayload>("/api/trivia/catalog")
      .then((payload) => {
        if (!active) {
          return;
        }

        setCatalog(payload.categories);
        setCatalogGeneratedAt(payload.generatedAt);
        setCatalogError(null);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setCatalogError(error instanceof Error ? error.message : "Unable to load the trivia catalog.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!snapshot?.sessionId || !hasHostCredential || streamConnected) {
      return;
    }

    const handle = window.setInterval(async () => {
      try {
        const nextSnapshot = await requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}`, undefined, hostToken);
        setSnapshot(nextSnapshot);
      } catch (error) {
        setSetupError(error instanceof Error ? error.message : "Unable to refresh the trivia room.");
      }
    }, 1500);

    return () => {
      window.clearInterval(handle);
    };
  }, [hasHostCredential, hostToken, snapshot?.sessionId, streamConnected]);

  useEffect(() => {
    if (!snapshot?.sessionId || !hasHostCredential) {
      return;
    }

    return subscribeToTriviaStream<HostSnapshot>({
      url: `/api/trivia/sessions/${snapshot.sessionId}/events`,
      token: hostToken,
      onSnapshot: setSnapshot,
      onConnectionChange: setStreamConnected,
    });
  }, [hasHostCredential, hostToken, snapshot?.sessionId]);

  useEffect(() => {
    if (snapshotServerTimeMs !== undefined) {
      setServerClockOffsetMs(snapshotServerTimeMs - Date.now());
    }
  }, [snapshotServerTimeMs]);

  useEffect(() => {
    if (snapshot?.status === "completed") {
      window.localStorage.removeItem(HOST_CONNECTION_STORAGE_KEY);
    }
  }, [snapshot?.status]);

  useEffect(() => {
    if (!snapshotPhase || !["question-countdown", "question-open"].includes(snapshotPhase)) {
      return;
    }

    const handle = window.setInterval(() => {
      setClockNowMs(Date.now() + serverClockOffsetMs);
    }, 250);

    return () => {
      window.clearInterval(handle);
    };
  }, [serverClockOffsetMs, snapshotPhase, snapshot?.questionOpenedAtMs, snapshot?.cardIndex]);

  const selectedCategorySummary = catalog.find((category) => category.category === "bible") ?? null;
  const availableDifficultyFilters = useMemo(
    () => selectedCategorySummary?.availableDifficultyFilters ?? [],
    [selectedCategorySummary],
  );

  useEffect(() => {
    if (availableDifficultyFilters.length > 0 && !availableDifficultyFilters.includes(selectedDifficultyFilter)) {
      setSelectedDifficultyFilter(availableDifficultyFilters[0]);
    }
  }, [availableDifficultyFilters, selectedDifficultyFilter]);

  const leaderboard = snapshot?.leaderboard ?? [];
  const currentCard = snapshot?.currentCard ?? null;
  const isComplete = snapshot?.status === "completed";
  const countdown = getCountdownState(snapshot, clockNowMs);
  const questionStartCountdown = snapshot?.phase === "question-countdown"
    ? getTriviaQuestionStartCountdown(snapshot.questionOpenedAtMs, clockNowMs)
    : 0;
  const isFinalQuestion = Boolean(snapshot && snapshot.cardIndex === snapshot.deck.cards.length - 1);
  const displayedPacingMode = snapshot?.pacingMode ?? selectedPacingMode;
  const displayedGameMode = snapshot?.gameMode ?? selectedGameMode;
  const displayedTimerSeconds = snapshot?.questionTimerSeconds
    ?? TRIVIA_PACING_OPTIONS[displayedPacingMode].timerSeconds;

  async function createRoom() {
    if (!selectedCategorySummary?.isPlayable) {
      setSetupError("Bible Gold is the current launch category, but it is not available in the catalog yet.");
      return;
    }

    try {
      setCreatingRoom(true);
      setSetupError(null);
      const room = await requestJson<{ sessionId: string; roomCode: string }>("/api/trivia/sessions", {
        method: "POST",
        body: JSON.stringify({
          category: "bible",
          difficultyFilter: selectedDifficultyFilter,
          pacingMode: selectedPacingMode,
          gameMode: selectedGameMode,
          teamCount: selectedTeamCount,
        }),
      });
      setHostToken(null);
      setHasHostCredential(true);
      window.localStorage.setItem(
        HOST_CONNECTION_STORAGE_KEY,
        JSON.stringify({ sessionId: room.sessionId }),
      );
      window.sessionStorage.removeItem(LEGACY_HOST_CONNECTION_STORAGE_KEY);
      const nextSnapshot = await requestJson<HostSnapshot>(`/api/trivia/sessions/${room.sessionId}`);
      setSnapshot(nextSnapshot);
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to create the trivia room.");
    } finally {
      setCreatingRoom(false);
    }
  }

  async function startRoom() {
    if (!snapshot || !hasHostCredential) {
      return;
    }

    try {
      setSnapshot(await requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/start`, { method: "POST", body: "{}" }, hostToken));
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to start the trivia room.");
    }
  }

  async function resolveQuestion() {
    if (!snapshot || !hasHostCredential) {
      return;
    }

    try {
      setSnapshot(await requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/resolve`, { method: "POST", body: "{}" }, hostToken));
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to resolve the trivia question.");
    }
  }

  async function advanceQuestion() {
    if (!snapshot || !hasHostCredential) {
      return;
    }

    try {
      setSnapshot(await requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/advance`, { method: "POST", body: "{}" }, hostToken));
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to advance the trivia question.");
    }
  }

  async function copyJoinLink() {
    if (!snapshot) {
      return;
    }

    try {
      await navigator.clipboard.writeText(snapshot.joinUrl);
      setSetupError("Join link copied.");
    } catch {
      setSetupError(snapshot.joinUrl);
    }
  }

  const openProjectorMode = useCallback(async () => {
    setProjectorMode(true);

    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // The in-page projector overlay remains available when fullscreen is unsupported or denied.
    }
  }, []);

  const closeProjectorMode = useCallback(async () => {
    setProjectorMode(false);

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // The overlay still closes if the browser owns fullscreen exit handling.
      }
    }
  }, []);

  useEffect(() => {
    if (!projectorMode) {
      return;
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setProjectorMode(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [projectorMode]);

  return (
    <section className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      {projectorMode && snapshot ? (
        <TriviaProjectorMode
          snapshot={snapshot}
          countdown={countdown}
          questionStartCountdown={questionStartCountdown}
          onStart={startRoom}
          onReveal={resolveQuestion}
          onAdvance={advanceQuestion}
          onExit={closeProjectorMode}
        />
      ) : null}
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <div className="grid gap-6">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
                  {snapshot ? "Live Trivia Builder" : "Vault-Fed Gold Runtime"}
                </div>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Create the room</h2>
                <p className="hidden">
                  This is the hosted builder for the first public Bible trivia MVP on playpointsystems.com. Create the room here, then let players sign in from their phones on the live join page.
                </p>
              </div>
              {snapshot ? (
                <button type="button" onClick={openProjectorMode} className="inline-flex rounded-2xl border border-cyan-200/35 bg-cyan-300/12 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/20">
                  Open Projector Mode
                </button>
              ) : <div className="hidden">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Live paths</div>
                <div className="mt-2 font-semibold">Builder: /games/trivia/builder | Join: /games/trivia/join</div>
              </div>}
            </div>

            {!snapshot ? (
              <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.92fr]">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Create a live room</div>
                  <div className="hidden">
                    This page is the host builder only. The first public MVP is Bible trivia, and player names are entered after joining on their phones at <span className="font-semibold text-white">/games/trivia/join</span>.
                  </div>

                  <div className="hidden">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">Launch category</div>
                    <div className="mt-2 font-black text-white">Bible Gold</div>
                    <div className="mt-2 text-sm leading-7 text-white/68">The public builder is locked to Bible for the MVP launch so the live room flow can stabilize before category expansion.</div>
                  </div>

                  <label className="mt-5 block text-sm font-semibold text-white/90" htmlFor="difficulty-select">
                    Difficulty profile
                  </label>
                  <select
                    id="difficulty-select"
                    value={selectedDifficultyFilter}
                    onChange={(event) => setSelectedDifficultyFilter(event.target.value as RuntimeDifficultyFilter)}
                    className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                  >
                    {availableDifficultyFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {formatDifficultyFilterLabel(filter)}
                      </option>
                    ))}
                  </select>

                  <label className="mt-5 block text-sm font-semibold text-white/90" htmlFor="pacing-select">
                    Question pace
                  </label>
                  <select
                    id="pacing-select"
                    value={selectedPacingMode}
                    onChange={(event) => setSelectedPacingMode(event.target.value as TriviaPacingMode)}
                    className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                  >
                    {(Object.entries(TRIVIA_PACING_OPTIONS) as [TriviaPacingMode, (typeof TRIVIA_PACING_OPTIONS)[TriviaPacingMode]][]).map(([mode, option]) => (
                      <option key={mode} value={mode}>{option.label} — {option.timerSeconds} seconds</option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-6 text-white/56">{TRIVIA_PACING_OPTIONS[selectedPacingMode].description}</p>

                  <label className="mt-5 block text-sm font-semibold text-white/90" htmlFor="game-mode-select">
                    Score format
                  </label>
                  <select
                    id="game-mode-select"
                    value={selectedGameMode}
                    onChange={(event) => setSelectedGameMode(event.target.value as TriviaGameMode)}
                    className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                  >
                    <option value="individual">Individual players</option>
                    <option value="teams">Teams</option>
                  </select>
                  <p className="mt-2 text-xs leading-6 text-white/56">
                    {selectedGameMode === "teams"
                      ? `Players are automatically balanced across ${selectedTeamCount} teams as they join.`
                      : "Every player competes on their own score."}
                  </p>

                  {selectedGameMode === "teams" ? (
                    <>
                      <label className="mt-5 block text-sm font-semibold text-white/90" htmlFor="team-count-select">
                        Number of teams
                      </label>
                      <select
                        id="team-count-select"
                        value={selectedTeamCount}
                        onChange={(event) => setSelectedTeamCount(Number(event.target.value))}
                        className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                      >
                        {Array.from(
                          { length: MAX_TRIVIA_TEAM_COUNT - MIN_TRIVIA_TEAM_COUNT + 1 },
                          (_, index) => MIN_TRIVIA_TEAM_COUNT + index,
                        ).map((teamCount) => (
                          <option key={teamCount} value={teamCount}>{teamCount} teams</option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs leading-6 text-white/56">At least one player must join each team before the game can start.</p>
                    </>
                  ) : null}

                  {catalogError ? <div className="mt-4 text-sm font-semibold text-amber-200">{catalogError}</div> : null}
                  {setupError ? <div className="mt-4 text-sm font-semibold text-amber-200">{setupError}</div> : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={createRoom}
                      disabled={creatingRoom || !selectedCategorySummary?.isPlayable}
                      className={
                        creatingRoom || !selectedCategorySummary?.isPlayable
                          ? "inline-flex rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-black text-white/36"
                          : "inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
                      }
                    >
                      {creatingRoom ? "Creating Room..." : "Create Live Room"}
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Current vault view</div>
                  <div className="mt-4 grid gap-3 text-sm text-white/78">
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      <span className="font-semibold text-white">{selectedCategorySummary?.label ?? "Bible"}</span>
                      {selectedCategorySummary ? ` has ${selectedCategorySummary.totalGoldTriviaCount} playable Gold trivia records right now.` : " category data is loading."}
                    </div>
                    {selectedCategorySummary ? (
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                        Easy {selectedCategorySummary.countsByDifficulty.easy} | Medium {selectedCategorySummary.countsByDifficulty.medium} | Hard {selectedCategorySummary.countsByDifficulty.hard} | Expert {selectedCategorySummary.countsByDifficulty.expert}
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      The game opens with fixed 500-point questions, climbs through 1,000-, 2,000-, and 3,000-point countdown play, then ends with one private final wager.
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      <span className="font-semibold text-white">Canon: {BIBLE_CANON_POLICY}.</span> {BIBLE_TRANSLATION_POLICY}
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      {catalogGeneratedAt
                        ? `Catalog snapshot generated ${new Date(catalogGeneratedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.`
                        : "Catalog snapshot time is loading."}
                    </div>
                  </div>
                </div>
              </div>
            ) : isComplete ? (
              <div className="mt-7 rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-5 sm:p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Session complete</div>
                <h3 className="mt-3 text-3xl font-black text-white">{snapshot.gameMode !== "individual" ? formatTriviaTeamWinnerHeading(snapshot.teamLeaderboard) : formatTriviaWinnerHeading(leaderboard)}</h3>
                <div className="mt-6">
                  {snapshot.gameMode !== "individual" ? <TeamStandings standings={snapshot.teamLeaderboard} /> : <div className="grid gap-3">{leaderboard.map((player, index) => (
                    <div key={player.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-black text-white">{index + 1}. {player.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                          {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                        </div>
                      </div>
                      <div className="text-2xl font-black text-cyan-50">{player.score}</div>
                    </div>
                  ))}</div>}
                </div>
              </div>
            ) : (
              <div className="mt-7 grid gap-6">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 sm:p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Join flow</div>
                  <div className="mt-5 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Room code</div>
                      <div className="mt-3 text-4xl font-black tracking-[0.18em] text-white">{snapshot.roomCode}</div>
                      <div className="mt-4 text-sm text-white/68">Players use this on their phones if they do not scan the QR code.</div>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Phone sign-in path</div>
                      <a href={snapshot.joinUrl} className="mt-3 block break-all text-sm font-semibold text-cyan-100">
                        {snapshot.joinUrl}
                      </a>
                      <Image
                        src={snapshot.qrUrl}
                        alt={`QR code for room ${snapshot.roomCode}`}
                        width={176}
                        height={176}
                        unoptimized
                        className="mt-4 w-44 rounded-[20px] bg-white p-2"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={copyJoinLink} className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                      Copy Join Link
                    </button>
                    <Link href="/games/trivia/join" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                      Open Player Join Page
                    </Link>
                    {snapshot.canStart ? (
                      <button type="button" onClick={startRoom} className="inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110">
                        Start Game
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,31,48,0.8),rgba(7,16,28,0.95))] px-4 py-4 text-sm text-white/72">
                    {snapshot.players.length > 0
                      ? snapshot.gameMode === "teams" && snapshot.players.length < snapshot.teamCount
                        ? `${snapshot.players.length} player${snapshot.players.length === 1 ? "" : "s"} joined. Waiting for ${snapshot.teamCount - snapshot.players.length} more so every team has a player.`
                        : `${snapshot.players.length} player${snapshot.players.length === 1 ? "" : "s"} joined${snapshot.gameMode === "individual" ? "." : ` and balanced across ${snapshot.teamCount} teams.`}`
                      : "No players have joined yet. Use the QR, link, or room code on a phone to sign in."}
                  </div>
                </div>

                {snapshot.status === "lobby" ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Lobby players</div>
                    <div className="mt-5 grid gap-3">
                      {snapshot.players.length > 0 ? snapshot.players.map((player) => (
                        <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-black text-white">
                          <span>{player.name}</span>
                          {player.teamId ? <span className="text-xs uppercase tracking-[0.16em] text-cyan-200">{getTriviaTeamLabel(player.teamId)}</span> : null}
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/64">
                          Waiting for players to sign in from the join page.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {snapshot.phase === "wager-open" ? (
                  <div className="rounded-[28px] border border-amber-300/25 bg-[linear-gradient(180deg,rgba(129,91,28,0.3),rgba(255,255,255,0.03))] p-5 sm:p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">Final wager</div>
                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-3xl font-black text-white">Players are locking private wagers</h3>
                        <p className="mt-3 text-sm leading-7 text-white/70">Wager amounts remain private. Players who have not submitted will enter the final question with a zero-point wager.</p>
                      </div>
                      {snapshot.canAdvance ? (
                        <button type="button" onClick={advanceQuestion} className="inline-flex shrink-0 rounded-2xl border border-amber-200/35 bg-amber-300 px-5 py-3 text-sm font-black text-[#1a1003] transition hover:brightness-110">
                          Open Final Question
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm font-black text-white">
                      {snapshot.wagerSubmittedCount} wagered | {snapshot.wagerWaitingForCount} waiting
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {snapshot.players.map((player) => {
                        const isReady = snapshot.wageredPlayerIds.includes(player.id);
                        return (
                          <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                            <div className="font-black text-white">{player.name}</div>
                            <div className={isReady ? "text-xs font-black uppercase tracking-[0.18em] text-emerald-200" : "text-xs font-black uppercase tracking-[0.18em] text-white/42"}>
                              {isReady ? "Ready" : "Waiting"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {snapshot.phase === "question-countdown" ? (
                  <div className="rounded-[28px] border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(45,139,190,0.24),rgba(255,255,255,0.03))] p-7 text-center sm:p-10">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Next question</div>
                    <div className="mt-5 text-7xl font-black text-white sm:text-8xl">{questionStartCountdown || "Go"}</div>
                    <h3 className="mt-4 text-2xl font-black text-white">Question begins for everyone together</h3>
                    <p className="mt-3 text-sm text-white/64">Prompts and answer choices stay hidden until the countdown ends.</p>
                  </div>
                ) : null}

                {currentCard ? (
                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                          {currentCard.roundLabel} | Question {currentCard.questionNumberInRound} of {currentCard.totalQuestionsInRound}
                        </div>
                        <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">{currentCard.prompt}</h3>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">{currentCard.roundIntro}</p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/78">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Scoring this round</div>
                        <div className="mt-2 font-semibold text-white">
                          {snapshot.questionTimerSeconds}-second {TRIVIA_PACING_OPTIONS[snapshot.pacingMode].label.toLowerCase()} clock | {isFinalQuestion ? "private wagers decide the score" : `${formatTriviaScoringSummary(currentCard.scoring, snapshot.questionTimerSeconds ?? displayedTimerSeconds)} | ${formatDelta(currentCard.scoring.wrong)} wrong | ${formatDelta(currentCard.scoring.skip)} skip`}
                        </div>
                      </div>
                    </div>

                    {countdown ? (
                      <div className={countdown.isExpired ? "mt-5 rounded-[24px] border border-amber-300/30 bg-amber-400/10 px-4 py-4 text-sm font-semibold text-amber-100" : "mt-5 rounded-[24px] border border-emerald-300/25 bg-emerald-400/10 px-4 py-4 text-sm font-semibold text-emerald-100"}>
                        {countdown.isExpired
                          ? "Time expired. Reveal the final result when the room is ready."
                          : isFinalQuestion
                            ? `${countdown.remainingSeconds}s left. Private wagers are locked.`
                            : `${countdown.remainingSeconds}s left. ${formatPoints(countdown.availablePoints)} points are still available.`}
                      </div>
                    ) : null}

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {currentCard.choices.map((choice) => (
                        <div key={choice.slot} className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-4">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Choice {choice.slot}</div>
                          <div className="mt-2 text-lg font-black text-white">{choice.text}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {snapshot.canReveal ? (
                        <button type="button" onClick={resolveQuestion} className="inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110">
                          Reveal Answer
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {snapshot.resolution ? (
                  <div className="rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-5 sm:p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Resolution</div>
                    <h4 className="mt-3 text-2xl font-black text-white">Correct answer: {snapshot.resolution.correctSlot} | {snapshot.resolution.correctText}</h4>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/74">{snapshot.resolution.card.explanation}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/68">Scripture reference: {snapshot.resolution.card.reference}</p>

                    <div className="mt-7 rounded-[26px] border border-cyan-300/20 bg-cyan-400/[0.08] p-4 sm:p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Updated leaderboard</div>
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h5 className="text-xl font-black text-white">Standings after this question</h5>
                          <p className="mt-1 text-sm leading-6 text-white/64">When everyone has seen the scores, move the room to the next question.</p>
                        </div>
                        {snapshot.canAdvance ? (
                          <button type="button" onClick={advanceQuestion} className="inline-flex shrink-0 rounded-2xl border border-cyan-200/35 bg-cyan-300 px-5 py-3 text-sm font-black text-[#04111c] shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110">
                            {snapshot.cardIndex === snapshot.deck.cards.length - 1 ? "Finish Session" : "Next Question"}
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-5">
                        {snapshot.gameMode !== "individual" ? <TeamStandings standings={snapshot.teamLeaderboard} /> : <div className="grid gap-3">{leaderboard.map((player, index) => (
                          <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                            <div>
                              <div className="text-sm font-black text-white">{index + 1}. {player.name}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                                {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                              </div>
                            </div>
                            <div className="text-2xl font-black text-cyan-50">{formatPoints(player.score)}</div>
                          </div>
                        ))}</div>}
                      </div>
                    </div>

                    <div className="mt-7 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Question results</div>
                    <div className="mt-6 grid gap-3">
                      {snapshot.resolution.rows.map((row) => (
                        <div key={row.playerId} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-black text-white">{row.playerName} | {row.outcome}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                              Answered {row.responseText}{row.wager != null ? ` | Wagered ${formatPoints(row.wager)}` : ""}{row.streakBonus > 0 ? ` | Streak +${formatPoints(row.streakBonus)}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-cyan-50">{formatDelta(row.delta)}</div>
                            <div className="text-xs uppercase tracking-[0.18em] text-white/46">Total {row.nextScore}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-28">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Phone join</div>
            <h3 className="mt-3 text-2xl font-black text-white">How sign-in works</h3>
            <div className="mt-5 grid gap-3 text-sm text-white/76">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"><span className="font-semibold text-white">Host builds the room</span> on this page.</div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"><span className="font-semibold text-white">Players sign in on their phones</span> using the join page, code, or QR.</div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"><span className="font-semibold text-white">This room uses {TRIVIA_PACING_OPTIONS[displayedPacingMode].label} pacing:</span> {displayedTimerSeconds} seconds per question, with fixed warm-up scoring before the countdown rounds escalate.</div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"><span className="font-semibold text-white">Wrong answers do not subtract before the final.</span> The last question uses each player&apos;s private wager.</div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"><span className="font-semibold text-white">Streak bonuses reward accuracy:</span> {formatTriviaStreakRule()} The final wager does not add a streak bonus.</div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">{displayedGameMode !== "individual" ? "Team leaderboard" : "Leaderboard"}</div>
            <h3 className="mt-3 text-2xl font-black text-white">{snapshot?.deck.categoryLabel ?? selectedCategorySummary?.label ?? "Vault Runtime"}</h3>
            <div className="mt-5">
              {snapshot?.gameMode !== "individual" && snapshot ? <TeamStandings standings={snapshot.teamLeaderboard} /> : leaderboard.length > 0 ? <div className="grid gap-3">{leaderboard.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div>
                    <div className="text-sm font-black text-white">{index + 1}. {player.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                      {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                    </div>
                  </div>
                  <div className="text-2xl font-black text-cyan-50">{player.score}</div>
                </div>
              ))}</div> : (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/64">Create a room to start the live scoreboard.</div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Round map</div>
            <div className="mt-4 grid gap-3">
              {(snapshot?.deck.rounds ?? PLAYPOINT_RUNTIME_ROUNDS.map((round) => ({
                roundId: round.roundId,
                label: round.label,
                intro: round.intro,
                scoring: round.scoring,
                questionCount: 0,
              }) as RuntimeDeckRound)).map((round, index) => (
                <div key={round.roundId} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Round {index + 1}</div>
                  <div className="mt-2 text-lg font-black text-white">{round.label}</div>
                  <div className="mt-2 text-sm leading-7 text-white/68">{round.intro}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/46">
                    {displayedTimerSeconds}s | {formatTriviaScoringSummary(round.scoring, displayedTimerSeconds)} | {formatDelta(round.scoring.wrong)} wrong | {formatDelta(round.scoring.skip)} skip
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
