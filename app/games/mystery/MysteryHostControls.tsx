"use client";

import { useCallback, useEffect, useState } from "react";

type Session = { code: string; playerId: string; token: string };
const KEY = "pps-mystery-session";

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Session>;
    if (!value.code || !value.playerId || !value.token) return null;
    return { code: value.code, playerId: value.playerId, token: value.token };
  } catch {
    return null;
  }
}

export function MysteryHostControls() {
  const [isHost, setIsHost] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    const session = getSession();
    if (!session) return setIsHost(false);
    try {
      const response = await fetch("/api/games/social-room-control", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", game: "mystery", ...session }),
      });
      const json = await response.json();
      setIsHost(response.ok && Boolean(json.isHost));
    } catch {}
  }, []);

  useEffect(() => {
    void check();
    const timer = window.setInterval(check, 1200);
    return () => window.clearInterval(timer);
  }, [check]);

  async function startOver() {
    const session = getSession();
    if (!session || !window.confirm("Start the mystery over and return everyone to the lobby?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/games/mystery/${session.code}`, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...session, action: "restart", payload: {} }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to start over.");
      setOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to start over.");
    } finally {
      setBusy(false);
    }
  }

  async function quit() {
    const session = getSession();
    if (!session || !window.confirm("End this mystery for everyone and close the room?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/games/social-room-control", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "quit", game: "mystery", ...session }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to end game.");
      localStorage.removeItem(KEY);
      window.location.href = "/play";
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to end game.");
    } finally {
      setBusy(false);
    }
  }

  if (!isHost) return null;

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-[80] sm:left-5">
      {open && <div className="mb-2 w-[min(19rem,calc(100vw-2rem))] rounded-[24px] border border-rose-200/15 bg-black/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="px-2 pb-3 pt-1"><div className="text-[10px] font-black uppercase tracking-[.24em] text-rose-100/55">Host controls</div></div>
        <button disabled={busy} onClick={() => void startOver()} className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-left text-sm font-black text-white disabled:opacity-40">↻ &nbsp;START OVER</button>
        <button disabled={busy} onClick={() => void quit()} className="mt-2 min-h-12 w-full rounded-2xl border border-rose-300/20 bg-rose-300/[.08] px-4 py-3 text-left text-sm font-black text-rose-100 disabled:opacity-40">QUIT GAME</button>
      </div>}
      <button onClick={() => setOpen(value => !value)} className="min-h-12 rounded-full border border-rose-200/20 bg-black/90 px-5 py-3 text-[11px] font-black uppercase tracking-[.16em] text-rose-50 shadow-xl backdrop-blur-xl">{open ? "CLOSE" : "HOST MENU"}</button>
    </div>
  );
}
