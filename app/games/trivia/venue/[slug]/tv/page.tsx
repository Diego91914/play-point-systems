"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { GameAtmosphere } from "../../../../_components/GameAtmosphere";

type Leader = { id: string; name: string; rollingScore: number; scoreTotal: number; championshipScore: number; rank: number };
type Championship = {
  startedAt: string;
  endsAt: string | null;
  latest: null | {
    id: number;
    window_started_at: string;
    window_ended_at: string;
    winner_player_id: string | null;
    standings: Array<{ rank: number; playerId: string; name: string; score: number }>;
    created_at: string;
  };
};
type DisplayPayload = {
  venue: { slug: string; displayName: string };
  venueSessionId: string;
  status: string;
  currentTriviaSessionId: string | null;
  presenceToken: string;
  leaderboard: Leader[];
  championship: Championship;
};
type StatePayload = {
  venue: { slug: string; displayName: string };
  venueSessionId: string;
  status: string;
  leaderboard: Leader[];
  championship: Championship;
  game: null | {
    status: string;
    phase: string;
    cardIndex: number;
    totalQuestions: number;
    currentCard: null | {
      prompt: string;
      choices: Array<{ slot: string; text: string }>;
      roundLabel: string;
      questionNumberInRound: number;
      totalQuestionsInRound: number;
    };
    questionOpenedAt: string | null;
    questionTimerSeconds: number | null;
    submittedCount: number;
    playerCount: number;
    resolution: null | { correctSlot: string; correctText: string; explanation: string };
  };
};

