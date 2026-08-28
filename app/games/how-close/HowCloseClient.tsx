"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoomJoinPanel } from "@/app/games/_components/RoomJoinPanel";

type Player = { id: string; name: string; score: number; seat: number };
type Question = { id: string; category: string; prompt: string; low: string; high: string };
type Game = {
  code: string;
  status: "lobby" | "playing" | "finished";
  hostPlayerId: string;
  players: Player[];
  round: number;
  maxRounds: number;
  answers: Record<string, number>;
  revealed: boolean;
  roundPoints: Record<string, number>;
  roundDistances: Record<string, number>;
  closestPlayerIds: string[];
  message: string;
  currentQuestion: Question | null;
  answeredCount: number;
  spotlight: { id: string; name: string } | null;
  me: { id: string; isHost: boolean };
};
type Session = { code: string; playerId: string; token: string };

const KEY = "pps-how-close-session";

export function HowCloseClient() {
  const [game, setGame] = useState<Game | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [value, setValue] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Something went wrong.");
    return json;
  }, []);

  const store = (nextSession: Session, nextGame: Game) => {
    localStorage.setItem(KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setGame(nextGame);
  };

  useEffect(() => {
    const queryCode = new URLSearchParams(location.search).get("code");
    if (queryCode) setCode(queryCode.toUpperCase());
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const json = await request(
        `/api/games/how-close/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`,
      );
      setGame(json.state);
    } catch {}
  }, [request, session]);

  useEffect(() => {
    if (!session) return;
    refresh();
    const timer = setInterval(refresh, 1200);
    return () => clearInterval(timer);
  }, [session, refresh]);

  async function open(intent: "create" | "join") {
    setBusy(true);
    setError("");
    try {
      const json = await request("/api/games/how-close", {
        method: "POST",
        body: JSON.stringify({ intent, name, code }),
      });
      store({ code: json.code, playerId: json.playerId, token: json.token }, json.state);
      history.replaceState(null, "", `/games/how-close?code=${json.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to join.");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const json = await request(`/api/games/how-close/${session.code}`, {
        method: "POST",
        body: JSON.stringify({ ...session, action, payload }),
      });
      setGame(json.state);
      if (action === "next") setValue(50);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  const answered = !!(session && game?.answers[session.playerId] !== undefined);
  const isSpotlight = !!(session && game?.spotlight?.id === session.playerId);
  const joinUrl = game && typeof window !== "undefined" ? `${window.location.origin}/games/how-close?code=${game.code}` : "";
  const sortedPlayers = useMemo(() => [...(game?.players ?? [])].sort((a, b) => b.score - a.score || a.seat - b.seat), [game?.players]);

  if (!game) {
    return (
      <main className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-xl rounded-[32px] border border-violet-300/20 bg-violet-300/[0.06] p-7">
          <div className="text-xs font-black uppercase tracking-[.24em] text-violet-200">Play Point Family Games</div>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white">How Close Are We?</h1>
          <p className="mt-4 leading-7 text-white/65">
            One person is in the Spotlight. They answer honestly. Everyone else tries to guess their number.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">
            <b className="text-white">Example:</b> “How likely is Alex to send food back if the order is wrong?” Alex picks the real answer. Everyone else guesses Alex.
          </div>
          <input className="mt-7 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-lg text-white" placeholder="Your first name" value={name} onChange={(event) => setName(event.target.value)} />
          <button disabled={busy} onClick={() => open("create")} className="mt-3 w-full rounded-2xl bg-violet-300 px-5 py-4 font-black text-slate-950 disabled:opacity-40">CREATE FAMILY GAME</button>
          <div className="my-5 text-center text-xs font-black uppercase tracking-widest text-white/35">or join a table</div>
          <input className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-center text-xl font-black uppercase tracking-[.3em] text-white" placeholder="ROOM CODE" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
          <button disabled={busy} onClick={() => open("join")} className="mt-3 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white disabled:opacity-40">JOIN GAME</button>
          {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.2em] text-violet-200">How Close Are We?</div>
            <div className="mt-1 text-sm text-white/50">Room <b className="text-white">{game.code}</b></div>
          </div>
          <div className="text-right text-xs text-white/45">{game.status === "lobby" ? "Lobby" : `Round ${Math.min(game.round + 1, game.maxRounds)} of ${game.maxRounds}`}</div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {game.players.map((player) => {
            const spotlight = game.spotlight?.id === player.id && game.status === "playing";
            return (
              <div key={player.id} className={`rounded-2xl border p-3 ${spotlight ? "border-amber-300/40 bg-amber-300/10" : "border-white/10 bg-white/[.03]"}`}>
                <div className="truncate text-sm font-bold text-white">{player.name}{player.id === session?.playerId ? " · You" : ""}</div>
                <div className="mt-1 flex items-end justify-between gap-2"><span className="text-2xl font-black text-violet-100">{player.score}</span>{spotlight && <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">Spotlight</span>}</div>
              </div>
            );
          })}
        </div>

        {game.status === "lobby" && (
          <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.04] p-6">
            <h2 className="text-2xl font-black text-white">Get everyone in</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">Each person joins with a first name. The game will put those names directly into the questions.</p>
            <RoomJoinPanel code={game.code} joinUrl={joinUrl} gameName="How Close Are We?" />
            <div className="mt-4 rounded-2xl bg-black/20 p-4 text-sm leading-6 text-white/60">
              Everyone gets two turns in the Spotlight. On each turn, the Spotlight Player sets the real 1–100 answer. Everybody else tries to get within 10.
            </div>
            {game.me.isHost ? (
              <button disabled={busy || game.players.length < 2} onClick={() => act("start")} className="mt-4 w-full rounded-2xl bg-violet-300 px-4 py-4 font-black text-slate-950 disabled:opacity-40">START GAME</button>
            ) : (
              <p className="mt-4 text-center text-sm text-white/50">Waiting for the host to start…</p>
            )}
          </section>
        )}

        {game.status === "playing" && game.currentQuestion && game.spotlight && (
          <>
            <section className="mt-6 rounded-[30px] border border-violet-300/15 bg-violet-300/[.06] p-6 text-center">
              <div className="text-xs font-black uppercase tracking-[.22em] text-amber-200">{game.spotlight.name} is in the Spotlight</div>
              <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">{game.currentQuestion.prompt}</h2>
              <p className="mt-3 text-sm font-semibold text-violet-100">{isSpotlight ? "Choose your real answer." : `Guess the number ${game.spotlight.name} will choose.`}</p>
            </section>

            {!game.revealed ? (
              <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[.035] p-6">
                {answered ? (
                  <div className="text-center">
                    <div className="text-sm font-black uppercase tracking-widest text-violet-200">Locked in</div>
                    <div className="mt-2 text-5xl font-black text-white">{game.answers[session!.playerId]}</div>
                    <p className="mt-3 text-sm text-white/50">Your number is private. Waiting for {game.players.length - game.answeredCount} more.</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center text-6xl font-black text-white">{value}</div>
                    <input aria-label="Answer from 1 to 100" type="range" min="1" max="100" value={value} onChange={(event) => setValue(Number(event.target.value))} className="mt-6 w-full" />
                    <div className="mt-3 flex justify-between gap-5 text-xs font-bold text-white/45"><span className="max-w-[42%] text-left">1 · {game.currentQuestion.low}</span><span className="max-w-[42%] text-right">100 · {game.currentQuestion.high}</span></div>
                    <button disabled={busy} onClick={() => act("answer", { value })} className="mt-5 w-full rounded-2xl bg-violet-300 px-4 py-4 font-black text-slate-950 disabled:opacity-40">{isSpotlight ? `LOCK MY ANSWER · ${value}` : `LOCK MY GUESS · ${value}`}</button>
                  </>
                )}
              </section>
            ) : (
              <section className="mt-4 rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6">
                <div className="text-center text-xs font-black uppercase tracking-widest text-emerald-100">The real answer</div>
                <div className="mt-2 text-center text-6xl font-black text-white">{game.answers[game.spotlight.id]}</div>
                <div className="mt-1 text-center text-sm font-bold text-white/55">{game.spotlight.name}</div>

                <div className="mt-5 space-y-2">
                  {game.players.filter((player) => player.id !== game.spotlight!.id).sort((a, b) => (game.roundDistances[a.id] ?? 999) - (game.roundDistances[b.id] ?? 999)).map((player) => {
                    const distance = game.roundDistances[player.id] ?? 0;
                    const points = game.roundPoints[player.id] ?? 0;
                    const closest = game.closestPlayerIds.includes(player.id);
                    return (
                      <div key={player.id} className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${closest ? "bg-emerald-200/15" : "bg-black/20"}`}>
                        <div><div className="font-bold text-white">{player.name}{closest ? " · Closest" : ""}</div><div className="text-xs text-white/45">Guessed {game.answers[player.id]} · {distance === 0 ? "Exact match" : `${distance} away`}</div></div>
                        <div className="text-xl font-black text-emerald-100">+{points}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-center text-sm leading-6 text-white/60">
                  Exact = <b className="text-white">3 pts</b> · Within 5 = <b className="text-white">2</b> · Within 10 = <b className="text-white">1</b>
                </div>

                {game.me.isHost ? (
                  <button disabled={busy} onClick={() => act("next")} className="mt-5 w-full rounded-2xl bg-white px-4 py-4 font-black text-slate-950">{game.round + 1 >= game.maxRounds ? "SEE FINAL SCORE" : "NEXT SPOTLIGHT"}</button>
                ) : (
                  <p className="mt-4 text-center text-sm text-white/50">Talk it over while the host moves to the next Spotlight.</p>
                )}
              </section>
            )}
          </>
        )}

        {game.status === "finished" && (
          <section className="mt-6 rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6 text-center">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-100">Final score</div>
            <h2 className="mt-2 text-3xl font-black text-white">{sortedPlayers[0]?.name} knows the table best!</h2>
            <p className="mt-2 text-sm text-white/55">The winner got closest to the people in the room most often.</p>
            <div className="mt-5 space-y-2">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3"><span className="font-bold text-white">{index + 1}. {player.name}</span><span className="text-xl font-black text-emerald-100">{player.score}</span></div>
              ))}
            </div>
            {game.me.isHost && <button onClick={() => act("restart")} className="mt-5 rounded-2xl bg-white px-5 py-3 font-black text-slate-950">PLAY AGAIN</button>}
          </section>
        )}

        {error && <p className="mt-4 text-center text-sm text-rose-200">{error}</p>}
      </div>
    </main>
  );
}
