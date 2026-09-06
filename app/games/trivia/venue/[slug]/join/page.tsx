"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { GameAtmosphere } from "../../../../_components/GameAtmosphere";

type StoredVenuePlayer = {
  playerId: string;
  deviceToken: string;
  venueSessionId: string;
  name: string;
  presenceExpiresAt: string;
};

type PlayerPayload = {
  venue: { slug: string; displayName: string };
  presenceStatus: "active" | "idle" | "presence_expired" | "removed";
  waitingForMatch: boolean;
  player: { id: string; name: string; rollingScore: number; scoreTotal: number; currentStreak?: number };
  game?: {
    status: string;
    phase: string;
    cardIndex: number;
    currentCard: null | {
      prompt: string;
      choices: Array<{ slot: string; text: string }>;
      roundLabel: string;
      questionNumberInRound: number;
      totalQuestionsInRound: number;
    };
    questionOpenedAt: string | null;
    questionTimerSeconds: number | null;
    answerState: { hasSubmitted: boolean; response: string | null };
    wagerState: { hasSubmitted: boolean; wager: number | null; maxWager: number };
    resolution: null | { correctSlot: string; correctText: string; explanation: string; outcome: string | null; delta: number | null };
  };
};

export default function TriviaVenueJoinPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const slug = params.slug;
  const presenceToken = search.get("p") ?? "";
  const [name, setName] = useState("");
  const [storedPlayer, setStoredPlayer] = useState<StoredVenuePlayer | null>(null);
  const [payload, setPayload] = useState<PlayerPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [wager, setWager] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());
  const storageKey = useMemo(() => `play-amplified-trivia-venue-${slug}`, [slug]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredVenuePlayer;
      if (!parsed.playerId || !parsed.deviceToken || !parsed.name || !parsed.venueSessionId) return;
      setStoredPlayer(parsed);
      setName(parsed.name);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storedPlayer) return;
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/player`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueSessionId: storedPlayer.venueSessionId, playerId: storedPlayer.playerId, deviceToken: storedPlayer.deviceToken }),
          cache: "no-store",
        });
        const next = await response.json();
        if (!response.ok) throw new Error(next.error ?? "Unable to load venue trivia.");
        if (active) { setPayload(next); setMessage(null); }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Unable to load venue trivia.");
      }
    };
    void poll();
    const handle = window.setInterval(poll, 1200);
    return () => { active = false; window.clearInterval(handle); };
  }, [slug, storedPlayer]);

  useEffect(() => {
    const handle = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(handle);
  }, []);

  async function continuePlaying() {
    if (!storedPlayer) return;
    setJoining(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: storedPlayer.playerId, deviceToken: storedPlayer.deviceToken, presenceToken }),
      });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error ?? "Unable to renew venue access.");
      const saved = { ...storedPlayer, presenceExpiresAt: next.presenceExpiresAt };
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
      setStoredPlayer(saved);
      setMessage(`Welcome back, ${storedPlayer.name}. Your place and score are still here.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to renew venue access.");
    } finally {
      setJoining(false);
    }
  }

  async function join() {
    setJoining(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, presenceToken }),
      });
      const joined = await response.json();
      if (!response.ok) throw new Error(joined.error ?? "Unable to join.");
      const saved: StoredVenuePlayer = { playerId: joined.player.id, deviceToken: joined.deviceToken, venueSessionId: joined.venueSessionId, name: joined.player.name, presenceExpiresAt: joined.player.presence_expires_at };
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
      setStoredPlayer(saved);
      setMessage(`You're in, ${joined.player.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to join venue trivia.");
    } finally {
      setJoining(false);
    }
  }

  async function sendAction(action: "answer" | "wager", value: string | number) {
    if (!storedPlayer) return;
    setMessage(null);
    const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueSessionId: storedPlayer.venueSessionId, playerId: storedPlayer.playerId, deviceToken: storedPlayer.deviceToken, action, ...(action === "answer" ? { response: value } : { wager: Number(value) }) }),
      cache: "no-store",
    });
    const next = await response.json();
    if (!response.ok) { setMessage(next.error ?? "Unable to submit."); return; }
    setPayload(next);
  }

  const hasCurrentQr = Boolean(presenceToken);
  const game = payload?.game;
  const secondsLeft = game?.phase === "question-open" && game.questionOpenedAt && game.questionTimerSeconds
    ? Math.max(0, Math.ceil((Date.parse(game.questionOpenedAt) + game.questionTimerSeconds * 1000 - nowMs) / 1000))
    : null;
  const mustRescan = payload?.presenceStatus === "presence_expired";

  return (
    <GameAtmosphere variant="trivia">
      <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 text-white sm:px-5 sm:py-10">
        <div className="rounded-[30px] border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur sm:p-7">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200/70">Play Amplified Trivia · Venue Mode</div>

          {!storedPlayer ? (
            <>
              <h1 className="mt-3 text-4xl font-black">Join the room.</h1>
              <p className="mt-3 text-sm leading-7 text-white/68">Enter a nickname. Your phone becomes your private answer pad while the TV runs the show.</p>
              {!hasCurrentQr ? <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">Scan the current QR code on the venue TV to join.</div> : null}
              <label className="mt-7 block text-sm font-bold" htmlFor="venue-name">Nickname</label>
              <input id="venue-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Table 12" className="mt-3 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-4 text-lg font-bold outline-none focus:border-cyan-300/50" />
              <button type="button" disabled={!hasCurrentQr || !name.trim() || joining} onClick={join} className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-[#05131d] disabled:opacity-40">{joining ? "Joining…" : "JOIN TRIVIA"}</button>
            </>
          ) : mustRescan ? (
            <div className="py-3 text-center">
              <h1 className="mt-3 text-4xl font-black">Still playing?</h1>
              <p className="mt-3 text-sm leading-7 text-white/68">Your name and score are saved. Scan the TV again to renew your seat for another hour.</p>
              {!hasCurrentQr ? <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">Scan the current TV QR code.</div> : null}
              <button type="button" disabled={!hasCurrentQr || joining} onClick={continuePlaying} className="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-[#05131d] disabled:opacity-40">{joining ? "Renewing…" : "KEEP MY PLACE"}</button>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div><div className="text-xs uppercase tracking-[0.18em] text-white/45">Playing as</div><div className="text-xl font-black">{payload?.player.name ?? storedPlayer.name}</div></div>
                <div className="text-right"><div className="text-xs uppercase tracking-[0.18em] text-white/45">Score</div><div className="text-2xl font-black text-cyan-100">{(payload?.player.rollingScore ?? 0).toLocaleString()}</div></div>
              </div>

              {payload?.waitingForMatch ? <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.04] p-6 text-center"><div className="text-2xl font-black">You're in.</div><p className="mt-3 text-sm text-white/60">Watch the TV. The next game will begin here automatically.</p></div> : null}

              {game?.phase === "wager-open" ? (
                <div className="mt-6 rounded-[26px] border border-amber-300/25 bg-amber-300/10 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-100/70">Final wager</div>
                  {game.wagerState.hasSubmitted ? <div className="mt-4 text-2xl font-black">Wager locked: {(game.wagerState.wager ?? 0).toLocaleString()}</div> : <>
                    <p className="mt-3 text-sm text-white/65">Risk up to {game.wagerState.maxWager.toLocaleString()} points.</p>
                    <input type="number" min={0} max={game.wagerState.maxWager} value={wager} onChange={(event) => setWager(event.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-2xl font-black outline-none" placeholder="0" />
                    <button type="button" onClick={() => sendAction("wager", wager || 0)} className="mt-4 w-full rounded-2xl bg-amber-300 px-5 py-4 font-black text-[#1b1203]">LOCK WAGER</button>
                  </>}
                </div>
              ) : game?.phase === "answer-reveal" && game.resolution ? (
                <div className={game.resolution.outcome === "correct" ? "mt-6 rounded-[26px] border border-emerald-300/25 bg-emerald-300/10 p-6 text-center" : "mt-6 rounded-[26px] border border-white/10 bg-white/5 p-6 text-center"}>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Correct answer</div>
                  <div className="mt-3 text-3xl font-black">{game.resolution.correctText}</div>
                  <div className="mt-4 text-xl font-black">{game.resolution.outcome === "correct" ? `Correct! +${game.resolution.delta ?? 0}` : game.resolution.outcome === "wrong" ? "Not this one." : "Time's up."}</div>
                </div>
              ) : game?.phase === "question-open" && game.currentCard ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between"><div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/60">{game.currentCard.roundLabel}</div><div className={secondsLeft !== null && secondsLeft <= 5 ? "text-4xl font-black text-amber-200" : "text-4xl font-black text-cyan-100"}>{secondsLeft}</div></div>
                  <h1 className="mt-4 text-3xl font-black leading-tight">{game.currentCard.prompt}</h1>
                  {game.answerState.hasSubmitted ? <div className="mt-6 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-5 text-center"><div className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100/70">Answer locked</div><div className="mt-2 text-2xl font-black">{game.answerState.response}</div><p className="mt-3 text-sm text-white/55">Watch the TV for the reveal.</p></div> : <div className="mt-5 grid gap-3">{game.currentCard.choices.map((choice) => <button key={choice.slot} type="button" disabled={secondsLeft === 0} onClick={() => sendAction("answer", choice.slot)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left disabled:opacity-40"><div className="text-xs font-black text-cyan-200/70">{choice.slot}</div><div className="mt-1 text-lg font-black">{choice.text}</div></button>)}</div>}
                </div>
              ) : game?.status === "completed" ? <div className="mt-6 rounded-[26px] border border-emerald-300/20 bg-emerald-300/10 p-6 text-center"><div className="text-3xl font-black">Game complete.</div><p className="mt-3 text-sm text-white/60">Stay here. Your venue seat remains active for the next game.</p></div> : game ? <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.04] p-6 text-center"><div className="text-2xl font-black">Get ready…</div><p className="mt-2 text-sm text-white/55">Watch the TV for the next question.</p></div> : null}
            </>
          )}

          {message ? <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/80">{message}</div> : null}
          <p className="mt-6 text-xs leading-6 text-white/45">Venue access lasts about one hour. When it expires, scan the TV again. Your name and score remain saved.</p>
        </div>
      </main>
    </GameAtmosphere>
  );
}
