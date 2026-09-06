"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { GameAtmosphere } from "../../../_components/GameAtmosphere";

export default function TriviaVenueJoinPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const slug = params.slug;
  const presenceToken = search.get("p") ?? "";
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const storageKey = useMemo(() => `play-amplified-trivia-venue-${slug}`, [slug]);

  async function join() {
    setJoining(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trivia/venue/${encodeURIComponent(slug)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, presenceToken }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to join.");
      window.localStorage.setItem(storageKey, JSON.stringify({
        playerId: payload.player.id,
        deviceToken: payload.deviceToken,
        venueSessionId: payload.venueSessionId,
        name: payload.player.name,
        presenceExpiresAt: payload.player.presence_expires_at,
      }));
      setMessage(`You're in, ${payload.player.name}. Keep this page open for venue play.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to join venue trivia.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <GameAtmosphere variant="trivia">
      <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-10 text-white">
        <div className="rounded-[32px] border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/70">Play Amplified Trivia · Venue Mode</div>
          <h1 className="mt-3 text-4xl font-black">Join the room.</h1>
          <p className="mt-3 text-sm leading-7 text-white/68">Enter a nickname. Your phone becomes your private answer pad while the TV runs the show.</p>
          {!presenceToken ? <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">Scan the current QR code on the venue TV to join.</div> : null}
          <label className="mt-7 block text-sm font-bold" htmlFor="venue-name">Nickname</label>
          <input id="venue-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Table 12" className="mt-3 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-4 text-lg font-bold outline-none focus:border-cyan-300/50" />
          <button type="button" disabled={!presenceToken || !name.trim() || joining} onClick={join} className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-[#05131d] disabled:opacity-40">{joining ? "Joining…" : "JOIN TRIVIA"}</button>
          {message ? <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/80">{message}</div> : null}
          <p className="mt-6 text-xs leading-6 text-white/45">Venue presence lasts about one hour. When it expires, scan the TV again to keep your place and score.</p>
        </div>
      </main>
    </GameAtmosphere>
  );
}
