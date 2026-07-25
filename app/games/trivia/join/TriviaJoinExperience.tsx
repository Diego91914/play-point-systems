"use client";

import { useEffect, useState } from "react";
import type { RuntimePublicDeckCard, TriviaGameMode, TriviaTeamId } from "../play/trivia-runtime-types";
import { subscribeToTriviaStream } from "../play/trivia-live-stream";
import { formatTriviaTeamWinnerHeading, getTriviaTeamLabel, type TriviaTeamStanding } from "../play/trivia-team-utils";
import {
  calculateTriviaCorrectPoints,
  formatTriviaScoringSummary,
  TRIVIA_PACING_OPTIONS,
  type TriviaPacingMode,
} from "../play/trivia-live-timing";

type JoinPlayer = {
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

type JoinSnapshot = {
  sessionId: string;
  roomCode: string;
  status: "lobby" | "in-progress" | "completed";
  phase: "lobby" | "wager-open" | "question-open" | "answer-reveal" | "completed";
  serverTimeMs: number;
  player: JoinPlayer;
  currentCard: RuntimePublicDeckCard | null;
  questionOpenedAtMs: number | null;
  questionTimerSeconds: number | null;
  pacingMode: TriviaPacingMode;
  gameMode: TriviaGameMode;
  teamCount: number;
  answerState: {
    hasSubmitted: boolean;
    response: string | null;
    responseText: string | null;
  };
  wagerState: {
    hasSubmitted: boolean;
    wager: number | null;
    maxWager: number;
  };
  leaderboard: JoinPlayer[];
  teamLeaderboard: TriviaTeamStanding[];
  resolution: {
    correctSlot: string;
    correctText: string;
    explanation: string;
    reference: string;
    playerOutcome: "correct" | "wrong" | "skip" | null;
    playerDelta: number | null;
    playerSpeedBonus: number | null;
    playerStreakBonus: number | null;
  } | null;
};

type JoinResponse = JoinSnapshot & {
  playerToken: string;
};

const PLAYER_CONNECTION_STORAGE_KEY = "play-point-trivia-player-connection-v1";

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

function PhoneTeamStandings({ standings, playerTeamId }: { standings: TriviaTeamStanding[]; playerTeamId: TriviaTeamId | null }) {
  return (
    <div className="grid gap-3">
      {standings.map((team, index) => (
        <div key={team.id} className={team.id === playerTeamId ? "flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/35 bg-cyan-400/12 px-4 py-4" : "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"}>
          <div>
            <div className="text-sm font-black text-white">{index + 1}. {team.label}{team.id === playerTeamId ? " (your team)" : ""}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">{team.playerCount} player{team.playerCount === 1 ? "" : "s"} | {team.correctCount} right</div>
          </div>
          <div className="text-2xl font-black text-cyan-50">{formatPoints(team.score)}</div>
        </div>
      ))}
    </div>
  );
}

function getCountdownState(snapshot: JoinSnapshot | null, nowMs: number) {
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
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const [streamConnected, setStreamConnected] = useState(false);
  const [wagerInput, setWagerInput] = useState("");
  const [submittingWager, setSubmittingWager] = useState(false);
  const snapshotServerTimeMs = snapshot?.serverTimeMs;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      setRoomCode(code.toUpperCase());
    }

    const storedConnection = window.sessionStorage.getItem(PLAYER_CONNECTION_STORAGE_KEY);

    if (!storedConnection) {
      return;
    }

    try {
      const connection = JSON.parse(storedConnection) as {
        sessionId?: string;
        roomCode?: string;
        playerId?: string;
        playerToken?: string;
      };

      if (
        !connection.sessionId
        || !connection.roomCode
        || !connection.playerId
        || !connection.playerToken
        || (code && connection.roomCode !== code.toUpperCase())
      ) {
        return;
      }

      setPlayerToken(connection.playerToken);
      requestJson<JoinSnapshot>(
        `/api/trivia/sessions/${connection.sessionId}/players/${connection.playerId}`,
        undefined,
        connection.playerToken,
      )
        .then(setSnapshot)
        .catch(() => {
          window.sessionStorage.removeItem(PLAYER_CONNECTION_STORAGE_KEY);
          setPlayerToken(null);
        });
    } catch {
      window.sessionStorage.removeItem(PLAYER_CONNECTION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!snapshot?.sessionId || !snapshot?.player.id || !playerToken || streamConnected) {
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
  }, [playerToken, snapshot?.player.id, snapshot?.sessionId, streamConnected]);

  useEffect(() => {
    if (!snapshot?.sessionId || !snapshot?.player.id || !playerToken) {
      return;
    }

    return subscribeToTriviaStream<JoinSnapshot>({
      url: `/api/trivia/sessions/${snapshot.sessionId}/events?playerId=${encodeURIComponent(snapshot.player.id)}`,
      token: playerToken,
      onSnapshot: setSnapshot,
      onConnectionChange: setStreamConnected,
    });
  }, [playerToken, snapshot?.player.id, snapshot?.sessionId]);

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
  }, [serverClockOffsetMs, snapshot?.phase, snapshot?.questionOpenedAtMs]);

  useEffect(() => {
    if (snapshot?.phase === "wager-open" && !snapshot.wagerState.hasSubmitted) {
      setWagerInput(String(Math.floor(snapshot.wagerState.maxWager / 2)));
    }
  }, [snapshot?.phase, snapshot?.wagerState.hasSubmitted, snapshot?.wagerState.maxWager]);

  const countdown = getCountdownState(snapshot, clockNowMs);
  const isFinalQuestion = Boolean(
    snapshot?.currentCard
    && snapshot.currentCard.roundIndex === snapshot.currentCard.totalRounds - 1
    && snapshot.currentCard.questionNumberInRound === snapshot.currentCard.totalQuestionsInRound,
  );

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
      window.sessionStorage.setItem(
        PLAYER_CONNECTION_STORAGE_KEY,
        JSON.stringify({
          sessionId: joined.sessionId,
          roomCode: joined.roomCode,
          playerId: joined.player.id,
          playerToken: joined.playerToken,
        }),
      );
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

  async function submitWager() {
    if (!snapshot || !playerToken) {
      return;
    }

    try {
      setSubmittingWager(true);
      setJoinError(null);
      setSnapshot(
        await requestJson<JoinSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/players/${snapshot.player.id}/wager`, {
          method: "POST",
          body: JSON.stringify({ wager: Number(wagerInput) }),
        }, playerToken),
      );
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "Unable to submit that wager.");
    } finally {
      setSubmittingWager(false);
    }
  }

  return (
    <section className="px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="grid gap-6">
          <div className={snapshot ? "min-w-0" : "rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-7"}>
            {!snapshot ? (
              <>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">Phone sign-in</div>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Room code and player name</h2>
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
              </>
            ) : snapshot.status === "completed" ? (
              <div className="rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Game complete</div>
                <h3 className="mt-3 text-3xl font-black text-white">{snapshot.gameMode === "individual" ? `Thanks for playing, ${snapshot.player.name}` : formatTriviaTeamWinnerHeading(snapshot.teamLeaderboard)}</h3>
                <p className="mt-4 text-sm leading-7 text-white/74">Your final score was {snapshot.player.score}.</p>
                <div className="mt-6">
                  {snapshot.gameMode !== "individual" ? <PhoneTeamStandings standings={snapshot.teamLeaderboard} playerTeamId={snapshot.player.teamId} /> : <div className="grid gap-3">{snapshot.leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className={player.id === snapshot.player.id
                        ? "flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/35 bg-cyan-400/12 px-4 py-4"
                        : "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"}
                    >
                      <div className="text-sm font-black text-white">{index + 1}. {player.name}{player.id === snapshot.player.id ? " (you)" : ""}</div>
                      <div className="text-2xl font-black text-cyan-50">{formatPoints(player.score)}</div>
                    </div>
                  ))}</div>}
                </div>
              </div>
            ) : snapshot.phase === "lobby" ? (
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Lobby</div>
                <h3 className="mt-3 text-2xl font-black text-white">You are in room {snapshot.roomCode}</h3>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  {snapshot.player.teamId ? `You are on ${getTriviaTeamLabel(snapshot.player.teamId)}. ` : ""}Waiting for the host to start the game.
                </p>
              </div>
            ) : snapshot.phase === "wager-open" ? (
              <div className="rounded-[24px] border border-amber-300/25 bg-[linear-gradient(180deg,rgba(129,91,28,0.3),rgba(255,255,255,0.03))] p-5 sm:rounded-[28px] sm:p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">Final wager</div>
                <h3 className="mt-3 text-3xl font-black text-white">Risk some—or none—of your score</h3>
                <p className="mt-4 text-sm leading-7 text-white/72">You have {formatPoints(snapshot.wagerState.maxWager)} points. A correct final answer adds your wager; a wrong or skipped answer subtracts it.</p>

                {snapshot.wagerState.hasSubmitted ? (
                  <div className="mt-6 rounded-[24px] border border-emerald-300/30 bg-emerald-400/10 px-5 py-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/65">Wager locked</div>
                    <div className="mt-2 text-3xl font-black text-white">{formatPoints(snapshot.wagerState.wager ?? 0)} points</div>
                    <p className="mt-3 text-sm text-white/64">Waiting for the host to open the final question.</p>
                  </div>
                ) : (
                  <div className="mt-6">
                    <label className="text-sm font-semibold text-white" htmlFor="final-wager">Your wager</label>
                    <input
                      id="final-wager"
                      type="number"
                      min={0}
                      max={snapshot.wagerState.maxWager}
                      step={1}
                      inputMode="numeric"
                      value={wagerInput}
                      onChange={(event) => setWagerInput(event.target.value)}
                      className="mt-3 w-full rounded-[20px] border border-white/12 bg-black/30 px-4 py-4 text-2xl font-black text-white outline-none transition focus:border-amber-300/50"
                    />
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[0, Math.floor(snapshot.wagerState.maxWager / 2), snapshot.wagerState.maxWager].map((amount, index) => (
                        <button key={`${amount}-${index}`} type="button" onClick={() => setWagerInput(String(amount))} className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-sm font-black text-white transition hover:bg-white/12">
                          {index === 0 ? "None" : index === 1 ? "Half" : "All in"}
                        </button>
                      ))}
                    </div>
                    {joinError ? <div className="mt-4 text-sm font-semibold text-amber-200">{joinError}</div> : null}
                    <button type="button" onClick={submitWager} disabled={submittingWager} className="mt-5 w-full rounded-2xl border border-amber-200/35 bg-amber-300 px-5 py-4 text-base font-black text-[#1a1003] transition hover:brightness-110 disabled:opacity-50">
                      {submittingWager ? "Locking..." : "Lock Final Wager"}
                    </button>
                  </div>
                )}
              </div>
            ) : snapshot.phase === "question-open" && snapshot.currentCard ? (
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 sm:rounded-[28px] sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                  <span>{snapshot.currentCard.roundLabel}</span>
                  <span className="flex items-center gap-3">
                    {snapshot.player.currentStreak > 0 ? <span className="text-amber-200">{snapshot.player.currentStreak} answer streak</span> : null}
                    {snapshot.player.teamId ? <span className="text-cyan-100/70">{getTriviaTeamLabel(snapshot.player.teamId)}</span> : null}
                  </span>
                </div>
                <h3 className="mt-2 text-2xl font-black text-white sm:mt-3 sm:text-4xl">{snapshot.currentCard.prompt}</h3>
                  <p className="mt-3 text-xs leading-5 text-white/64 sm:text-sm sm:leading-7">
                    {TRIVIA_PACING_OPTIONS[snapshot.pacingMode].label} | {snapshot.questionTimerSeconds}s | {isFinalQuestion ? "Your private wager is at stake" : formatTriviaScoringSummary(snapshot.currentCard.scoring, snapshot.questionTimerSeconds ?? 10)}
                  </p>

                  {countdown ? (
                    <div className={countdown.isExpired ? "mt-4 rounded-[20px] border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100" : "mt-4 rounded-[20px] border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100"}>
                      {countdown.isExpired
                        ? "Time expired. Wait for the host to reveal the final result."
                        : isFinalQuestion
                          ? `${countdown.remainingSeconds}s left. Your locked wager is at stake.`
                          : `${countdown.remainingSeconds}s left. ${formatPoints(countdown.availablePoints)} points are still available.`}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                    {snapshot.currentCard.choices.map((choice) => (
                      <button
                        key={choice.slot}
                        type="button"
                        onClick={() => answer(choice.slot)}
                        disabled={snapshot.answerState.hasSubmitted || countdown?.isExpired}
                        className={
                          snapshot.answerState.response === choice.slot
                            ? "rounded-[20px] border border-cyan-300/40 bg-cyan-400/12 px-4 py-3 text-left sm:rounded-[24px] sm:py-4"
                            : "rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3 text-left transition hover:bg-white/8 sm:rounded-[24px] sm:py-4"
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

                  <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72 sm:mt-5 sm:rounded-[24px] sm:py-4">
                    {snapshot.answerState.hasSubmitted
                      ? `Locked in: ${snapshot.answerState.responseText ?? snapshot.answerState.response}`
                      : countdown?.isExpired
                        ? "Time expired for this question. Wait for the host to reveal the answer."
                        : `Choose your answer before the ${snapshot.questionTimerSeconds}-second clock expires.`}
                  </div>
                </div>
              </div>
            ) : snapshot.resolution ? (
              <div className="rounded-[24px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-4 sm:rounded-[28px] sm:p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Answer reveal</div>
                <h3 className="mt-3 text-2xl font-black text-white">Correct answer: {snapshot.resolution.correctSlot} | {snapshot.resolution.correctText}</h3>
                <p className="mt-4 text-sm leading-7 text-white/74">{snapshot.resolution.explanation}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/68">Scripture reference: {snapshot.resolution.reference}</p>
                <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/78">
                  Your result: {snapshot.resolution.playerOutcome ?? "waiting"} | {formatDelta(snapshot.resolution.playerDelta ?? 0)}
                  {(snapshot.resolution.playerStreakBonus ?? 0) > 0 ? ` | Streak bonus +${formatPoints(snapshot.resolution.playerStreakBonus ?? 0)}` : ""}
                </div>
                <div className="mt-7 border-t border-white/10 pt-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Updated leaderboard</div>
                  <h4 className="mt-2 text-xl font-black text-white">Waiting for the host</h4>
                  <p className="mt-2 text-sm leading-6 text-white/64">Review the standings while the host gets the next question ready.</p>
                  <div className="mt-5">
                    {snapshot.gameMode !== "individual" ? <PhoneTeamStandings standings={snapshot.teamLeaderboard} playerTeamId={snapshot.player.teamId} /> : <div className="grid gap-3">{snapshot.leaderboard.map((player, index) => (
                      <div
                        key={player.id}
                        className={player.id === snapshot.player.id
                          ? "flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/35 bg-cyan-400/12 px-4 py-4"
                          : "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"}
                      >
                        <div>
                          <div className="text-sm font-black text-white">{index + 1}. {player.name}{player.id === snapshot.player.id ? " (you)" : ""}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                            {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                          </div>
                        </div>
                        <div className="text-2xl font-black text-cyan-50">{formatPoints(player.score)}</div>
                      </div>
                    ))}</div>}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
