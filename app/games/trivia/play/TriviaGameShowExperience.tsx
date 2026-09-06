"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MAX_TRIVIA_TEAM_COUNT,
  MIN_TRIVIA_TEAM_COUNT,
  type RuntimeCatalogCategorySummary,
  type RuntimeDeck,
  type RuntimeDeckCard,
  type RuntimeDifficultyFilter,
  type TriviaGameMode,
  type TriviaTeamId,
} from "./trivia-runtime-types";
import {
  TRIVIA_PACING_OPTIONS,
  type TriviaPacingMode,
} from "./trivia-live-timing";
import { formatTriviaWinnerHeading } from "./trivia-result-utils";
import { formatTriviaTeamWinnerHeading, type TriviaTeamStanding } from "./trivia-team-utils";

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
  outcome: "correct" | "wrong" | "skip";
  delta: number;
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
  submittedCount: number;
  waitingForCount: number;
  wagerSubmittedCount: number;
  wagerWaitingForCount: number;
  resolution: HostResolution | null;
  canStart: boolean;
  canReveal: boolean;
  canAdvance: boolean;
};

type CatalogPayload = { categories: RuntimeCatalogCategorySummary[] };

const HOST_KEY = "play-point-trivia-host-connection-v2";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Something went wrong.");
  return payload;
}

