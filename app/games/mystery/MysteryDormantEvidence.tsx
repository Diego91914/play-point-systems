"use client";

import { useCallback, useEffect, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type Evidence = {
  available: boolean;
  id?: string;
  title?: string;
  reminder?: string;
  status?: "available" | "opened" | "sealed";
  openedText?: string | null;
  sealedText?: string | null;
  rule?: string;
};

const KEY = "pps-mystery-session";

export function MysteryDormantEvidence() {
  const [session, setSession] = useState<Session | null>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`/api/games/mystery/${session.code}/dormant-evidence?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
      const json = await response.json();
      if (response.ok) setEvidence(json.evidence);
    } catch {}
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void refresh();
    const timer = window.setInterval(refresh, 1400);
    return () => window.clearInterval(timer);
  }, [refresh, session]);

  async function decide(decision: "open" | "seal") {
    if (!session) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/games/mystery/${session.code}/dormant-evidence`, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: session.playerId, token: session.token, decision }),
      });
      const json = await response.json();
      if (response.ok) setEvidence(json.evidence);
    } finally {
      setBusy(false);
    }
  }

  if (!evidence?.available || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[65] overflow-y-auto bg-slate-950/90 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-xl rounded-[32px] border border-amber-200/25 bg-slate-950 p-7 shadow-2xl">
        <div className="text-xs font-black uppercase tracking-[.24em] text-amber-200">Private memory · only your phone</div>
        <h2 className="mt-3 text-4xl font-black text-white">{evidence.title}</h2>
        <p className="mt-4 text-base leading-7 text-white/70">{evidence.reminder}</p>

        {evidence.status === "available" && <>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm leading-6 text-white/50">Nobody else has been told the envelope exists. What you do next becomes part of your private investigation path.</div>
          <button disabled={busy} onClick={() => decide("open")} className="mt-5 w-full rounded-2xl bg-amber-200 px-5 py-4 font-black text-slate-950 disabled:opacity-40">OPEN THE LETTER</button>
          <button disabled={busy} onClick={() => decide("seal")} className="mt-3 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white disabled:opacity-40">KEEP IT SEALED</button>
        </>}

        {evidence.status === "opened" && <div className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-200/[.07] p-5"><div className="text-[10px] font-black uppercase tracking-widest text-amber-100">Inside the letter</div><p className="mt-3 text-base leading-7 text-white/80">{evidence.openedText}</p></div>}
        {evidence.status === "sealed" && <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="text-[10px] font-black uppercase tracking-widest text-white/40">Your decision</div><p className="mt-3 text-sm leading-6 text-white/65">{evidence.sealedText}</p></div>}

        {evidence.status !== "available" && <button onClick={() => setDismissed(true)} className="mt-5 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white">RETURN TO THE INVESTIGATION</button>}
        <p className="mt-4 text-xs leading-5 text-white/35">{evidence.rule}</p>
      </div>
    </div>
  );
}
