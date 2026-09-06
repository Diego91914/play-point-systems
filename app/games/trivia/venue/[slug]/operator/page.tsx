"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GameAtmosphere } from "../../../../_components/GameAtmosphere";

type CatalogCategory = { category: string; label: string; isPlayable: boolean };

export default function TriviaVenueOperatorPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [operatorKey, setOperatorKey] = useState("");
  const [displayKey, setDisplayKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startingMatch, setStartingMatch] = useState(false);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [category, setCategory] = useState("bible");
  const [difficulty, setDifficulty] = useState("mixed");
  const [pace, setPace] = useState("relaxed");

  useEffect(() => {
    fetch("/api/trivia/catalog", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const playable = (payload.categories ?? []).filter((item: CatalogCategory) => item.isPlayable);
        setCategories(playable);
        if (playable.length && !playable.some((item: CatalogCategory) => item.category === category)) setCategory(playable[0].category);
      })
      .catch(() => undefined);
  }, []);

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
      setMessage(payload.alreadyOpen ? "Venue session is already running." : "Venue session is running. Now start a live game.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start venue trivia.");
    } finally {
      setStarting(false);
    }
  }

  async function startMatch() {
    setStartingMatch(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/operator/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorKey, category, difficultyFilter: difficulty, pacingMode: pace }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to start a live trivia game.");
      setMessage(payload.started
        ? `Live game started with ${payload.seatedPlayers} active player${payload.seatedPlayers === 1 ? "" : "s"}.`
        : "Game is ready. It will start automatically when the first player joins.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start a live trivia game.");
    } finally {
      setStartingMatch(false);
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
      <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 text-white">
        <div className="rounded-[36px] border border-white/10 bg-black/30 p-7 shadow-2xl backdrop-blur sm:p-9">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/70">Play Amplified Trivia · Venue Operator</div>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Start the room. Put it on TV. Let it run.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68">Venue Mode separates the long-running restaurant room from each trivia game. Guests keep their venue identity while staff can start a fresh category whenever the room is ready.</p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">1 · Open the venue</div>
              <label className="mt-5 block text-sm font-bold" htmlFor="operator-key">Operator key</label>
              <input id="operator-key" type="password" value={operatorKey} onChange={(event) => setOperatorKey(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-4 outline-none focus:border-cyan-300/50" placeholder="Venue operator key" />
              <button type="button" disabled={!operatorKey.trim() || starting} onClick={startVenue} className="mt-4 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-black text-[#05131d] disabled:opacity-40">{starting ? "Starting…" : "START VENUE SESSION"}</button>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">2 · Start a live game</div>
              <label className="mt-5 block text-sm font-bold" htmlFor="venue-category">Category</label>
              <select id="venue-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/12 bg-[#07101c] px-4 py-3 text-white">
                {categories.length ? categories.map((item) => <option key={item.category} value={item.category}>{item.label}</option>) : <option value="bible">Bible Trivia</option>}
              </select>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl border border-white/12 bg-[#07101c] px-3 py-3 text-sm text-white">
                  <option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="expert">Expert</option>
                </select>
                <select value={pace} onChange={(event) => setPace(event.target.value)} className="rounded-2xl border border-white/12 bg-[#07101c] px-3 py-3 text-sm text-white">
                  <option value="relaxed">Relaxed</option><option value="standard">Standard</option>
                </select>
              </div>
              <button type="button" disabled={!operatorKey.trim() || startingMatch} onClick={startMatch} className="mt-4 w-full rounded-2xl border border-emerald-200/30 bg-emerald-300/15 px-5 py-4 font-black text-emerald-50 disabled:opacity-40">{startingMatch ? "Building game…" : "START LIVE GAME"}</button>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">3 · Put it on TV</div>
              <label className="mt-5 block text-sm font-bold" htmlFor="display-key">Display key</label>
              <input id="display-key" type="password" value={displayKey} onChange={(event) => setDisplayKey(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-4 outline-none focus:border-cyan-300/50" placeholder="Venue display key" />
              <button type="button" onClick={openTv} className="mt-4 w-full rounded-2xl border border-cyan-200/35 bg-cyan-300/10 px-5 py-4 font-black text-cyan-50">OPEN TV MODE</button>
              <p className="mt-4 text-xs leading-6 text-white/45">Once open, TV Mode advances timed questions and reveals automatically.</p>
            </div>
          </div>

          {message ? <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/80">{message}</div> : null}

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/60">
            Players remain authorized for about one hour. Missing three consecutive questions hides them from the active leaderboard without deleting their score. Scanning the TV again renews the same player instead of creating a new one.
          </div>
        </div>
      </main>
    </GameAtmosphere>
  );
}
