"use client";

import { useState } from "react";

export type GameRulesGuideProps = {
  gameName: string;
  goal: string;
  turns: string[];
  scoring: string[];
  ending: string;
  example?: string;
  className?: string;
};

export function GameRulesGuide({gameName,goal,turns,scoring,ending,example,className=""}:GameRulesGuideProps){
  const [open,setOpen]=useState(false);
  return <>
    <button type="button" onClick={()=>setOpen(true)} className={`rounded-xl border border-white/15 bg-white/[.04] px-3 py-2 text-xs font-black uppercase tracking-widest text-white/75 ${className}`}>? Rules</button>
    {open&&<div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={`${gameName} rules`} onClick={()=>setOpen(false)}>
      <div className="max-h-[88%] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/15 bg-slate-950 p-6 text-left shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.22em] text-cyan-200">How to play</div><h2 className="mt-1 text-3xl font-black text-white">{gameName}</h2></div><button type="button" onClick={()=>setOpen(false)} className="min-h-11 min-w-11 rounded-full border border-white/15 text-xl font-black text-white" aria-label="Close rules">×</button></div>
        <Rule title="Goal"><p>{goal}</p></Rule>
        <Rule title="How a turn works"><ol className="list-decimal space-y-2 pl-5">{turns.map((x,i)=><li key={i}>{x}</li>)}</ol></Rule>
        <Rule title="Scoring"><ul className="list-disc space-y-2 pl-5">{scoring.map((x,i)=><li key={i}>{x}</li>)}</ul></Rule>
        <Rule title="How it ends"><p>{ending}</p></Rule>
        {example&&<Rule title="Example"><p>{example}</p></Rule>}
        <button type="button" onClick={()=>setOpen(false)} className="mt-6 w-full rounded-2xl bg-cyan-300 px-4 py-4 font-black text-slate-950">GOT IT — LET'S PLAY</button>
      </div>
    </div>}
  </>;
}

function Rule({title,children}:{title:string;children:React.ReactNode}){return <section className="mt-5"><h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3><div className="mt-2 text-sm leading-6 text-white/65">{children}</div></section>}
