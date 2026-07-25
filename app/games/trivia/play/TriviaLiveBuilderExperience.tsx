"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  formatDifficultyFilterLabel,
  PLAYPOINT_RUNTIME_ROUNDS,
  type RuntimeCatalogCategorySummary,
  type RuntimeDeck,
  type RuntimeDeckCard,
  type RuntimeDeckRound,
  type RuntimeDifficultyFilter,
} from "./trivia-runtime-types";

type HostPlayer = {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

type HostResolutionRow = {
  playerId: string;
  playerName: string;
  response: string;
  responseText: string;
  outcome: "correct" | "wrong" | "skip";
  delta: number;
  speedBonus: number;
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
  phase: "lobby" | "question-open" | "answer-reveal" | "completed";
  serverTimeMs: number;
  cardIndex: number;
  deck: RuntimeDeck;
  currentCard: RuntimeDeckCard | null;
  questionOpenedAtMs: number | null;
  questionTimerSeconds: number | null;
  players: HostPlayer[];
  leaderboard: HostPlayer[];
  answeredPlayerIds: string[];
  submittedCount: number;
  waitingForCount: number;
  resolution: HostResolution | null;
  canStart: boolean;
  canReveal: boolean;
  canAdvance: boolean;
};

type CatalogPayload = {
  generatedAt: string;
  categories: RuntimeCatalogCategorySummary[];
};

const HOST_CONNECTION_STORAGE_KEY = "play-point-trivia-host-connection-v1";

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

function getCountdownState(snapshot: HostSnapshot | null, nowMs: number) {
  if (!snapshot?.currentCard || snapshot.phase !== "question-open" || snapshot.questionOpenedAtMs === null) {
    return null;
  }

  const timerSeconds = Math.max(snapshot.questionTimerSeconds ?? 10, 1);
  const elapsedMs = Math.max(0, nowMs - snapshot.questionOpenedAtMs);
  const elapsedWholeSeconds = Math.min(timerSeconds, Math.floor(elapsedMs / 1000));
  const remainingSeconds = Math.max(0, timerSeconds - Math.floor(elapsedMs / 1000));
  const availablePoints = Math.max(0, snapshot.currentCard.scoring.correct - elapsedWholeSeconds * 100);

  return {
    remainingSeconds,
    availablePoints,
    isExpired: elapsedMs >= timerSeconds * 1000,
  };
}

export function TriviaLiveBuilderExperience() {
  const [catalog, setCatalog] = useState<RuntimeCatalogCategorySummary[]>([]);
  const [catalogGeneratedAt, setCatalogGeneratedAt] = useState<string | null>(null);
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<RuntimeDifficultyFilter>("mixed");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [snapshot, setSnapshot] = useState<HostSnapshot | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [clockNowMs, setClockNowMs] = useState(Date.now());
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const snapshotServerTimeMs = snapshot?.serverTimeMs;

  useEffect(() => {
    const storedConnection = window.sessionStorage.getItem(HOST_CONNECTION_STORAGE_KEY);

    if (!storedConnection) {
      return;
    }

    try {
      const connection = JSON.parse(storedConnection) as { sessionId?: string; hostToken?: string };

      if (!connection.sessionId || !connection.hostToken) {
        throw new Error("Invalid stored host connection.");
      }

      setHostToken(connection.hostToken);
      requestJson<HostSnapshot>(
        `/api/trivia/sessions/${connection.sessionId}`,
        undefined,
        connection.hostToken,
      )
        .then(setSnapshot)
        .catch(() => {
          window.sessionStorage.removeItem(HOST_CONNECTION_STORAGE_KEY);
          setHostToken(null);
        });
    } catch {
      window.sessionStorage.removeItem(HOST_CONNECTION_STORAGE_KEY);
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
    if (!snapshot?.sessionId || !hostToken) {
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
  }, [hostToken, snapshot?.sessionId]);

  useEffect(() => {
    if (snapshotServerTimeMs !== undefined) {
      setServerClockOffsetMs(snapshotServerTimeMs - Date.now());
    }
  }, [snapshotServerTimeMs]);

  useEffect(() => {
    if (snapshot?.phase !== "question-open") {
      return;
    }

    const handle = window.setInterval(() => {
      setClockNowMs(Date.now() + serverClockOffsetMs);
    }, 250);

    return () => {
      window.clearInterval(handle);
    };
  }, [serverClockOffsetMs, snapshot?.phase, snapshot?.questionOpenedAtMs, snapshot?.cardIndex]);

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

  async function createRoom() {
    if (!selectedCategorySummary?.isPlayable) {
      setSetupError("Bible Gold is the current launch category, but it is not available in the catalog yet.");
      return;
    }

    try {
      setCreatingRoom(true);
      setSetupError(null);
      const room = await requestJson<{ sessionId: string; roomCode: string; hostToken: string }>("/api/trivia/sessions", {
        method: "POST",
        body: JSON.stringify({
          category: "bible",
          difficultyFilter: selectedDifficultyFilter,
        }),
      });
      setHostToken(room.hostToken);
      window.sessionStorage.setItem(
        HOST_CONNECTION_STORAGE_KEY,
        JSON.stringify({ sessionId: room.sessionId, hostToken: room.hostToken }),
      );
      const nextSnapshot = await requestJson<HostSnapshot>(`/api/trivia/sessions/${room.sessionId}`, undefined, room.hostToken);
      setSnapshot(nextSnapshot);
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to create the trivia room.");
    } finally {
      setCreatingRoom(false);
    }
  }

  async function startRoom() {
    if (!snapshot || !hostToken) {
      return;
    }

    try {
      setSnapshot(await requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/start`, { method: "POST", body: "{}" }, hostToken));
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to start the trivia room.");
    }
  }

  async function resolveQuestion() {
    if (!snapshot || !hostToken) {
      return;
    }

    try {
      setSnapshot(await requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/resolve`, { method: "POST", body: "{}" }, hostToken));
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to resolve the trivia question.");
    }
  }

  async function advanceQuestion() {
    if (!snapshot || !hostToken) {
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

  return (
    <section className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
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
              <div className="hidden">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Live paths</div>
                <div className="mt-2 font-semibold">Builder: /games/trivia/builder | Join: /games/trivia/join</div>
              </div>
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
                      Each question starts at 1,000 points with a 10-second clock. The available score drops by 100 every second and wrong answers do not subtract.
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
                <h3 className="mt-3 text-3xl font-black text-white">Winner: {leaderboard[0]?.name ?? "No winner yet"}</h3>
                <div className="mt-6 grid gap-3">
                  {leaderboard.map((player, index) => (
                    <div key={player.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-black text-white">{index + 1}. {player.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                          {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                        </div>
                      </div>
                      <div className="text-2xl font-black text-cyan-50">{player.score}</div>
                    </div>
                  ))}
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
                      ? `${snapshot.players.length} player${snapshot.players.length === 1 ? "" : "s"} joined.`
                      : "No players have joined yet. Use the QR, link, or room code on a phone to sign in."}
                  </div>
                </div>

                {snapshot.status === "lobby" ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Lobby players</div>
                    <div className="mt-5 grid gap-3">
                      {snapshot.players.length > 0 ? snapshot.players.map((player) => (
                        <div key={player.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-black text-white">
                          {player.name}
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/64">
                          Waiting for players to sign in from the join page.
                        </div>
                      )}
                    </div>
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
                          10-second clock | starts at {formatPoints(currentCard.scoring.correct)} | {formatDelta(currentCard.scoring.wrong)} wrong | {formatDelta(currentCard.scoring.skip)} skip
                        </div>
                      </div>
                    </div>

                    {countdown ? (
                      <div className={countdown.isExpired ? "mt-5 rounded-[24px] border border-amber-300/30 bg-amber-400/10 px-4 py-4 text-sm font-semibold text-amber-100" : "mt-5 rounded-[24px] border border-emerald-300/25 bg-emerald-400/10 px-4 py-4 text-sm font-semibold text-emerald-100"}>
                        {countdown.isExpired
                          ? "Time expired. 0 points are left on this question."
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
                      {snapshot.canAdvance ? (
                        <button type="button" onClick={advanceQuestion} className="inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110">
                          {snapshot.cardIndex === snapshot.deck.cards.length - 1 ? "Finish Session" : "Next Question"}
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
                    <div className="mt-6 grid gap-3">
                      {snapshot.resolution.rows.map((row) => (
                        <div key={row.playerId} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-black text-white">{row.playerName} | {row.outcome}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">Answered {row.responseText}</div>
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
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"><span className="font-semibold text-white">Each question starts at 1,000</span> and drops by 100 every second on a 10-second clock.</div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"><span className="font-semibold text-white">Wrong answers do not subtract</span>, and players bank whatever points are left when they answer correctly.</div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Leaderboard</div>
            <h3 className="mt-3 text-2xl font-black text-white">{snapshot?.deck.categoryLabel ?? selectedCategorySummary?.label ?? "Vault Runtime"}</h3>
            <div className="mt-5 grid gap-3">
              {leaderboard.length > 0 ? leaderboard.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div>
                    <div className="text-sm font-black text-white">{index + 1}. {player.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                      {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                    </div>
                  </div>
                  <div className="text-2xl font-black text-cyan-50">{player.score}</div>
                </div>
              )) : (
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
                    10s | {formatDelta(round.scoring.correct)} start | {formatDelta(round.scoring.wrong)} wrong | {formatDelta(round.scoring.skip)} skip
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
