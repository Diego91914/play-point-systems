"use client";

import { useEffect, useState } from "react";
import { BlackwoodPortrait } from "./blackwood-cast";

type Session = { code: string; playerId: string; token: string };
type CastMember = { id: string; name: string; seat: number; roleId: string | null; roleTitle: string | null };
type RevealState = { reveal?: { murderer?: { id: string; name: string; role: string } } | null };

const KEY = "pps-mystery-session";

export function MysteryRevealPortrait() {
  const [session, setSession] = useState<Session | null>(null);
  const [murderer, setMurderer] = useState<{ id: string; name: string; role: string; roleId: string } | null>(null);

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
        const [caseResponse, castResponse] = await Promise.all([
          fetch(`/api/games/mystery/${session.code}/case?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" }),
          fetch(`/api/games/mystery/${session.code}/cast?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" }),
        ]);
        if (!caseResponse.ok || !castResponse.ok) return;
        const caseJson = await caseResponse.json();
        const castJson = await castResponse.json();
        const reveal = (caseJson.state as RevealState | undefined)?.reveal?.murderer;
        if (!reveal) {
          if (!cancelled) setMurderer(null);
          return;
        }
        const member = (Array.isArray(castJson.cast) ? castJson.cast : []).find((item: CastMember) => item.id === reveal.id);
        if (!cancelled && member?.roleId) setMurderer({ ...reveal, roleId: member.roleId });
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(refresh, 1200);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session]);

  if (!murderer) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[7.5rem] z-[68] flex justify-center px-4 sm:top-[6.5rem]" aria-hidden="true">
      <div className="w-[9.5rem] rounded-[26px] border border-rose-200/35 bg-[#080b0f]/92 p-1.5 shadow-[0_28px_80px_rgba(0,0,0,.58)] backdrop-blur-xl sm:w-[11rem]">
        <BlackwoodPortrait roleId={murderer.roleId} className="aspect-[.88/1] w-full rounded-[20px]" />
        <div className="px-2 pb-2 pt-2 text-center font-serif text-[10px] font-bold uppercase tracking-[.16em] text-rose-100">The truth</div>
      </div>
    </div>
  );
}
