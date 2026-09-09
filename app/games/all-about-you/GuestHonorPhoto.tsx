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

  const isHostLobby = game?.status === "lobby" && game.me?.isHost === true;
  const finale = game?.status === "finished";
  // The photo is a private host setup asset until the finale. Never render it on
  // guest phones or on the host's pass-around QR/invite surface during play.
  if (!isHostLobby && !(finale && game?.guestPhotoUrl)) return null;

  if (finale && game?.guestPhotoUrl) {
    return <aside className="fixed inset-x-0 top-20 z-20 mx-auto w-fit">
      <div className="rounded-[24px] border border-fuchsia-300/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
        <div className="mx-auto overflow-hidden rounded-2xl border border-white/10">
          <img src={game.guestPhotoUrl} alt={game.guest?.name ? `${game.guest.name}, Guest of Honor` : "Guest of Honor"} className="h-40 w-40 object-cover" />
        </div>
      </div>
    </aside>;
  }

  return <aside className="relative z-20 mx-auto mt-4 w-full max-w-xl px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
    <div className="rounded-[24px] border border-fuchsia-300/25 bg-slate-950/95 p-4 shadow-xl backdrop-blur">
      <div className="text-xs font-black uppercase tracking-widest text-fuchsia-100">Guest of Honor photo · optional</div>
      <p className="mt-1 text-xs leading-5 text-white/50">Add the private finale photo here. Only you see this setup preview; it stays hidden from everyone else until the end.</p>
      {game?.guestPhotoUrl && <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-2">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10"><img src={game.guestPhotoUrl} alt="Private Guest of Honor preview" className="h-full w-full object-cover" /></div>
        <div className="min-w-0 text-xs leading-5 text-white/55"><strong className="block text-white/80">Private preview saved</strong>Hidden from guests until the finale.</div>
      </div>}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button disabled={busy} onClick={() => camera.current?.click()} className="min-h-12 rounded-xl bg-fuchsia-300 px-3 py-3 text-xs font-black text-slate-950 disabled:opacity-40">📷 {game?.guestPhotoUrl ? "CHANGE PHOTO" : "TAKE PHOTO"}</button>
        <button disabled={busy} onClick={() => library.current?.click()} className="min-h-12 rounded-xl border border-white/15 px-3 py-3 text-xs font-black text-white disabled:opacity-40">PHOTO LIBRARY</button>
      </div>
      {game?.guestPhotoUrl && <button disabled={busy} onClick={() => void removePhoto()} className="mt-2 min-h-12 w-full rounded-xl border border-rose-300/20 px-3 py-3 text-xs font-black text-rose-100 disabled:opacity-40">REMOVE PHOTO</button>}
      <input ref={camera} hidden type="file" accept="image/*" capture="environment" onChange={event => void upload(event.target.files?.[0])} />
      <input ref={library} hidden type="file" accept="image/*" onChange={event => void upload(event.target.files?.[0])} />
      {busy && <div className="mt-2 text-xs text-white/50">Updating photo…</div>}{error && <div className="mt-2 text-xs text-rose-200">{error}</div>}
    </div>
  </aside>;
}
