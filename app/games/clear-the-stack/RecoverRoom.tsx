"use client";
import { useState } from "react";
import { useHostedSessionActivity } from "@/lib/hooks/use-hosted-session-activity";
import { QRCodeSVG } from "qrcode.react";

/** Recover directory access only; never replace the host's in-progress score state. */
export function RecoverRoom() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recovered, setRecovered] = useState<{ id: string; code: string; status: string; joinUrl: string } | null>(null);
  useHostedSessionActivity("/api/games/clear-the-stack/room", recovered?.id, recovered?.status === "playing", "playing");
  async function recover() {
    setBusy(true); setError(""); setRecovered(null);
    try {
      const response = await fetch("/api/games/clear-the-stack/room/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not recover room.");
      setRecovered({ id: data.room.id, code: data.room.code, status: data.room.status, joinUrl: `${window.location.origin}/games/clear-the-stack/join/${data.room.code}` });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not recover room."); }
    finally { setBusy(false); }
  }
  return <details className="mb-6 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-white">
    <summary className="cursor-pointer font-bold">Restore an existing room’s join QR</summary>
    <p className="mt-3 text-sm text-white/60">Enter a room you own. Its players and scores stay as they are. Continue scoring on the original host screen.</p>
    <form className="mt-3 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void recover(); }}>
      <input aria-label="Existing room code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} required pattern="[A-Za-z0-9]{6}" autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-white/20 bg-black/30 px-3 py-3 uppercase" />
      <button disabled={busy} className="rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950">{busy ? "Restoring…" : "Restore QR"}</button>
    </form>
    {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}
    {recovered ? <div className="mt-4 text-center"><div className="mx-auto w-fit rounded-xl bg-white p-2"><QRCodeSVG value={recovered.joinUrl} size={176} /></div><p role="status" className="mt-2 text-sm">CODE {recovered.code} · {recovered.status === "playing" ? "Playing" : "Open"}</p></div> : null}
  </details>;
}
