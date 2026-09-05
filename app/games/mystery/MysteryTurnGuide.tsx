"use client";

import { useCallback, useEffect, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type GameState = { status?: string };

const SESSION_KEY = "pps-mystery-session";
const GUIDE_PREFIX = "pps-mystery-turn-guide:";

export function MysteryTurnGuide() {
  const [session, setSession] = useState<Session | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const check = useCallback(async () => {
    if (!session) return;
    const guideKey = `${GUIDE_PREFIX}${session.code}`;
    try {
      if (localStorage.getItem(guideKey) === "seen") return;
      const response = await fetch(`/api/games/mystery/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
      if (!response.ok) return;
      const json = await response.json();
      const state = json.state as GameState | undefined;
      if (state?.status && state.status !== "lobby") setVisible(true);
    } catch {}
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void check();
    const timer = window.setInterval(check, 900);
    return () => window.clearInterval(timer);
  }, [check, session]);

  function dismiss() {
    if (session) localStorage.setItem(`${GUIDE_PREFIX}${session.code}`, "seen");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="turn-guide-title">
      <section className="w-full max-w-xl rounded-[30px] border border-cyan-300/25 bg-slate-950 p-6 shadow-2xl sm:p-7">
        <div className="text-xs font-black uppercase tracking-[.22em] text-cyan-200">Before you investigate</div>
        <h2 id="turn-guide-title" className="mt-2 text-3xl font-black text-white">How a turn works</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">You do not need a game master. Your phones control the turns, evidence, and rounds.</p>

        <div className="mt-5 space-y-3 text-sm leading-6 text-white/70">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><b className="text-white">1. One phone says YOUR TURN.</b> That player chooses a person and a question.</div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4"><b className="text-cyan-100">2. Ask the selected question out loud.</b> Talk to the person across the table, not to their phone.</div>
          <div className="rounded-2xl border border-amber-200/15 bg-amber-200/[.05] p-4"><b className="text-amber-100">3. The person questioned checks their phone.</b> They answer out loud using the MUST REVEAL / MAY HIDE instructions they receive.</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><b className="text-white">4. Everyone else listens and investigates.</b> Remember what was said, notice contradictions, defend yourself, bluff, and debate face-to-face.</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><b className="text-white">5. The next investigator is automatic.</b> You never have to decide whose turn comes next or when a round ends.</div>
          <div className="rounded-2xl border border-rose-300/15 bg-rose-300/[.05] p-4"><b className="text-rose-100">6. When evidence appears, read it.</b> Keep anything labeled private to yourself, then tap I'VE SEEN THE EVIDENCE. Play continues when everyone is ready.</div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-sm font-black leading-6 text-white">The phone runs the mystery. The people make it fun.</div>
        <button onClick={dismiss} className="mt-5 w-full rounded-2xl bg-cyan-200 px-4 py-4 font-black text-slate-950">GOT IT — START INVESTIGATING</button>
      </section>
    </div>
  );
}
