"use client";

import { useMemo, useState } from "react";

type Phase = "setup" | "playing" | "finished";
type Player = { name: string; score: number; remaining: number; rounds: number[] };

const DISTANCES = [10, 15, 20, 25, 30];
const STACKS = [5, 10, 15, 20];
const ROUND_VALUES = [2, 1, 0.5] as const;

export function ClearTheStackClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [distance, setDistance] = useState(20);
  const [stackSize, setStackSize] = useState(10);
  const [playerCount, setPlayerCount] = useState(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [turn, setTurn] = useState(0);

  const current = players[turn];
  const roundValue = ROUND_VALUES[round] ?? 0;
  const maxScore = stackSize * 2;
  const leader = useMemo(() => [...players].sort((a,b) => b.score-a.score)[0], [players]);

  function start() {
    const count = Math.max(1, Math.min(8, playerCount));
    setPlayers(Array.from({ length: count }, (_, i) => ({
      name: count === 1 ? "You" : `Player ${i + 1}`,
      score: 0,
      remaining: stackSize,
      rounds: [],
    })));
    setRound(0);
    setTurn(0);
    setPhase("playing");
  }

  function recordMakes(makes: number) {
    if (!current) return;
    const safeMakes = Math.max(0, Math.min(current.remaining, makes));
    const next = players.map((p, i) => i === turn ? {
      ...p,
      score: p.score + safeMakes * roundValue,
      remaining: p.remaining - safeMakes,
      rounds: [...p.rounds, safeMakes],
    } : p);
    setPlayers(next);

    const nextActiveTurn = next.findIndex((p, i) => i > turn && p.remaining > 0);
    if (nextActiveTurn >= 0) {
      setTurn(nextActiveTurn);
      return;
    }

    if (round < 2 && next.some(p => p.remaining > 0)) {
      setRound(round + 1);
      const firstActive = next.findIndex(p => p.remaining > 0);
      setTurn(firstActive >= 0 ? firstActive : 0);
      return;
    }

    setPlayers(next.map(p => ({ ...p, score: p.score - p.remaining * 2 })));
    setPhase("finished");
  }

  function reset() {
    setPhase("setup");
    setPlayers([]);
    setRound(0);
    setTurn(0);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-7 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200/60">Backyard & Putting</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">CLEAR THE STACK</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/58 sm:text-base">Three rounds. Clear every disc. Early makes pay more. Anything left costs you.</p>
      </header>

      {phase === "setup" ? (
        <section className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="grid gap-7">
            <Choice label="Putting distance" value={distance} options={DISTANCES} suffix=" FT" onChange={setDistance} />
            <Choice label="Number of discs" value={stackSize} options={STACKS} onChange={setStackSize} />
            <div>
              <label htmlFor="cts-players" className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Players</label>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[1,2,3,4].map(n => <button key={n} type="button" onClick={() => setPlayerCount(n)} className={`min-h-12 rounded-2xl border text-sm font-black ${playerCount === n ? "border-cyan-200/40 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-black/20 text-white/65"}`}>{n === 1 ? "SOLO" : n}</button>)}
              </div>
              <input id="cts-players" aria-label="Custom player count" type="number" min={1} max={8} value={playerCount} onChange={e => setPlayerCount(Math.max(1, Math.min(8, Number(e.target.value) || 1)))} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white outline-none focus:border-cyan-200/50" />
            </div>
          </div>
          <div className="mt-7 grid grid-cols-4 gap-2 text-center text-xs font-black">
            <div className="rounded-xl bg-emerald-300/10 p-3 text-emerald-100">R1<br/>+2</div>
            <div className="rounded-xl bg-cyan-300/10 p-3 text-cyan-100">R2<br/>+1</div>
            <div className="rounded-xl bg-violet-300/10 p-3 text-violet-100">R3<br/>+0.5</div>
            <div className="rounded-xl bg-rose-300/10 p-3 text-rose-100">LEFT<br/>−2</div>
          </div>
          <button type="button" onClick={start} className="mt-7 min-h-14 w-full rounded-2xl bg-cyan-300 px-5 text-base font-black text-slate-950">START STACK</button>
        </section>
      ) : null}

      {phase === "playing" && current ? (
        <section className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">{distance} FT · {stackSize} DISC START</div><div className="mt-1 text-2xl font-black text-white">{current.name}</div></div>
            <div className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-50">ROUND {round + 1} · +{roundValue} EACH</div>
          </div>
          <div className="my-8 text-center">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Discs remaining</div>
            <div className="mt-2 text-8xl font-black tracking-[-0.07em] text-white">{current.remaining}</div>
            <p className="mt-3 text-sm text-white/55">Throw all {current.remaining}. Then tap how many you made.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from({length: current.remaining + 1}, (_, n) => <button key={n} type="button" onClick={() => recordMakes(n)} className="min-h-14 rounded-2xl border border-white/10 bg-black/25 text-lg font-black text-white transition hover:border-cyan-200/30 hover:bg-cyan-300/10">{n}</button>)}
          </div>
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/50">Current score: <span className="font-black text-white">{current.score}</span> · Maximum possible: {maxScore}</div>
        </section>
      ) : null}

      {phase === "finished" ? (
        <section className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="text-center"><div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/60">Stack complete</div><div className="mt-3 text-4xl font-black text-white">{players.length === 1 ? `${players[0]?.score ?? 0} POINTS` : `${leader?.name ?? "Winner"} WINS`}</div><div className="mt-2 text-sm text-white/50">{distance} FT · {stackSize} DISCS</div></div>
          <div className="mt-7 grid gap-3">
            {[...players].sort((a,b) => b.score-a.score).map((p,i) => (
              <div key={p.name} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div><div className="font-black text-white">{players.length > 1 ? `#${i+1} · ` : ""}{p.name}</div><div className="mt-1 text-xs text-white/45">R1 {p.rounds[0] ?? 0} · R2 {p.rounds[1] ?? 0} · R3 {p.rounds[2] ?? 0} · {p.remaining} left</div></div>
                <div className="text-2xl font-black text-white">{p.score}</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={reset} className="mt-7 min-h-14 w-full rounded-2xl bg-cyan-300 px-5 font-black text-slate-950">PLAY AGAIN</button>
        </section>
      ) : null}
    </main>
  );
}

function Choice({ label, value, options, suffix = "", onChange }: { label: string; value: number; options: number[]; suffix?: string; onChange: (n:number) => void }) {
  return <div><div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">{label}</div><div className="mt-3 grid grid-cols-5 gap-2">{options.map(n => <button key={n} type="button" onClick={() => onChange(n)} className={`min-h-12 rounded-2xl border text-sm font-black ${value === n ? "border-cyan-200/40 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-black/20 text-white/65"}`}>{n}{suffix}</button>)}</div><label className="mt-3 block text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Custom<input type="number" min={1} max={100} value={value} onChange={e => onChange(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white outline-none focus:border-cyan-200/50" /></label></div>;
}