export default function TriviaVenueTvPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const slug = params.slug;
  const displayKey = search.get("key") ?? "";
  const [display, setDisplay] = useState<DisplayPayload | null>(null);
  const [state, setState] = useState<StatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!displayKey) return;
    let active = true;
    const loadDisplay = async () => {
      try {
        const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/display`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayKey }),
          cache: "no-store",
        });
        const next = await response.json();
        if (!response.ok) throw new Error(next.error ?? "Unable to open venue display.");
        if (active) { setDisplay(next); setError(null); }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to open venue display.");
      }
    };
    void loadDisplay();
    const handle = window.setInterval(loadDisplay, 10 * 60 * 1000);
    return () => { active = false; window.clearInterval(handle); };
  }, [displayKey, slug]);

  useEffect(() => {
    if (!displayKey) return;
    let active = true;
    const poll = async () => {
      try {
        await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/tick`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayKey }),
          cache: "no-store",
        });
        const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/state`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayKey }),
          cache: "no-store",
        });
        const next = await response.json();
        if (!response.ok) throw new Error(next.error ?? "Unable to load live trivia.");
        if (active) { setState(next); setError(null); }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load live trivia.");
      }
    };
    void poll();
    const handle = window.setInterval(poll, 1200);
    return () => { active = false; window.clearInterval(handle); };
  }, [displayKey, slug]);

  useEffect(() => {
    const handle = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(handle);
  }, []);

  const joinUrl = useMemo(() => {
    if (!display || typeof window === "undefined") return "";
    return `${window.location.origin}/games/trivia/venue/${encodeURIComponent(slug)}/join?p=${encodeURIComponent(display.presenceToken)}`;
  }, [display, slug]);

  const leaderboard = state?.leaderboard ?? display?.leaderboard ?? [];
  const championship = state?.championship ?? display?.championship ?? null;
  const game = state?.game ?? null;
  const secondsLeft = game?.phase === "question-open" && game.questionOpenedAt && game.questionTimerSeconds
    ? Math.max(0, Math.ceil((Date.parse(game.questionOpenedAt) + game.questionTimerSeconds * 1000 - nowMs) / 1000))
    : null;
  const championshipSecondsLeft = championship?.endsAt
    ? Math.max(0, Math.ceil((Date.parse(championship.endsAt) - nowMs) / 1000))
    : null;
  const championshipMinutesLeft = championshipSecondsLeft === null ? null : Math.max(1, Math.ceil(championshipSecondsLeft / 60));
  const latestChampion = championship?.latest?.standings?.[0] ?? null;
  const showChampion = Boolean(championship?.latest?.created_at && nowMs - Date.parse(championship.latest.created_at) < 45000);

  return (
    <GameAtmosphere variant="trivia">
      <main className="min-h-screen px-6 py-6 text-white lg:px-10 lg:py-8">
        {!displayKey ? <div className="mx-auto mt-20 max-w-xl rounded-[32px] border border-amber-300/20 bg-black/35 p-8 text-center"><h1 className="text-3xl font-black">Venue display key required</h1><p className="mt-4 text-white/65">Open this screen from the venue operator dashboard.</p></div> : null}
        {error ? <div className="mx-auto mb-5 max-w-3xl rounded-2xl border border-red-300/20 bg-red-950/35 px-5 py-3 text-center text-red-100">{error}</div> : null}
        {display ? (
          <div className="mx-auto grid max-w-[1600px] gap-6 xl:grid-cols-[1fr_330px]">
            <section className="rounded-[36px] border border-white/10 bg-black/30 p-7 shadow-2xl backdrop-blur lg:p-9">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.3em] text-cyan-200/70">{display.venue.displayName}</div>
                  <h1 className="mt-2 text-5xl font-black tracking-tight lg:text-7xl">LIVE TRIVIA</h1>
                </div>
                <div className="flex gap-3">
                  {championshipMinutesLeft !== null ? <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-right"><div className="text-xs font-black uppercase tracking-[0.2em] text-amber-100/60">Hourly title</div><div className="text-2xl font-black text-amber-100">{championshipMinutesLeft} min</div></div> : null}
                  {game ? <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-right"><div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Question</div><div className="text-2xl font-black">{Math.min(game.cardIndex + 1, game.totalQuestions)} / {game.totalQuestions}</div></div> : null}
                </div>
              </div>

              {showChampion && latestChampion ? (
                <div className="mt-8 rounded-[32px] border border-amber-300/30 bg-[linear-gradient(180deg,rgba(245,185,51,.22),rgba(0,0,0,.18))] p-8 text-center shadow-2xl">
                  <div className="text-sm font-black uppercase tracking-[0.3em] text-amber-100/75">Hourly Champion</div>
                  <div className="mt-3 text-6xl font-black text-amber-50 lg:text-7xl">{latestChampion.name}</div>
                  <div className="mt-3 text-2xl font-black text-amber-100">{latestChampion.score.toLocaleString()} points</div>
                  <p className="mt-4 text-lg text-white/65">New championship starts now. Keep playing—no rescanning required.</p>
                </div>
              ) : !game ? (
                <div className="mt-9 rounded-[30px] border border-white/10 bg-white/[0.04] p-8 text-center">
                  <div className="text-4xl font-black">Next game is getting ready.</div>
                  <p className="mt-4 text-xl text-white/60">Scan now. You can join before the next question starts.</p>
                </div>
              ) : game.status === "completed" ? (
                <div className="mt-9 rounded-[30px] border border-amber-300/25 bg-amber-300/10 p-8 text-center">
                  <div className="text-sm font-black uppercase tracking-[0.24em] text-amber-100/70">Game complete</div>
                  <div className="mt-3 text-5xl font-black">{leaderboard[0]?.name ? `${leaderboard[0].name} leads this hour` : "Great game"}</div>
                  <p className="mt-4 text-xl text-white/65">The next venue game starts automatically. Nobody has to rejoin.</p>
                </div>
              ) : game.phase === "answer-reveal" && game.resolution ? (
                <div className="mt-8 rounded-[32px] border border-emerald-300/25 bg-[linear-gradient(180deg,rgba(28,126,91,.25),rgba(0,0,0,.15))] p-8 text-center lg:p-10">
                  <div className="text-sm font-black uppercase tracking-[0.28em] text-emerald-100/70">Correct answer</div>
                  <div className="mt-4 text-3xl font-black text-emerald-100">{game.resolution.correctSlot}</div>
                  <div className="mt-2 text-5xl font-black lg:text-6xl">{game.resolution.correctText}</div>
                  {game.resolution.explanation ? <p className="mx-auto mt-5 max-w-4xl text-xl leading-8 text-white/68">{game.resolution.explanation}</p> : null}
                </div>
              ) : game.phase === "wager-open" ? (
                <div className="mt-8 rounded-[32px] border border-amber-300/25 bg-amber-300/10 p-10 text-center">
                  <div className="text-sm font-black uppercase tracking-[0.28em] text-amber-100/70">Final wager</div>
                  <div className="mt-4 text-5xl font-black">Check your phone.</div>
                  <p className="mt-4 text-xl text-white/65">Lock your wager before the final question opens.</p>
                </div>
              ) : game.currentCard ? (
                <div className="mt-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan-100/60">{game.currentCard.roundLabel}</div>
                    <div className={secondsLeft !== null && secondsLeft <= 5 ? "text-5xl font-black text-amber-200" : "text-5xl font-black text-cyan-100"}>{secondsLeft ?? ""}</div>
                  </div>
                  <h2 className="mt-4 text-4xl font-black leading-tight lg:text-6xl">{game.currentCard.prompt}</h2>
                  <div className="mt-7 grid gap-4 md:grid-cols-2">
                    {game.currentCard.choices.map((choice) => (
                      <div key={choice.slot} className="rounded-[24px] border border-white/10 bg-white/[0.05] px-6 py-5">
                        <div className="text-sm font-black text-cyan-200/70">{choice.slot}</div>
                        <div className="mt-2 text-2xl font-black lg:text-3xl">{choice.text}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center text-lg font-bold text-white/50">{game.submittedCount} of {game.playerCount} answered</div>
                </div>
              ) : (
                <div className="mt-9 rounded-[30px] border border-white/10 bg-white/[0.04] p-8 text-center"><div className="text-4xl font-black">Get ready…</div></div>
              )}

              <div className="mt-8">
                <div className="flex items-end justify-between gap-4"><div className="text-xs font-black uppercase tracking-[0.24em] text-white/50">This hour</div><div className="text-xs font-bold text-white/40">Resets every 60 minutes</div></div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {leaderboard.length ? leaderboard.slice(0, 8).map((player) => (
                    <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                      <div className="text-xl font-black">{player.rank}. {player.name}</div>
                      <div className="text-xl font-black text-cyan-100">{player.championshipScore.toLocaleString()}</div>
                    </div>
                  )) : <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-xl text-white/55 md:col-span-2">No active players yet. Scan the QR to be first.</div>}
                </div>
              </div>
            </section>

            <aside className="rounded-[36px] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(49,181,225,.18),rgba(0,0,0,.28))] p-6 text-center shadow-2xl backdrop-blur">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">Scan to play</div>
              {joinUrl ? <div className="mx-auto mt-5 w-fit rounded-[26px] bg-white p-3"><QRCodeSVG value={joinUrl} size={245} level="M" includeMargin={false} /></div> : null}
              <div className="mt-5 text-2xl font-black">Join anytime</div>
              <p className="mt-3 text-sm leading-6 text-white/65">Your phone is your private answer pad. Venue access lasts about one hour; scan again later to keep the same name and score.</p>
              {leaderboard[0] ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><div className="text-xs font-black uppercase tracking-[0.2em] text-amber-100/60">Current leader</div><div className="mt-2 text-2xl font-black text-amber-50">{leaderboard[0].name}</div><div className="mt-1 text-sm font-bold text-amber-100/75">{leaderboard[0].championshipScore.toLocaleString()} this hour</div></div> : null}
            </aside>
          </div>
        ) : null}
      </main>
    </GameAtmosphere>
  );
}
