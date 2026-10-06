"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteShell } from "@/app/components/SiteShell";

const CODE_PATTERN = /^[A-Z2-9]{6}$/;

export default function JoinGamePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const autoLookupStarted = useRef(false);

  async function findRoom(codeOverride?: string) {
    const candidate = codeOverride ?? code;
    const normalized = candidate.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalized)) {
      setError("Enter the 6-character room code shown on the host's screen.");
      return;
    }
    setError("");
    try {
      const response = await fetch(`/api/play/rooms/resolve?code=${encodeURIComponent(normalized)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Room not found.");
      window.location.href = data.room.joinHref;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to find that room.");
    }
  }

  useEffect(() => {
    if (autoLookupStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    const initialCode = (params.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
    if (initialCode) setCode(initialCode);
    if (params.get("lookup") !== "1" || !CODE_PATTERN.test(initialCode)) return;
    autoLookupStarted.current = true;
    void findRoom(initialCode);
  }, []);

  return (
    <SiteShell current="play">
      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-xl">
          <Link href="/play" className="text-sm font-bold text-white/50 hover:text-white">← Back to Play</Link>
          <div className="mt-7 rounded-[32px] border border-fuchsia-200/20 bg-fuchsia-300/[0.055] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-100/60">Quick Join</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Enter the room code.</h1>
            <p className="mt-3 text-sm leading-6 text-white/58">If the host has a QR code, scanning it is even faster. Guests do not need a Play Amplified account.</p>
            <label htmlFor="room-code" className="mt-7 block text-xs font-black uppercase tracking-[0.18em] text-white/45">Room code</label>
            <input id="room-code" autoCapitalize="characters" autoCorrect="off" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))} onKeyDown={(event) => { if (event.key === "Enter") void findRoom(); }} placeholder="ABC234" className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-5 text-center text-3xl font-black uppercase tracking-[0.28em] text-white outline-none focus:border-fuchsia-200/55" />
            <button type="button" onClick={() => void findRoom()} disabled={code.length !== 6} className="mt-3 w-full rounded-2xl bg-fuchsia-200 px-5 py-4 font-black text-slate-950 disabled:opacity-35">JOIN GAME</button>
            {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
