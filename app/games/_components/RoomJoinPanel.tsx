"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = { code: string; joinUrl: string; gameName: string };

export function RoomJoinPanel({ code, joinUrl, gameName }: Props) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="rounded-2xl bg-black/25 p-5 text-center text-4xl font-black tracking-[.22em] text-cyan-100">{code}</div>
        <button type="button" onClick={() => navigator.clipboard?.writeText(joinUrl)} className="mt-3 w-full rounded-2xl border border-white/15 px-4 py-3 font-bold text-white">COPY JOIN LINK</button>
      </div>
      <div className="mx-auto rounded-[24px] bg-white p-3 text-center">
        <QRCodeSVG value={joinUrl} size={176} level="M" marginSize={1} />
        <div className="mt-2 text-[11px] font-black uppercase tracking-[.12em] text-slate-900">Scan to join</div>
        <div className="mt-1 max-w-[176px] text-[10px] leading-4 text-slate-600">No account needed for guests</div>
      </div>
      <p className="text-center text-xs leading-5 text-white/45 sm:col-span-2">Open {gameName}, enter a first name, and join this room instantly.</p>
    </div>
  );
}
