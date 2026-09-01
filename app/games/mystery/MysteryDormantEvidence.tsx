"use client";

import { useCallback, useEffect, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type Evidence = {
  available: boolean;
  id?: string;
  title?: string;
  reminder?: string;
  status?: string;
  decisionText?: string | null;
  choices?: { id: string; label: string; primary?: boolean }[];
  rule?: string;
};

const KEY = "pps-mystery-session";

export function MysteryDormantEvidence() {
  const [session, setSession] = useState<Session | null>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissedId, setDismissedId] = useState("");

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

  async function decide(decision: string) {
    if (!session || !evidence?.id) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/games/mystery/${session.code}/dormant-evidence`, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: session.playerId, token: session.token, evidenceId: evidence.id, decision }),
      });
      const json = await response.json();
      if (response.ok) setEvidence(json.evidence);
    } finally {
      setBusy(false);
    }
  }

  if (!evidence?.available || (evidence.id && dismissedId === evidence.id)) return null;
  const awaitingDecision = evidence.status === "available";

  return (
    <div className="fixed inset-0 z-[65] overflow-y-auto bg-slate-950/90 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-xl rounded-[32px] border border-amber-200/25 bg-slate-950 p-7 shadow-2xl">
        <div className="text-xs font-black uppercase tracking-[.24em] text-amber-200">Private discovery · only your phone</div>
        <h2 className="mt-3 text-4xl font-black text-white">{evidence.title}</h2>
        <p className="mt-4 text-base leading-7 text-white/70">{evidence.reminder}</p>

        {awaitingDecision && <>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm leading-6 text-white/50">Nobody else is automatically told about this. What you do next becomes part of your private investigation path.</div>
          <div className="mt-5 space-y-3">
            {(evidence.choices ?? []).map(choice => (
              <button key={choice.id} disabled={busy} onClick={() => decide(choice.id)} className={`w-full rounded-2xl px-5 py-4 font-black disabled:opacity-40 ${choice.primary ? "bg-amber-200 text-slate-950" : "border border-white/15 text-white"}`}>{choice.label}</button>
            ))}
          </div>
        </>}

        {!awaitingDecision && evidence.decisionText && <div className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-200/[.07] p-5"><div className="text-[10px] font-black uppercase tracking-widest text-amber-100">What you now know</div><p className="mt-3 text-base leading-7 text-white/80">{evidence.decisionText}</p></div>}

        {!awaitingDecision && <button onClick={() => setDismissedId(evidence.id ?? "dismissed")} className="mt-5 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white">RETURN TO THE INVESTIGATION</button>}
        <p className="mt-4 text-xs leading-5 text-white/35">{evidence.rule}</p>
      </div>
    </div>
  );
}
