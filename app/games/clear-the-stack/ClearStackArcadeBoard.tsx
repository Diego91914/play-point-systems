"use client";
import { useEffect, useState } from "react";

type Entry = { id: number; name: string; score: number; playedAt: string; accountLinked: boolean };
type Scope = "global" | "host" | "personal";
type Period = "daily" | "weekly" | "all";
export function ClearStackArcadeBoard({distance,stackSize,allowAccountViews,refreshKey=0}:{
 distance:number;stackSize:number;allowAccountViews:boolean;refreshKey?:number;
}) {
 const [scope,setScope]=useState<Scope>("global");
 const [period,setPeriod]=useState<Period>("daily");
 const queryKey=JSON.stringify([distance,stackSize,scope,period,refreshKey]);
 const [result,setResult]=useState<{key:string;entries:Entry[];state:"ready"|"error"}|null>(null);
 const state=result?.key===queryKey?result.state:"loading";
 const entries=result?.key===queryKey?result.entries:[];
 useEffect(()=>{
  let cancelled=false;
  const params=new URLSearchParams({distance:String(distance),stackSize:String(stackSize),scope,period});
  void fetch("/api/games/clear-the-stack/leaderboard?"+params,{cache:"no-store"})
   .then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.error||"Leaderboard unavailable");return body;})
   .then(body=>{if(!cancelled){setResult({key:queryKey,entries:body.entries||[],state:"ready"});}})
   .catch(()=>{if(!cancelled)setResult({key:queryKey,entries:[],state:"error"});});
  return ()=>{cancelled=true;};
 },[distance,stackSize,scope,period,queryKey]);
 return <section className="mt-6 rounded-[28px] border border-cyan-200/15 bg-white/[.045] p-5 text-white sm:p-7" aria-label="Clear the Stack arcade high scores">
  <p className="text-center text-[10px] font-black uppercase tracking-[.23em] text-cyan-200/60">Play Amplified Arcade</p>
  <h2 className="mt-2 text-center text-2xl font-black">HIGH SCORES</h2>
  <p className="mt-1 text-center text-xs text-white/50">{distance} FT · {stackSize} DISCS</p>
  <div className="mt-5 grid grid-cols-3 gap-2">
   {(["global","host","personal"] as const).map(item=><button key={item} type="button"
    disabled={!allowAccountViews && item!=="global"}
    onClick={()=>setScope(item)}
    className={`min-h-11 rounded-xl border px-2 text-xs font-black ${scope===item?"border-cyan-200/40 bg-cyan-300/15 text-cyan-50":"border-white/10 bg-black/20 text-white/55"} disabled:opacity-40`}>{item==="global"?"GLOBAL":item==="host"?"MY HOST BOARD":"MY RECORDS"}</button>)}
  </div>
  {scope==="global" ? <div className="mt-3 grid grid-cols-3 gap-2">
    {(["daily","weekly","all"] as const).map(item=><button key={item} type="button" onClick={()=>setPeriod(item)}
    className={`min-h-10 rounded-lg border text-xs font-bold ${period===item?"border-white/30 bg-white/15 text-white":"border-white/10 text-white/55"}`}>{item==="all"?"ALL TIME":item.toUpperCase()}</button>)}
  </div>:null}
  <p className="mt-3 text-center text-[11px] text-white/40">{scope==="global"?"Daily and weekly periods reset at midnight UTC.":"Only scores recorded through your signed-in host account."}</p>
  <div className="mt-4 grid gap-2" aria-live="polite">
   {state==="loading"?<p className="p-4 text-center text-sm text-white/55">Loading high scores…</p>:
    state==="error"?<p className="p-4 text-center text-sm text-rose-200">Could not load the scoreboard. Reopen to try again.</p>:
    entries.length===0?<p className="p-4 text-center text-sm text-white/55">No scores yet at this distance and disc count. Be the first!</p>:
    entries.map((entry,i)=><div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="min-w-0"><p className="truncate font-black"><span className="mr-3 text-cyan-100/60">#{i+1}</span>{entry.name}</p>
      <p className="text-[10px] text-white/40">{entry.accountLinked?"Account-linked solo score":"Host-recorded score"} · {new Date(entry.playedAt).toLocaleDateString()}</p></div>
      <span className="shrink-0 text-xl font-black tabular-nums">{entry.score} <span className="text-xs text-white/40">PTS</span></span>
     </div>)}
  </div>
 </section>;
}
