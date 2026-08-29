"use client";

import { useState, type ReactNode } from "react";

export type GameRulesGuideProps = {
  gameName: string;
  goal: string;
  setup?: readonly string[];
  turns: readonly string[];
  scoring: readonly string[];
  ending: string;
  example?: string;
  className?: string;
};

export function GameRulesGuide({ gameName, goal, setup, turns, scoring, ending, example, className = "" }: GameRulesGuideProps) {
  const [open, setOpen] = useState(false);
  let number = 1;
  const nextNumber = () => String(number++).padStart(2, "0");

  return <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`min-h-11 rounded-2xl border border-amber-200/20 bg-[linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))] px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-white/78 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-amber-200/35 hover:text-white ${className}`}
    >
      ? How to Play
    </button>

    {open && <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${gameName} rules`}
      onClick={() => setOpen(false)}
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[34px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_left,rgba(213,174,95,.14),transparent_34%),linear-gradient(160deg,#111318,#050608_72%)] p-5 text-left shadow-[0_30px_120px_rgba(0,0,0,.72)] sm:rounded-[34px] sm:p-7"
        onClick={e => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-300/[.05] blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.26em] text-amber-100/60">Play Point Games · Rules guide</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{gameName}</h2>
            <p className="mt-2 text-xs leading-5 text-white/45">Setup, turn flow, scoring, and how to win — all in one place.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="min-h-11 min-w-11 shrink-0 rounded-full border border-white/15 bg-white/[.04] text-xl font-black text-white transition hover:bg-white/[.09]" aria-label="Close rules">×</button>
        </div>

        <div className="relative">
          <Rule number={nextNumber()} title="The goal"><p>{goal}</p></Rule>
          {setup && setup.length > 0 && <Rule number={nextNumber()} title="Before you start"><ul className="list-disc space-y-2.5 pl-5">{setup.map((x, i) => <li key={i}>{x}</li>)}</ul></Rule>}
          <Rule number={nextNumber()} title="How play works"><ol className="list-decimal space-y-2.5 pl-5">{turns.map((x, i) => <li key={i}>{x}</li>)}</ol></Rule>
          <Rule number={nextNumber()} title="Scoring"><ul className="list-disc space-y-2.5 pl-5">{scoring.map((x, i) => <li key={i}>{x}</li>)}</ul></Rule>
          <Rule number={nextNumber()} title="How to win"><p>{ending}</p></Rule>
          {example && <Rule number={nextNumber()} title="Example"><p>{example}</p></Rule>}
        </div>

        <button type="button" onClick={() => setOpen(false)} className="relative mt-7 min-h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#f5d58a,#d5ae5f)] px-4 py-4 font-black text-slate-950 shadow-[0_14px_38px_rgba(213,174,95,.18)] transition hover:brightness-105 active:scale-[.99]">GOT IT — LET'S PLAY</button>
      </div>
    </div>}
  </>;
}

function Rule({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <section className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4 sm:p-5">
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/[.07] text-[9px] font-black text-cyan-100/70">{number}</span>
      <h3 className="text-sm font-black uppercase tracking-[.12em] text-white">{title}</h3>
    </div>
    <div className="mt-3 text-sm leading-6 text-white/65">{children}</div>
  </section>;
}
