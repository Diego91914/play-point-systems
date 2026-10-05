"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type LobbyPlayer = { id: string; name: string };

type Props = {
  code: string;
  joinUrl: string;
  gameName: string;
  players?: readonly LobbyPlayer[];
  currentPlayerId?: string;
  isHost?: boolean;
  minPlayers?: number;
  startLabel?: string;
  busy?: boolean;
  onStart?: () => void;
};

export function RoomJoinPanel({
  code,
  joinUrl,
  gameName,
  players,
  currentPlayerId,
  isHost = false,
  minPlayers,
  startLabel = "START GAME",
  busy = false,
  onStart,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyJoinLink() {
    try {
      await navigator.clipboard?.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="relative mt-5 overflow-hidden rounded-[30px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_left,rgba(213,174,95,0.13),transparent_38%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/[.06] blur-3xl" />
      <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-100/60">Invite your players</div>
          <div className="mt-2 text-xl font-black tracking-tight text-white">Join {gameName}</div>
          <p className="mt-1 max-w-md text-xs leading-5 text-white/48">Scan the QR code or share the room code. Guests only need a first name — no account required.</p>

          <div className="mt-4 rounded-[24px] border border-cyan-200/15 bg-black/30 px-4 py-5 text-center shadow-inner">
            <div className="text-[9px] font-black uppercase tracking-[.28em] text-cyan-100/45">Room code</div>
            <div className="mt-2 break-all text-4xl font-black tracking-[.2em] text-cyan-100 drop-shadow-[0_0_18px_rgba(103,232,249,.18)] sm:text-5xl">{code}</div>
          </div>

          <button
            type="button"
            onClick={copyJoinLink}
            className="mt-3 min-h-12 w-full rounded-2xl border border-amber-200/25 bg-amber-300/[.09] px-4 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-300/[.14] active:scale-[.99]"
          >
            {copied ? "✓ LINK COPIED" : "COPY JOIN LINK"}
          </button>
          {players ? (
            <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/45">Players joined</div>
                <div className="text-xs font-black text-white/65">{players.length}{minPlayers ? ` / ${minPlayers} minimum` : ""}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {players.map((player, index) => (
                  <span key={player.id} className="rounded-full border border-white/10 bg-white/[.055] px-3 py-2 text-xs font-bold text-white/78">
                    {player.name}{player.id === currentPlayerId ? " · You" : ""}{isHost && index === 0 ? " · Host" : ""}
                  </span>
                ))}
              </div>
              {isHost && onStart ? (
                <button type="button" disabled={busy || Boolean(minPlayers && players.length < minPlayers)} onClick={onStart} className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-35">
                  {busy ? "STARTING…" : startLabel}
                </button>
              ) : onStart ? (
                <div className="mt-4 text-center text-xs font-bold text-white/45">Waiting for the host to start…</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mx-auto w-fit rounded-[26px] border border-white/15 bg-white p-3 text-center shadow-[0_18px_55px_rgba(0,0,0,.32)]">
          <QRCodeSVG value={joinUrl} size={176} level="M" marginSize={1} />
          <div className="mt-2 text-[11px] font-black uppercase tracking-[.14em] text-slate-950">Scan to join</div>
          <div className="mt-1 max-w-[176px] text-[10px] leading-4 text-slate-600">Camera → scan → enter your name</div>
        </div>
      </div>
    </section>
  );
}
