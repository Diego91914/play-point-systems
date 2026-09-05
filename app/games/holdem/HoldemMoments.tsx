"use client";

import { useEffect, useRef, useState } from "react";

type Credentials = { code: string; playerId: string; token: string };
type Winner = { playerId: string; name: string; amount: number; handName?: string };
type Table = {
  status: "lobby" | "playing" | "showdown";
  handNumber: number;
  pot: number;
  winners: Winner[];
  tournament: { completed: boolean; championName: string | null } | null;
};
type Moment = { eyebrow: string; title: string; detail: string } | null;

export function HoldemMoments() {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [moment, setMoment] = useState<Moment>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code")?.toUpperCase();
    if (!code) return;
    try {
      const raw = localStorage.getItem(`pps-holdem-${code}`);
      if (raw) setCreds(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!creds) return;
    let cancelled = false;
    let hide = 0;

    const show = (key: string, next: Exclude<Moment, null>, ms = 2200) => {
      if (cancelled || seen.current.has(key)) return;
      seen.current.add(key);
      setMoment(next);
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setMoment(null), ms);
    };

    const load = async () => {
      try {
        const response = await fetch(`/api/games/holdem/${creds.code}`, {
          cache: "no-store",
          headers: {
            "x-holdem-player-id": creds.playerId,
            "x-holdem-token": creds.token,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        const table = data.table as Table;

        if (table.status === "showdown" && table.winners?.length) {
          const names = table.winners.map((winner) => winner.name).join(" & ");
          const total = table.winners.reduce((sum, winner) => sum + winner.amount, 0);
          show(
            `showdown:${table.handNumber}:${names}`,
            {
              eyebrow: `Showdown · Hand ${table.handNumber}`,
              title: table.winners.length > 1 ? "SPLIT POT" : `${names} WINS`,
              detail: `${total.toLocaleString()} chips awarded`,
            },
            2300,
          );
        }

        if (table.tournament?.completed && table.tournament.championName) {
          show(
            `champion:${table.tournament.championName}`,
            {
              eyebrow: "Tournament complete",
              title: `${table.tournament.championName} WINS`,
              detail: "Table champion",
            },
            2600,
          );
        }
      } catch {}
    };

    void load();
    const timer = window.setInterval(load, 900);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(hide);
    };
  }, [creds]);

  if (!moment) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[82] flex items-center justify-center bg-black/62 px-5 backdrop-blur-[2px]" aria-live="polite">
      <div className="w-full max-w-xl rounded-[34px] border border-amber-200/25 bg-[radial-gradient(circle_at_top,rgba(245,196,92,.22),transparent_48%),#07100c]/97 p-8 text-center shadow-[0_34px_110px_rgba(0,0,0,.72)] motion-safe:animate-[momentPop_.48s_cubic-bezier(.2,.9,.2,1)]">
        <div className="text-[11px] font-black uppercase tracking-[.28em] text-amber-100/60">{moment.eyebrow}</div>
        <div className="mt-3 text-4xl font-black tracking-tight text-amber-50 sm:text-6xl">{moment.title}</div>
        <div className="mt-4 text-sm font-bold uppercase tracking-[.12em] text-white/55">{moment.detail}</div>
      </div>
    </div>
  );
}
