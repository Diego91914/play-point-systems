"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/games/_components/signature-moment.module.css";

type Session = { code: string; playerId: string; token: string };
type Game = {
  status: "lobby" | "playing" | "review" | "round_end" | "finished";
  round: number;
  revealedTarget: string | null;
  players: Array<{ id: string; name: string; score: number }>;
};

const KEY = "pps-chain-reaction-session";

export function ChainReactionMoment() {
  const [session, setSession] = useState<Session | null>(null);
  const [moment, setMoment] = useState<{ key: string; eyebrow: string; title: string; detail: string } | null>(null);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/games/chain-reaction/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        const game = json.state as Game;
        let next: { key: string; eyebrow: string; title: string; detail: string } | null = null;
        if (game.status === "round_end" && game.revealedTarget) {
          next = {
            key: `round-${game.round}-${game.revealedTarget}`,
            eyebrow: "Target revealed",
            title: game.revealedTarget,
            detail: "The chain found its destination.",
          };
        } else if (game.status === "finished" && game.players.length) {
          const sorted = [...game.players].sort((a, b) => b.score - a.score);
          const top = sorted[0]?.score ?? 0;
          const winners = sorted.filter(player => player.score === top);
          next = {
            key: `finished-${game.round}-${top}`,
            eyebrow: "Chain complete",
            title: winners.length > 1 ? "TIE GAME" : `${winners[0]?.name ?? "Table"} WINS`,
            detail: `${top} point${top === 1 ? "" : "s"}`,
          };
        }
        if (!cancelled && next && next.key !== seen.current) {
          seen.current = next.key;
          setMoment(next);
          window.setTimeout(() => setMoment(current => current?.key === next!.key ? null : current), 1500);
        }
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session]);

  if (!moment) return null;
  return (
    <div className={`${styles.overlay} ${styles.cyan}`} aria-hidden="true">
      <div className={styles.card}>
        <div className={styles.eyebrow}>{moment.eyebrow}</div>
        <div className={styles.title}>{moment.title}</div>
        <div className={styles.detail}>{moment.detail}</div>
      </div>
    </div>
  );
}
