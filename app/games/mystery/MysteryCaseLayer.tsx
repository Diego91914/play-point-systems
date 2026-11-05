"use client";

import { useCallback, useEffect, useState } from "react";
import { useMysterySession } from "./useMysterySession";

type Lead = { id: string; title: string; text: string; source: "private-clue" | "personal-discovery" | "suspicious" };
type CaseState = { status: string; privateLeads: Lead[] };

export function MysteryCaseLayer() {
  const session = useMysterySession();
  const [state, setState] = useState<CaseState | null>(null);
  const [openLeads, setOpenLeads] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`/api/games/mystery/${session.code}/case?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
      if (!response.ok) return;
      const json = await response.json();
      setState(json.state as CaseState);
    } catch {
      // The primary game screen reports connectivity state and continues retrying.
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(refresh, 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh, session]);

  if (!session || !state || state.status === "lobby" || state.status === "accusation" || state.status === "reveal" || !state.privateLeads.length) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-sm">
      {openLeads && <div className="mb-3 max-h-[60vh] overflow-y-auto rounded-3xl border border-cyan-300/25 bg-slate-950/95 p-5 shadow-2xl backdrop-blur">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Your path · private</div>
        <p className="mt-2 text-xs leading-5 text-white/45">These are leads your phone gave you because of your role or the questions you personally pursued. Keep them private unless you choose to share.</p>
        <div className="mt-4 space-y-3">{state.privateLeads.map(lead => <div key={lead.id} className={`rounded-2xl border p-4 ${lead.source === "suspicious" ? "border-rose-300/20 bg-rose-300/[.06]" : "border-cyan-300/15 bg-cyan-300/[.05]"}`}><div className="text-[9px] font-black uppercase tracking-widest text-white/40">{lead.source.replace("-", " ")}</div><div className="mt-1 text-sm font-black text-white">{lead.title}</div><p className="mt-2 text-xs leading-5 text-white/60">{lead.text}</p></div>)}</div>
      </div>}
      <button onClick={() => setOpenLeads(value => !value)} className="rounded-full border border-cyan-300/25 bg-slate-950/95 px-5 py-3 text-xs font-black uppercase tracking-widest text-cyan-100 shadow-xl">{openLeads ? "Close private leads" : `Private leads · ${state.privateLeads.length}`}</button>
    </div>
  );
}
