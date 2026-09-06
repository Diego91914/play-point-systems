"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { GameAtmosphere } from "../../../_components/GameAtmosphere";

type DisplayPayload = {
  venue: { slug: string; displayName: string };
  venueSessionId: string;
  status: string;
  currentTriviaSessionId: string | null;
  presenceToken: string;
  leaderboard: Array<{ id: string; name: string; rollingScore: number; scoreTotal: number; rank: number }>;
};

export default function TriviaVenueTvPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const slug = params.slug;
  const displayKey = search.get("key") ?? "";
  const [payload, setPayload] = useState<DisplayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!displayKey) return;
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/display`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayKey }),
          cache: "no-store",
        });
        const next = await response.json();
        if (!response.ok) throw new Error(next.error ?? "Unable to open venue display.");
        if (active) { setPayload(next); setError(null); }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to open venue display.");
      }
    };
    void load();
    const handle = window.setInterval(load, 10 * 60 * 1000);
    return () => { active = false; window.clearInterval(handle); };
  }, [displayKey, slug]);

  const joinUrl = useMemo(() => {
    if (!payload || typeof window === "undefined") return "";
    return `${window.location.origin}/games/trivia/venue/${encodeURIComponent(slug)}/join?p=${encodeURIComponent(payload.presenceToken)}`;
  }, [payload, slug]);

  return (
    <GameAtmosphere variant="trivia">
      <main className="min-h-screen px-8 py-8 text-white lg:px-12 lg:py-10">
        {!displayKey ? <div className="mx-auto mt-20 max-w-xl rounded-[32px] border border-amber-300/20 bg-black/35 p-8 text-center"><h1 className="text-3xl font-black">Venue display key required</h1><p className="mt-4 text-white/65">Open this screen from the venue operator dashboard.</p></div> : null}
        {error ? <div className="mx-auto mt-20 max-w-xl rounded-[32px] border border-red-300/20 bg-black/35 p-8 text-center text-red-100">{error}</div> : null}
        {payload ? (
          <div className="mx-auto grid max-w-[1500px] gap-8 xl:grid-cols-[1fr_360px]">
            <section className="rounded-[36px] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur lg:p-10">
              <div className="text-sm font-black uppercase tracking-[0.3em] text-cyan-200/70">{payload.venue.displayName}</div>
              <h1 className="mt-3 text-6xl font-black tracking-tight lg:text-8xl">LIVE TRIVIA</h1>
              <p className="mt-5 max-w-3xl text-xl leading-8 text-white/68">Scan to join from your table. The TV runs the show; your phone is your answer pad.</p>
              <div className="mt-10 rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/50">Current game</div>
                <div className="mt-3 text-3xl font-black">{payload.currentTriviaSessionId ? "Trivia is live" : "Next round is getting ready"}</div>
              </div>
              <div className="mt-8">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/50">Active leaderboard</div>
                <div className="mt-4 grid gap-3">
                  {payload.leaderboard.length ? payload.leaderboard.slice(0, 10).map((player) => (
                    <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                      <div className="text-2xl font-black">{player.rank}. {player.name}</div>
                      <div className="text-2xl font-black text-cyan-100">{player.rollingScore.toLocaleString()}</div>
                    </div>
                  )) : <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-xl text-white/55">No active players yet. Scan the QR to be first.</div>}
                </div>
              </div>
            </section>
            <aside className="rounded-[36px] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(49,181,225,.18),rgba(0,0,0,.28))] p-7 text-center shadow-2xl backdrop-blur">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">Scan to play</div>
              {joinUrl ? <div className="mx-auto mt-5 w-fit rounded-[28px] bg-white p-4"><QRCodeSVG value={joinUrl} size={260} level="M" includeMargin={false} /></div> : null}
              <div className="mt-5 text-2xl font-black">Join from your table</div>
              <p className="mt-3 text-sm leading-6 text-white/65">Your venue access lasts about one hour. If it expires, scan this TV again—your name and score stay yours.</p>
            </aside>
          </div>
        ) : null}
      </main>
    </GameAtmosphere>
  );
}
