"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type Option = { id: string; label: string };
type Lead = { id: string; title: string; text: string; source: "private-clue" | "personal-discovery" | "suspicious" };
type CaseState = {
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  players: { id: string; name: string }[];
  myRoleId: string | null;
  isMurderer: boolean;
  privateRule: string;
  privateLeads: Lead[];
  options: { motives: Option[]; locations: Option[]; windows: Option[] };
  submittedCount: number;
  playerCount: number;
  mySubmission: null | { locked: true; score?: number; convicted?: boolean };
  reveal: null | {
    murderer: { id: string; name: string };
    winner: null | { playerId: string; name: string; score: number; convicted: boolean; supportCorrect: number };
    murdererWins: boolean;
    standings: { playerId: string; name: string; isMurderer: boolean; score: number; convicted: boolean; supportCorrect: number }[];
    solution: string;
  };
};

const KEY = "pps-mystery-session";

export function MysteryCaseLayer() {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<CaseState | null>(null);
  const [openLeads, setOpenLeads] = useState(false);
  const [suspectId, setSuspectId] = useState("");
  const [motiveId, setMotiveId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [windowId, setWindowId] = useState("");
  const [supportIds, setSupportIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`/api/games/mystery/${session.code}/case?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
      const json = await response.json();
      if (response.ok) setState(json.state);
    } catch {}
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [refresh, session]);

  const selectedLeads = useMemo(() => state?.privateLeads.filter(lead => supportIds.includes(lead.id)) ?? [], [state, supportIds]);

  function toggleSupport(id: string) {
    setSupportIds(current => current.includes(id) ? current.filter(item => item !== id) : current.length >= 4 ? current : [...current, id]);
  }

  async function submitCase() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/games/mystery/${session.code}/case`, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          playerId: session.playerId,
          token: session.token,
          payload: { suspectId, motiveId, locationId, windowId, supportIds },
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to lock your case.");
      setState(json.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to lock your case.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null;

  if (state.status !== "accusation" && state.status !== "reveal") {
    if (!state.privateLeads.length) return null;
    return (
      <div className="fixed bottom-5 left-5 z-40 max-w-sm">
        {openLeads && (
          <div className="mb-3 max-h-[60vh] overflow-y-auto rounded-3xl border border-cyan-300/25 bg-slate-950/95 p-5 shadow-2xl backdrop-blur">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Your path · private</div>
            <p className="mt-2 text-xs leading-5 text-white/45">Do not show this screen unless you choose to. These are leads your phone gave you because of your role or the questions you personally pursued.</p>
            <div className="mt-4 space-y-3">
              {state.privateLeads.map(lead => (
                <div key={lead.id} className={`rounded-2xl border p-4 ${lead.source === "suspicious" ? "border-rose-300/20 bg-rose-300/[.06]" : "border-cyan-300/15 bg-cyan-300/[.05]"}`}>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/40">{lead.source.replace("-", " ")}</div>
                  <div className="mt-1 text-sm font-black text-white">{lead.title}</div>
                  <p className="mt-2 text-xs leading-5 text-white/60">{lead.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => setOpenLeads(value => !value)} className="rounded-full border border-cyan-300/25 bg-slate-950/95 px-5 py-3 text-xs font-black uppercase tracking-widest text-cyan-100 shadow-xl">
          {openLeads ? "Close private leads" : `Private leads · ${state.privateLeads.length}`}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/95 px-4 py-8 backdrop-blur-sm sm:px-8">
      <div className="mx-auto max-w-3xl">
        {state.status === "accusation" && (
          <>
            <div className="text-xs font-black uppercase tracking-[.24em] text-amber-200">Final phase · Build your case</div>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">A guess is not a conviction.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">Everyone investigates the same murder, but your phone only lets you support the final case with leads that reached <b className="text-white">your</b> private path. Highest-scoring case that clears the conviction standard wins.</p>
            {state.isMurderer && <div className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-300/[.08] p-4 text-sm leading-6 text-rose-100"><b>Your objective is different.</b> Submit a cover theory like everyone else. Your score cannot win the investigation; you win if nobody else builds enough of the truth to convict you.</div>}

            {state.mySubmission ? (
              <section className="mt-7 rounded-[28px] border border-emerald-300/20 bg-emerald-300/[.06] p-7 text-center">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-200">Case locked</div>
                <div className="mt-3 text-3xl font-black text-white">No changing your theory now.</div>
                <p className="mt-3 text-sm text-white/50">{state.submittedCount}/{state.playerCount} cases submitted. The phones will reveal the strongest case when everyone is finished.</p>
              </section>
            ) : (
              <div className="mt-7 space-y-6">
                <CaseChoice title="1 · Who committed the murder?" options={state.players.map(player => ({ id: player.id, label: player.name }))} value={suspectId} onChange={setSuspectId} />
                <CaseChoice title="2 · Why?" options={state.options.motives} value={motiveId} onChange={setMotiveId} />
                <CaseChoice title="3 · Where did the fatal confrontation happen?" options={state.options.locations} value={locationId} onChange={setLocationId} />
                <CaseChoice title="4 · When did it happen?" options={state.options.windows} value={windowId} onChange={setWindowId} />

                <section className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/[.045] p-6">
                  <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">5 · Prove it from your path</div>
                  <h3 className="mt-2 text-2xl font-black text-white">Choose 2–4 private leads.</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">These are not the room's generic evidence cards. They are connections your phone gave you because of what <b className="text-white">you</b> knew or investigated. Some may still be red herrings.</p>
                  <div className="mt-4 space-y-2">
                    {state.privateLeads.length ? state.privateLeads.map(lead => {
                      const selected = supportIds.includes(lead.id);
                      return <button key={lead.id} onClick={() => toggleSupport(lead.id)} className={`w-full rounded-2xl border p-4 text-left ${selected ? "border-cyan-200/55 bg-cyan-200/12" : "border-white/10 bg-black/20"}`}><div className="text-sm font-black text-white">{selected ? "✓ " : ""}{lead.title}</div><p className="mt-1 text-xs leading-5 text-white/50">{lead.text}</p></button>;
                    }) : <div className="rounded-2xl border border-amber-200/20 bg-amber-200/[.05] p-4 text-sm leading-6 text-amber-100">You did not develop enough private leads yet. The case can only use facts your path actually uncovered.</div>}
                  </div>
                  {selectedLeads.length > 0 && <p className="mt-3 text-xs text-white/40">Selected {selectedLeads.length}/4</p>}
                </section>

                <button disabled={busy || !suspectId || !motiveId || !locationId || !windowId || supportIds.length < 2} onClick={submitCase} className="w-full rounded-2xl bg-amber-200 px-5 py-5 text-lg font-black text-slate-950 disabled:opacity-35">LOCK MY CASE</button>
                <p className="text-center text-xs leading-5 text-white/35">Conviction requires more than the correct name. Your theory must clear the hidden evidence standard, including enough correct supporting links.</p>
                {error && <p className="text-center text-sm text-rose-200">{error}</p>}
              </div>
            )}
          </>
        )}

        {state.status === "reveal" && state.reveal && (
          <>
            <div className="text-xs font-black uppercase tracking-[.24em] text-rose-200">Verdict</div>
            <h2 className="mt-3 text-5xl font-black text-white">{state.reveal.murdererWins ? "The case collapses." : "Conviction."}</h2>
            <p className="mt-3 text-xl font-black text-rose-100">The Old Friend was {state.reveal.murderer.name}.</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">{state.reveal.solution}</p>

            <section className="mt-7 rounded-[28px] border border-white/10 bg-white/[.035] p-6">
              {state.reveal.winner ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[.06] p-5"><div className="text-xs font-black uppercase tracking-widest text-emerald-200">Best convicting case</div><div className="mt-2 text-3xl font-black text-white">🏆 {state.reveal.winner.name} · {state.reveal.winner.score}/12</div><p className="mt-2 text-sm text-white/55">Correctly assembled enough independent facts to clear the conviction threshold.</p></div> : <div className="rounded-2xl border border-rose-300/25 bg-rose-300/[.07] p-5"><div className="text-xs font-black uppercase tracking-widest text-rose-200">Murderer wins</div><div className="mt-2 text-3xl font-black text-white">Nobody proved the case.</div><p className="mt-2 text-sm text-white/55">Someone may have suspected the right person, but no investigator assembled enough correct facts for a conviction.</p></div>}

              <div className="mt-5 space-y-2">
                {state.reveal.standings.map(row => <div key={row.playerId} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"><div><div className="font-black text-white">{row.name}{row.isMurderer ? " · Murderer" : ""}</div><div className={`mt-1 text-xs font-black uppercase tracking-widest ${row.convicted ? "text-emerald-200" : "text-white/35"}`}>{row.isMurderer ? "Defense" : row.convicted ? "Conviction" : "Insufficient case"}</div></div><div className="text-xl font-black text-white">{row.score}/12</div></div>)}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function CaseChoice({ title, options, value, onChange }: { title: string; options: Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-6">
      <h3 className="text-xl font-black text-white">{title}</h3>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map(option => <button key={option.id} onClick={() => onChange(option.id)} className={`rounded-2xl border px-4 py-4 text-left text-sm font-bold ${value === option.id ? "border-amber-200/50 bg-amber-200/10 text-white" : "border-white/10 bg-black/20 text-white/65"}`}>{option.label}</button>)}
      </div>
    </section>
  );
}
