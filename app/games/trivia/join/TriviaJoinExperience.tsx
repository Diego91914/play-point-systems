"use client";

import { useEffect, useState } from "react";
import type { RuntimePublicDeckCard } from "../play/trivia-runtime-types";

type JoinPlayer = {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

type JoinSnapshot = {
  sessionId: string;
  roomCode: string;
  status: "lobby" | "in-progress" | "completed";
  phase: "lobby" | "question-open" | "answer-reveal" | "completed";
  serverTimeMs: number;
  player: JoinPlayer;
  currentCard: RuntimePublicDeckCard | null;
  questionOpenedAtMs: number | null;
  questionTimerSeconds: number | null;
  answerState: {
    hasSubmitted: boolean;
    response: string | null;
    responseText: string | null;
  };
  leaderboard: JoinPlayer[];
  resolution: {
    correctSlot: string;
    correctText: string;
    explanation: string;
    playerOutcome: "correct" | "wrong" | "skip" | null;
    playerDelta: number | null;
    playerSpeedBonus: number | null;
  } | null;
};

type JoinResponse = JoinSnapshot & {
  playerToken: string;
};

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

function getCountdownState(snapshot: JoinSnapshot | null, nowMs: number) {
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

export function TriviaJoinExperience() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [snapshot, setSnapshot] = useState<JoinSnapshot | null>(null);
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [clockNowMs, setClockNowMs] = useState(Date.now());

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      setRoomCode(code.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (!snapshot?.sessionId || !snapshot?.player.id || !playerToken) {
      return;
    }

    const handle = window.setInterval(async () => {
      try {
        const nextSnapshot = await requestJson<JoinSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/players/${snapshot.player.id}`, undefined, playerToken);
        setSnapshot(nextSnapshot);
      } catch (error) {
        setJoinError(error instanceof Error ? error.message : "Unable to refresh the join session.");
      }
    }, 1200);

    return () => {
      window.clearInterval(handle);
    };
  }, [playerToken, snapshot?.player.id, snapshot?.sessionId]);

  useEffect(() => {
    if (snapshot?.phase !== "question-open") {
      return;
    }

    const handle = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(handle);
    };
  }, [snapshot?.phase, snapshot?.questionOpenedAtMs]);

  const countdown = getCountdownState(snapshot, clockNowMs);

  async function joinRoom() {
    try {
      setJoining(true);
      setJoinError(null);
      const joined = await requestJson<JoinResponse>("/api/trivia/rooms/join", {
        method: "POST",
        body: JSON.stringify({
          roomCode,
          playerName,
        }),
      });
      setPlayerToken(joined.playerToken);
      setSnapshot(joined);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "Unable to join the trivia room.");
    } finally {
      setJoining(false);
    }
  }

  async function answer(response: string) {
    if (!snapshot || !playerToken) {
      return;
    }

    try {
      setSnapshot(
        await requestJson<JoinSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/players/${snapshot.player.id}/answer`, {
          method: "POST",
          body: JSON.stringify({ response }),
        }, playerToken),
      );
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "Unable to submit the answer.");
    }
  }

  return (
    <section className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <div className="grid gap-6">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">Phone sign-in</div>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Room code and player name</h2>

            {!snapshot ? (
              <div className="mt-5 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <label className="block text-sm font-semibold text-white/90" htmlFor="room-code">
                  Room code
                </label>
                <input
                  id="room-code"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm font-black tracking-[0.2em] text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                  placeholder="ABC123"
                />

                <label className="mt-5 block text-sm font-semibold text-white/90" htmlFor="player-name">
                  Player name
                </label>
                <input
                  id="player-name"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                  placeholder="Olivia"
                />

                {joinError ? <div className="mt-4 text-sm font-semibold text-amber-200">{joinError}</div> : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={joinRoom}
                    disabled={joining}
                    className={
                      joining
                        ? "inline-flex rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-black text-white/36"
                        : "inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
                    }
                  >
                    {joining ? "Joining..." : "Join Room"}
                  </button>
                </div>
              </div>
            ) : snapshot.status === "completed" ? (
              <div className="mt-7 rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Game complete</div>
                <h3 className="mt-3 text-3xl font-black text-white">Thanks for playing, {snapshot.player.name}</h3>
                <p className="mt-4 text-sm leading-7 text-white/74">Your final score was {snapshot.player.score}.</p>
              </div>
            ) : snapshot.phase === "lobby" ? (
              <div className="mt-7 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Lobby</div>
                <h3 className="mt-3 text-2xl font-black text-white">You are in room {snapshot.roomCode}</h3>
                <p className="mt-4 text-sm leading-7 text-white/72">Signed in as {snapshot.player.name}. Waiting for the host to start the game.</p>
              </div>
            ) : snapshot.phase === "question-open" && snapshot.currentCard ? (
              <div className="mt-7 grid gap-6">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 sm:p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">{snapshot.currentCard.roundLabel}</div>
                <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">{snapshot.currentCard.prompt}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/70">Each question starts at 1,000 points with a 10-second clock. The available score drops by 100 every second and wrong answers do not subtract.</p>

                  {countdown ? (
                    <div className={countdown.isExpired ? "mt-5 rounded-[24px] border border-amber-300/30 bg-amber-400/10 px-4 py-4 text-sm font-semibold text-amber-100" : "mt-5 rounded-[24px] border border-emerald-300/25 bg-emerald-400/10 px-4 py-4 text-sm font-semibold text-emerald-100"}>
                      {countdown.isExpired
                        ? "Time expired. 0 points are left on this question."
                        : `${countdown.remainingSeconds}s left. ${formatPoints(countdown.availablePoints)} points are still available.`}
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {snapshot.currentCard.choices.map((choice) => (
                      <button
                        key={choice.slot}
                        type="button"
                        onClick={() => answer(choice.slot)}
                        disabled={snapshot.answerState.hasSubmitted || countdown?.isExpired}
                        className={
                          snapshot.answerState.response === choice.slot
                            ? "rounded-[24px] border border-cyan-300/40 bg-cyan-400/12 px-4 py-4 text-left"
                            : "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-4 text-left transition hover:bg-white/8"
                        }
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Choice {choice.slot}</div>
                        <div className="mt-2 text-lg font-black text-white">{choice.text}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => answer("skip")}
                      disabled={snapshot.answerState.hasSubmitted || countdown?.isExpired}
                      className={
                        snapshot.answerState.response === "skip"
                          ? "rounded-2xl border border-amber-300/45 bg-amber-400/16 px-4 py-2.5 text-sm font-black text-amber-50"
                          : "rounded-2xl border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-black text-white/84 transition hover:bg-white/12"
                      }
                    >
                      Skip
                    </button>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72">
                    {snapshot.answerState.hasSubmitted
                      ? `Locked in: ${snapshot.answerState.responseText ?? snapshot.answerState.response}`
                      : countdown?.isExpired
                        ? "Time expired for this question. Wait for the host to reveal the answer."
                        : "Choose your answer before the 10-second clock expires."}
                  </div>
                </div>
              </div>
            ) : snapshot.resolution ? (
              <div className="mt-7 rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Answer reveal</div>
                <h3 className="mt-3 text-2xl font-black text-white">Correct answer: {snapshot.resolution.correctSlot} | {snapshot.resolution.correctText}</h3>
                <p className="mt-4 text-sm leading-7 text-white/74">{snapshot.resolution.explanation}</p>
                <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/78">
                  Your result: {snapshot.resolution.playerOutcome ?? "waiting"} | {formatDelta(snapshot.resolution.playerDelta ?? 0)}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-28">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Signed in as</div>
            <h3 className="mt-3 text-2xl font-black text-white">{snapshot?.player.name ?? "Waiting to join"}</h3>
            <div className="mt-3 text-sm leading-7 text-white/72">
              {snapshot ? `Current score: ${snapshot.player.score}` : "Join a room to start playing from your phone."}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Leaderboard</div>
            <div className="mt-5 grid gap-3">
              {snapshot?.leaderboard?.length ? snapshot.leaderboard.map((player, index) => (
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
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/64">The leaderboard will appear after players join.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
