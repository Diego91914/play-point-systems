"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { GameAtmosphere } from "../../../../_components/GameAtmosphere";

type Leader = { id: string; name: string; rollingScore: number; scoreTotal: number; rank: number };
type DisplayPayload = {
  venue: { slug: string; displayName: string };
  venueSessionId: string;
  status: string;
  currentTriviaSessionId: string | null;
  presenceToken: string;
  leaderboard: Leader[];
};
type StatePayload = {
  venue: { slug: string; displayName: string };
  venueSessionId: string;
  status: string;
  leaderboard: Leader[];
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
  const game = state?.game ?? null;
  const secondsLeft = game?.phase === "question-open" && game.questionOpenedAt && game.questionTimerSeconds
    ? Math.max(0, Math.ceil((Date.parse(game.questionOpenedAt) + game.questionTimerSeconds * 1000 - nowMs) / 1000))
    : null;

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
                {game ? <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-right"><div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Question</div><div className="text-2xl font-black">{Math.min(game.cardIndex + 1, game.totalQuestions)} / {game.totalQuestions}</div></div> : null}
              </div>

              {!game ? (
                <div className="mt-9 rounded-[30px] border border-white/10 bg-white/[0.04] p-8 text-center">
                  <div className="text-4xl font-black">Next game is getting ready.</div>
                  <p className="mt-4 text-xl text-white/60">Scan now. You can join before the next question starts.</p>
                </div>
              ) : game.status === "completed" ? (
                <div className="mt-9 rounded-[30px] border border-amber-300/25 bg-amber-300/10 p-8 text-center">
                  <div className="text-sm font-black uppercase tracking-[0.24em] text-amber-100/70">Game complete</div>
                  <div className="mt-3 text-5xl font-black">{leaderboard[0]?.name ? `${leaderboard[0].name} leads the room` : "Great game"}</div>
                  <p className="mt-4 text-xl text-white/65">The next venue game can start without anyone rescanning.</p>
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
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/50">Active leaderboard</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {leaderboard.length ? leaderboard.slice(0, 8).map((player) => (
                    <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                      <div className="text-xl font-black">{player.rank}. {player.name}</div>
                      <div className="text-xl font-black text-cyan-100">{player.rollingScore.toLocaleString()}</div>
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
            </aside>
          </div>
        ) : null}
      </main>
    </GameAtmosphere>
  );
}
