"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GameAtmosphere } from "../../../../_components/GameAtmosphere";

type CatalogCategory = { category: string; label: string; isPlayable: boolean };
type OperatorPlayer = {
  id: string;
  name: string;
  rollingScore: number;
  scoreTotal: number;
  hourlyScore: number;
  consecutiveQuestionsMissed: number;
  presenceExpired: boolean;
  removed: boolean;
};
type OperatorState = {
  session: null | { id: string; status: string; currentTriviaSessionId: string | null; startedAt: string };
  players: OperatorPlayer[];
};

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
  const [operatorState, setOperatorState] = useState<OperatorState | null>(null);
  const [controlBusy, setControlBusy] = useState<string | null>(null);

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

  async function loadOperatorState() {
    if (!operatorKey.trim()) return;
    try {
      const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/operator/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorKey }),
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load venue status.");
      setOperatorState(payload);
    } catch {
      // Keep setup usable while the operator is still entering credentials.
    }
  }

  useEffect(() => {
    if (!operatorKey.trim()) return;
    void loadOperatorState();
    const handle = window.setInterval(loadOperatorState, 3000);
    return () => window.clearInterval(handle);
  }, [operatorKey, slug]);

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
      await loadOperatorState();
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
      await loadOperatorState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start a live trivia game.");
    } finally {
      setStartingMatch(false);
    }
  }

  async function control(action: string, playerId?: string) {
    const busyKey = playerId ? `${action}:${playerId}` : action;
    setControlBusy(busyKey);
    setMessage(null);
    try {
      const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/operator/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorKey, action, playerId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Venue control failed.");
      const labels: Record<string, string> = {
        pause: "Venue Trivia paused.",
        resume: "Venue Trivia resumed.",
        "skip-question": "Question skipped.",
        "end-session": "Tonight's Venue Trivia session ended.",
        "remove-player": "Player removed from Venue Trivia.",
        "hide-nickname": "Nickname hidden on public screens.",
      };
      setMessage(labels[action] ?? "Venue updated.");
      await loadOperatorState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Venue control failed.");
    } finally {
      setControlBusy(null);
    }
  }

  function openTv() {
    if (!displayKey.trim()) {
      setMessage("Enter the venue display key first.");
      return;
    }
    window.open(`/games/trivia/venue/${encodeURIComponent(slug)}/tv?key=${encodeURIComponent(displayKey.trim())}`, "_blank", "noopener,noreferrer");
  }

  const sessionStatus = operatorState?.session?.status ?? null;
  const visiblePlayers = operatorState?.players?.filter((player) => !player.removed) ?? [];

  return (
    <GameAtmosphere variant="trivia">
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-10 text-white">
        <div className="rounded-[36px] border border-white/10 bg-black/30 p-7 shadow-2xl backdrop-blur sm:p-9">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/70">Play Amplified Trivia · Venue Operator</div>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Start the room. Put it on TV. Let it run.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68">Venue Mode separates the long-running restaurant room from each trivia game. Guests keep their venue identity while staff can run, pause, moderate, and end the night from here.</p>

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
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl border border-white/12 bg-[#07101c] px-3 py-3 text-sm text-white"><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="expert">Expert</option></select>
                <select value={pace} onChange={(event) => setPace(event.target.value)} className="rounded-2xl border border-white/12 bg-[#07101c] px-3 py-3 text-sm text-white"><option value="relaxed">Relaxed</option><option value="standard">Standard</option></select>
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

          {operatorState?.session ? (
            <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Live controls</div>
                  <div className="mt-2 text-2xl font-black">Status: {sessionStatus === "paused" ? "Paused" : "Running"}</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sessionStatus === "paused" ? (
                    <button type="button" disabled={Boolean(controlBusy)} onClick={() => control("resume")} className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-[#062016]">RESUME</button>
                  ) : (
                    <button type="button" disabled={Boolean(controlBusy)} onClick={() => control("pause")} className="rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100">PAUSE</button>
                  )}
                  <button type="button" disabled={Boolean(controlBusy) || sessionStatus === "paused"} onClick={() => control("skip-question")} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black">SKIP QUESTION</button>
                  <button type="button" disabled={Boolean(controlBusy)} onClick={() => { if (window.confirm("End Venue Trivia for tonight? Players will no longer be able to continue in this session.")) void control("end-session"); }} className="rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-black text-red-100">END TONIGHT</button>
                </div>
              </div>
            </section>
          ) : null}

          {visiblePlayers.length ? (
            <section className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Players & moderation</div>
              <div className="mt-4 grid gap-3">
                {visiblePlayers.map((player) => (
                  <div key={player.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                    <div>
                      <div className="text-lg font-black">{player.name}</div>
                      <div className="mt-1 text-xs text-white/45">This hour {player.hourlyScore.toLocaleString()} · Tonight {player.scoreTotal.toLocaleString()} · {player.presenceExpired ? "Presence expired" : player.consecutiveQuestionsMissed >= 3 ? "Idle" : "Active"}</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" disabled={Boolean(controlBusy)} onClick={() => control("hide-nickname", player.id)} className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black">HIDE NAME</button>
                      <button type="button" disabled={Boolean(controlBusy)} onClick={() => { if (window.confirm(`Remove ${player.name} from Venue Trivia?`)) void control("remove-player", player.id); }} className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100">REMOVE</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {message ? <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/80">{message}</div> : null}

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/60">
            Players remain authorized for about one hour. Missing three consecutive questions hides them from the active leaderboard without deleting their score. Scanning the TV again renews the same player instead of creating a new one.
          </div>
        </div>
      </main>
    </GameAtmosphere>
  );
}