function points(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function difficultyName(value: RuntimeDifficultyFilter) {
  return value === "mixed" ? "Mixed" : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function TriviaGameShowExperience() {
  const [catalog, setCatalog] = useState<RuntimeCatalogCategorySummary[]>([]);
  const [category, setCategory] = useState("bible");
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<RuntimeDifficultyFilter>("mixed");
  const [pace, setPace] = useState<TriviaPacingMode>("standard");
  const [gameMode, setGameMode] = useState<TriviaGameMode>("individual");
  const [teamCount, setTeamCount] = useState(MIN_TRIVIA_TEAM_COUNT);
  const [snapshot, setSnapshot] = useState<HostSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const selectedCategory = useMemo(
    () => catalog.find((item) => item.category === category) ?? null,
    [catalog, category],
  );

  useEffect(() => {
    requestJson<CatalogPayload>("/api/trivia/catalog")
      .then((data) => {
        setCatalog(data.categories);
        if (!data.categories.some((item) => item.category === category)) {
          setCategory(data.categories[0]?.category ?? "bible");
        }
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load trivia."));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HOST_KEY) ?? "null") as { sessionId?: string } | null;
      if (!saved?.sessionId) return;
      requestJson<HostSnapshot>(`/api/trivia/sessions/${saved.sessionId}`)
        .then(setSnapshot)
        .catch(() => localStorage.removeItem(HOST_KEY));
    } catch {
      localStorage.removeItem(HOST_KEY);
    }
  }, []);

  useEffect(() => {
    if (!snapshot?.sessionId || snapshot.status === "completed") return;
    const id = window.setInterval(() => {
      requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}`)
        .then(setSnapshot)
        .catch(() => undefined);
    }, 1200);
    return () => window.clearInterval(id);
  }, [snapshot?.sessionId, snapshot?.status]);

  useEffect(() => {
    if (snapshot?.phase !== "question-open") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [snapshot?.phase]);

  useEffect(() => {
    setTopics([]);
    if (selectedCategory?.availableDifficultyFilters.length && !selectedCategory.availableDifficultyFilters.includes(difficulty)) {
      setDifficulty(selectedCategory.availableDifficultyFilters[0]);
    }
  }, [category]);

  const secondsLeft = useMemo(() => {
    if (!snapshot || snapshot.phase !== "question-open" || snapshot.questionOpenedAtMs === null) return null;
    const timer = snapshot.questionTimerSeconds ?? 10;
    return Math.max(0, Math.ceil(timer - (now - snapshot.questionOpenedAtMs) / 1000));
  }, [snapshot, now]);

  async function createRoom() {
    setBusy(true); setError(null);
    try {
      const room = await requestJson<{ sessionId: string }>("/api/trivia/sessions", {
        method: "POST",
        body: JSON.stringify({
          category,
          topicIds: topics,
          difficultyFilter: difficulty,
          pacingMode: pace,
          gameMode,
          teamCount,
        }),
      });
      localStorage.setItem(HOST_KEY, JSON.stringify({ sessionId: room.sessionId }));
      setSnapshot(await requestJson<HostSnapshot>(`/api/trivia/sessions/${room.sessionId}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the room.");
    } finally { setBusy(false); }
  }

  async function hostAction(action: "start" | "resolve" | "advance") {
    if (!snapshot) return;
    setBusy(true); setError(null);
    try {
      setSnapshot(await requestJson<HostSnapshot>(`/api/trivia/sessions/${snapshot.sessionId}/${action}`, { method: "POST", body: "{}" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue.");
    } finally { setBusy(false); }
  }

  function newGame(sameSettings: boolean) {
    localStorage.removeItem(HOST_KEY);
    setSnapshot(null);
    setError(null);
    if (!sameSettings) {
      setCategory(catalog[0]?.category ?? "bible");
      setTopics([]);
      setDifficulty("mixed");
      setPace("standard");
      setGameMode("individual");
      setTeamCount(MIN_TRIVIA_TEAM_COUNT);
    }
  }

  if (!snapshot) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="rounded-[32px] border border-cyan-200/15 bg-[radial-gradient(circle_at_top,rgba(70,180,255,.16),transparent_36%),rgba(4,10,20,.82)] p-6 shadow-2xl sm:p-8">
          <div className="text-xs font-black uppercase tracking-[.24em] text-cyan-200/60">Play Amplified Trivia</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">What kind of trivia sounds good tonight?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">Pick the room. We’ll handle the questions, scoring, countdowns and final wager.</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-bold text-white">Category
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-14 rounded-2xl border border-white/10 bg-[#07101c] px-4 text-white">
                  {catalog.filter((item) => item.isPlayable).map((item) => <option key={item.category} value={item.category}>{item.label}</option>)}
                </select>
              </label>

              {selectedCategory?.topics.length ? (
                <div>
                  <div className="text-sm font-bold text-white">Topics</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setTopics([])} className={`rounded-xl px-3 py-2 text-xs font-black ${topics.length === 0 ? "bg-cyan-300 text-slate-950" : "border border-white/10 bg-white/5 text-white/70"}`}>Anything goes</button>
                    {selectedCategory.topics.map((topic) => {
                      const active = topics.includes(topic.topic);
                      return <button key={topic.topic} type="button" onClick={() => setTopics((current) => active ? current.filter((id) => id !== topic.topic) : [...current, topic.topic])} className={`rounded-xl px-3 py-2 text-xs font-black ${active ? "bg-cyan-300 text-slate-950" : "border border-white/10 bg-white/5 text-white/70"}`}>{topic.label}</button>;
                    })}
                  </div>
                </div>
              ) : null}

              <label className="grid gap-2 text-sm font-bold text-white">Difficulty
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as RuntimeDifficultyFilter)} className="min-h-14 rounded-2xl border border-white/10 bg-[#07101c] px-4 text-white">
                  {(selectedCategory?.availableDifficultyFilters ?? ["mixed"]).map((item) => <option key={item} value={item}>{difficultyName(item)}</option>)}
                </select>
              </label>
            </div>

            <div className="grid content-start gap-5">
              <div>
                <div className="text-sm font-bold text-white">Pace</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(Object.entries(TRIVIA_PACING_OPTIONS) as [TriviaPacingMode, (typeof TRIVIA_PACING_OPTIONS)[TriviaPacingMode]][]).map(([key, option]) => <button key={key} type="button" onClick={() => setPace(key)} className={`rounded-2xl border p-4 text-left ${pace === key ? "border-cyan-200/50 bg-cyan-300/15" : "border-white/10 bg-white/[.04]"}`}><div className="font-black text-white">{option.label}</div><div className="mt-1 text-xs text-white/55">{option.timerSeconds}s per question</div></button>)}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-white">Play as</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["individual", "teams"] as TriviaGameMode[]).map((mode) => <button key={mode} type="button" onClick={() => setGameMode(mode)} className={`rounded-2xl border p-4 font-black ${gameMode === mode ? "border-amber-200/50 bg-amber-300/15 text-white" : "border-white/10 bg-white/[.04] text-white/65"}`}>{mode === "individual" ? "Everyone for themselves" : "Teams"}</button>)}
                </div>
              </div>

              {gameMode === "teams" ? <label className="grid gap-2 text-sm font-bold text-white">Number of teams
                <select value={teamCount} onChange={(e) => setTeamCount(Number(e.target.value))} className="min-h-14 rounded-2xl border border-white/10 bg-[#07101c] px-4 text-white">{Array.from({ length: MAX_TRIVIA_TEAM_COUNT - MIN_TRIVIA_TEAM_COUNT + 1 }, (_, index) => MIN_TRIVIA_TEAM_COUNT + index).map((count) => <option key={count} value={count}>{count} teams</option>)}</select>
              </label> : null}
            </div>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">{error}</div> : null}
          <button type="button" disabled={busy || !selectedCategory?.isPlayable} onClick={createRoom} className="mt-7 min-h-14 w-full rounded-2xl bg-cyan-300 px-5 text-base font-black text-slate-950 disabled:opacity-40">{busy ? "BUILDING YOUR GAME…" : "CREATE TRIVIA ROOM"}</button>
        </div>
      </section>
    );
  }

  if (snapshot.status === "completed") {
    const heading = snapshot.gameMode === "teams" ? formatTriviaTeamWinnerHeading(snapshot.teamLeaderboard) : formatTriviaWinnerHeading(snapshot.leaderboard);
    return (
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-[34px] border border-amber-200/20 bg-[radial-gradient(circle_at_top,rgba(255,196,80,.18),transparent_40%),rgba(5,8,16,.92)] p-7 text-center shadow-2xl sm:p-10">
          <div className="text-xs font-black uppercase tracking-[.28em] text-amber-200/65">Final scores</div>
          <h2 className="mt-4 text-4xl font-black text-white sm:text-6xl">{heading}</h2>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left">
            {(snapshot.gameMode === "teams" ? snapshot.teamLeaderboard.map((team) => ({ id: team.id, name: team.label, score: team.score })) : snapshot.leaderboard.map((player) => ({ id: player.id, name: player.name, score: player.score }))).map((row, index) => <div key={row.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.05] px-4 py-4"><div className="font-black text-white">{index + 1}. {row.name}</div><div className="text-xl font-black text-cyan-100">{points(row.score)}</div></div>)}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button onClick={() => newGame(true)} className="min-h-14 rounded-2xl bg-cyan-300 px-4 font-black text-slate-950">SAME SETUP</button>
            <button onClick={() => newGame(false)} className="min-h-14 rounded-2xl border border-white/15 bg-white/[.05] px-4 font-black text-white">NEW TRIVIA</button>
            <Link href="/games" className="grid min-h-14 place-items-center rounded-2xl border border-white/15 bg-white/[.05] px-4 font-black text-white">BACK TO GAMES</Link>
          </div>
        </div>
      </section>
    );
  }

  if (snapshot.phase === "lobby") {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="rounded-[32px] border border-white/10 bg-black/30 p-6 sm:p-8">
          <div className="text-xs font-black uppercase tracking-[.24em] text-cyan-200/55">Get everybody in</div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><div className="text-sm font-bold text-white/55">ROOM CODE</div><div className="mt-2 text-5xl font-black tracking-[.16em] text-white">{snapshot.roomCode}</div><div className="mt-5 text-sm text-white/60">{snapshot.players.length} player{snapshot.players.length === 1 ? "" : "s"} joined</div><div className="mt-3 flex flex-wrap gap-2">{snapshot.players.map((player) => <span key={player.id} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-sm font-bold text-white">{player.name}</span>)}</div></div>
            <Image src={snapshot.qrUrl} alt={`Join room ${snapshot.roomCode}`} width={210} height={210} unoptimized className="rounded-3xl bg-white p-3" />
          </div>
          {error ? <div className="mt-5 text-sm font-bold text-amber-200">{error}</div> : null}
          <button disabled={!snapshot.canStart || busy} onClick={() => hostAction("start")} className="mt-7 min-h-16 w-full rounded-2xl bg-cyan-300 px-5 text-lg font-black text-slate-950 disabled:opacity-35">{snapshot.canStart ? "START THE GAME" : "WAITING FOR PLAYERS…"}</button>
        </div>
      </section>
    );
  }

  if (snapshot.phase === "wager-open") {
    return <section className="mx-auto max-w-4xl px-4 py-8"><div className="rounded-[34px] border border-amber-200/25 bg-amber-300/10 p-8 text-center"><div className="text-xs font-black uppercase tracking-[.28em] text-amber-200/70">Final wager</div><h2 className="mt-4 text-4xl font-black text-white">Bet on what you know.</h2><p className="mt-3 text-white/60">Wagers are private on each player’s phone.</p><div className="mt-7 text-2xl font-black text-white">{snapshot.wagerSubmittedCount} locked · {snapshot.wagerWaitingForCount} waiting</div>{snapshot.canAdvance ? <button onClick={() => hostAction("advance")} disabled={busy} className="mt-7 min-h-14 rounded-2xl bg-amber-300 px-6 font-black text-slate-950">OPEN THE FINAL QUESTION</button> : null}</div></section>;
  }

  if (snapshot.phase === "question-countdown") {
    return <section className="grid min-h-[60vh] place-items-center px-4 text-center"><div><div className="text-sm font-black uppercase tracking-[.3em] text-cyan-200/55">Get ready</div><div className="mt-4 text-[7rem] font-black leading-none text-white">3</div></div></section>;
  }

  const card = snapshot.currentCard;
  if (!card) return null;

  if (snapshot.phase === "answer-reveal" && snapshot.resolution) {
    const correct = snapshot.resolution.rows.filter((row) => row.outcome === "correct").length;
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="rounded-[34px] border border-emerald-200/20 bg-[radial-gradient(circle_at_top,rgba(60,220,150,.15),transparent_38%),rgba(4,12,14,.92)] p-7 text-center sm:p-9">
          <div className="text-xs font-black uppercase tracking-[.24em] text-emerald-200/60">Answer reveal</div>
          <div className="mt-5 text-6xl font-black text-emerald-200">{snapshot.resolution.correctSlot}</div>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black text-white sm:text-5xl">{snapshot.resolution.correctText}</h2>
          <div className="mt-5 text-sm font-bold text-white/55">{correct} got it right · {snapshot.resolution.rows.length - correct} missed or skipped</div>
          <div className="mx-auto mt-7 grid max-w-2xl gap-2 text-left">{snapshot.leaderboard.slice(0, 5).map((player, index) => <div key={player.id} className="flex justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3"><span className="font-black text-white">{index + 1}. {player.name}</span><span className="font-black text-cyan-100">{points(player.score)}</span></div>)}</div>
          {snapshot.canAdvance ? <button disabled={busy} onClick={() => hostAction("advance")} className="mt-7 min-h-14 w-full rounded-2xl bg-cyan-300 px-5 font-black text-slate-950">{snapshot.cardIndex >= snapshot.deck.cards.length - 1 ? "SEE FINAL RESULTS" : "NEXT QUESTION"}</button> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(66,162,255,.13),transparent_40%),rgba(4,9,18,.92)] p-6 shadow-2xl sm:p-9">
        <div className="flex items-center justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.22em] text-cyan-200/55">{card.roundLabel}</div><div className="mt-1 text-sm font-bold text-white/45">Question {card.questionNumberInRound} of {card.totalQuestionsInRound}</div></div>{secondsLeft !== null ? <div className={`text-4xl font-black ${secondsLeft <= 3 ? "text-rose-300" : "text-white"}`}>{secondsLeft}</div> : null}</div>
        <h2 className="mx-auto mt-8 max-w-4xl text-center text-3xl font-black leading-tight text-white sm:text-5xl">{card.prompt}</h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">{card.choices.map((choice) => <div key={choice.slot} className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><span className="mr-3 inline-grid h-8 w-8 place-items-center rounded-lg bg-cyan-300 font-black text-slate-950">{choice.slot}</span><span className="font-bold text-white">{choice.text}</span></div>)}</div>
        <div className="mt-7 text-center text-sm font-bold text-white/50">{snapshot.submittedCount} answered · {snapshot.waitingForCount} waiting</div>
        {snapshot.canReveal ? <button disabled={busy} onClick={() => hostAction("resolve")} className="mt-6 min-h-14 w-full rounded-2xl bg-emerald-300 px-5 font-black text-emerald-950">REVEAL THE ANSWER</button> : null}
        {error ? <div className="mt-4 text-center text-sm font-bold text-amber-200">{error}</div> : null}
      </div>
    </section>
  );
}
