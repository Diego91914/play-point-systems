"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "pps-all-about-you-session";
type Session = { code: string; playerId: string; token: string };
type Snapshot = { status: string; guestPhotoUrl?: string; guest?: { name: string } | null; me?: { isHost: boolean } | null };

export function GuestHonorPhoto() {
  const [session, setSession] = useState<Session | null>(null);
  const [game, setGame] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = () => { try { const raw = localStorage.getItem(KEY); setSession(raw ? JSON.parse(raw) : null); } catch { setSession(null); } };
    load(); const timer = setInterval(load, 1200); return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    if (!session) { setGame(null); return; }
    try {
      const response = await fetch(`/api/games/all-about-you/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
      if (response.ok) setGame((await response.json()).state);
    } catch {}
  }, [session]);
  useEffect(() => { void refresh(); const timer = setInterval(refresh, 1200); return () => clearInterval(timer); }, [refresh]);

  async function upload(file?: File) {
    if (!file || !session) return;
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.set("playerId", session.playerId); form.set("token", session.token); form.set("photo", file);
      const response = await fetch(`/api/games/all-about-you/${session.code}/photo`, { method: "POST", body: form });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "Unable to upload photo.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to upload photo."); }
    finally { setBusy(false); if (camera.current) camera.current.value = ""; if (library.current) library.current.value = ""; }
  }

  async function removePhoto() {
    if (!session || !game?.guestPhotoUrl) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/games/all-about-you/${session.code}/photo`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: session.playerId, token: session.token }),
      });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "Unable to remove photo.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to remove photo."); }
    finally { setBusy(false); }
  }

  if (!game?.guestPhotoUrl && !(game?.status === "lobby" && game.me?.isHost)) return null;
  const finale = game.status === "finished";
  return <aside className={finale ? "fixed inset-x-0 top-20 z-20 mx-auto w-fit" : "fixed bottom-5 left-5 z-20 max-w-[220px]"}>
    <div className="rounded-[24px] border border-fuchsia-300/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
      {game.guestPhotoUrl && <div className="mx-auto overflow-hidden rounded-2xl border border-white/10"><img src={game.guestPhotoUrl} alt={game.guest?.name ? `${game.guest.name}, Guest of Honor` : "Guest of Honor"} className={`${finale ? "h-40 w-40" : "h-24 w-full"} object-cover`} /></div>}
      {game.status === "lobby" && game.me?.isHost && <div className={game.guestPhotoUrl ? "mt-3" : ""}>
        <div className="text-xs font-black uppercase tracking-widest text-fuchsia-100">Guest of Honor photo · optional</div>
        <p className="mt-1 text-xs leading-5 text-white/50">Take one now or choose one from your photo library. It stays private to this game room.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button disabled={busy} onClick={() => camera.current?.click()} className="rounded-xl bg-fuchsia-300 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-40">📷 TAKE PHOTO</button>
          <button disabled={busy} onClick={() => library.current?.click()} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-white disabled:opacity-40">PHOTO LIBRARY</button>
        </div>
        {game.guestPhotoUrl && <button disabled={busy} onClick={() => void removePhoto()} className="mt-2 w-full rounded-xl border border-rose-300/20 px-3 py-2 text-xs font-black text-rose-100 disabled:opacity-40">REMOVE PHOTO</button>}
        <input ref={camera} hidden type="file" accept="image/*" capture="environment" onChange={event => void upload(event.target.files?.[0])} />
        <input ref={library} hidden type="file" accept="image/*" onChange={event => void upload(event.target.files?.[0])} />
        {busy && <div className="mt-2 text-xs text-white/50">Updating photo…</div>}{error && <div className="mt-2 text-xs text-rose-200">{error}</div>}
      </div>}
    </div>
  </aside>;
}
