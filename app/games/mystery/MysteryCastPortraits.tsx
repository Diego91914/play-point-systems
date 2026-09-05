"use client";

import { useEffect, useMemo, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type CastMember = { id: string; name: string; seat: number; roleId: string | null; roleTitle: string | null };

const KEY = "pps-mystery-session";
const CAST_ART = "https://at.adobe.com/C33ntkl974TaUCoY";

const PORTRAIT_POSITION: Record<string, { x: string; y: string }> = {
  partner: { x: "3%", y: "16%" },
  sister: { x: "34.5%", y: "16%" },
  chef: { x: "65.7%", y: "16%" },
  murderer: { x: "97.6%", y: "16%" },
  lawyer: { x: "3%", y: "79%" },
  assistant: { x: "34.5%", y: "79%" },
  cousin: { x: "65.7%", y: "79%" },
  neighbor: { x: "97.6%", y: "79%" },
};

function Portrait({ roleId, className = "" }: { roleId: string | null; className?: string }) {
  const pos = roleId ? PORTRAIT_POSITION[roleId] : null;
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-2xl border border-amber-200/30 bg-[#0a1116] shadow-[0_16px_50px_rgba(0,0,0,.42)] ${className}`}
      style={pos ? {
        backgroundImage: `url(${CAST_ART})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "443% 339%",
        backgroundPosition: `${pos.x} ${pos.y}`,
      } : undefined}
    />
  );
}

export function MysteryCastPortraits() {
  const [session, setSession] = useState<Session | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [status, setStatus] = useState("lobby");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/games/mystery/${session.code}/cast?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        if (!cancelled) {
          setCast(Array.isArray(json.cast) ? json.cast : []);
          setStatus(typeof json.status === "string" ? json.status : "lobby");
        }
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(refresh, 1800);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session]);

  const readyCast = useMemo(() => cast.filter(member => member.roleId && member.roleTitle), [cast]);
  if (!session || status === "lobby" || readyCast.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[72] flex items-center gap-2 rounded-full border border-amber-200/35 bg-[#111419]/95 px-4 py-3 text-xs font-black uppercase tracking-[.18em] text-amber-100 shadow-2xl backdrop-blur-xl"
      >
        <span className="text-base">♟</span> Cast
      </button>

      {open && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#05080c]/94 px-4 py-8 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.28em] text-amber-200/65">Blackwood House · Tonight's guests</div>
                <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-[#f7ecd2]">Put a face to every story.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">Character identities are public. Memories, secrets, private evidence, and the truth of the murder remain private.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/70">CLOSE</button>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {readyCast.sort((a, b) => a.seat - b.seat).map(member => (
                <article key={member.id} className="overflow-hidden rounded-[22px] border border-amber-200/20 bg-[#10151a] shadow-[0_20px_60px_rgba(0,0,0,.34)]">
                  <Portrait roleId={member.roleId} className="aspect-[1.15/1] w-full rounded-none border-0 border-b border-amber-200/20 shadow-none" />
                  <div className="p-3.5">
                    <div className="truncate text-base font-black text-[#fff5df]">{member.name}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-amber-200/75">{member.roleTitle}</div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200/15 bg-amber-200/[.04] p-4 text-center text-sm font-bold text-[#eadcc0]">Remember the faces. Question the stories.</div>
          </div>
        </div>
      )}
    </>
  );
}
