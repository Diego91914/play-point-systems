"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { GameAtmosphere } from "../../../_components/GameAtmosphere";

export default function TriviaVenueOperatorPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [operatorKey, setOperatorKey] = useState("");
  const [displayKey, setDisplayKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  async function startVenue() {
    setStarting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/operator/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorKey }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to start venue trivia.");
      setMessage(payload.alreadyOpen ? "Venue Trivia is already running." : "Venue Trivia is running.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start venue trivia.");
    } finally {
      setStarting(false);
    }
  }

  function openTv() {
    if (!displayKey.trim()) {
      setMessage("Enter the venue display key first.");
      return;
    }
    window.open(`/games/trivia/venue/${encodeURIComponent(slug)}/tv?key=${encodeURIComponent(displayKey.trim())}`, "_blank", "noopener,noreferrer");
  }

  return (
    <GameAtmosphere variant="trivia">
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 text-white">
        <div className="rounded-[36px] border border-white/10 bg-black/30 p-7 shadow-2xl backdrop-blur sm:p-9">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/70">Play Amplified Trivia · Venue Operator</div>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Start the room. Put it on TV.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">This screen is for venue staff. Start the long-running venue session once, then open the television display. Customers join from the rotating QR code.</p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">1 · Start Venue Trivia</div>
              <label className="mt-5 block text-sm font-bold" htmlFor="operator-key">Operator key</label>
              <input id="operator-key" type="password" value={operatorKey} onChange={(event) => setOperatorKey(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-4 outline-none focus:border-cyan-300/50" placeholder="Venue operator key" />
              <button type="button" disabled={!operatorKey.trim() || starting} onClick={startVenue} className="mt-4 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-black text-[#05131d] disabled:opacity-40">{starting ? "Starting…" : "START VENUE TRIVIA"}</button>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">2 · Open TV Display</div>
              <label className="mt-5 block text-sm font-bold" htmlFor="display-key">Display key</label>
              <input id="display-key" type="password" value={displayKey} onChange={(event) => setDisplayKey(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-4 outline-none focus:border-cyan-300/50" placeholder="Venue display key" />
              <button type="button" onClick={openTv} className="mt-4 w-full rounded-2xl border border-cyan-200/35 bg-cyan-300/10 px-5 py-4 font-black text-cyan-50">OPEN TV MODE</button>
            </div>
          </div>

          {message ? <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/80">{message}</div> : null}

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/60">
            Players scan once and remain authorized for about one hour. Missing three consecutive questions removes them from the active leaderboard without deleting their score. When presence expires, scanning the TV again renews the same player for another hour.
          </div>
        </div>
      </main>
    </GameAtmosphere>
  );
}
