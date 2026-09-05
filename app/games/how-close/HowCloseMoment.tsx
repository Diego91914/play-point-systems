"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/games/_components/signature-moment.module.css";

type Session = { code: string; playerId: string; token: string };
type Game = {
  status: "lobby" | "playing" | "finished";
  round: number;
  revealed: boolean;
  answers: Record<string, number>;
  closestPlayerIds: string[];
  spotlight: { id: string; name: string } | null;
  players: Array<{ id: string; name: string; score: number }>;
};

const KEY = "pps-how-close-session";

export function HowCloseMoment() {
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
        const response = await fetch(`/api/games/how-close/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        const game = json.state as Game;
        let next: { key: string; eyebrow: string; title: string; detail: string } | null = null;
        if (game.status === "playing" && game.revealed && game.spotlight) {
          const answer = game.answers[game.spotlight.id];
          const closest = game.players.filter(player => game.closestPlayerIds.includes(player.id)).map(player => player.name);
          next = {
            key: `reveal-${game.round}-${game.spotlight.id}-${answer}`,
            eyebrow: `${game.spotlight.name}'s real answer`,
            title: String(answer ?? "—"),
            detail: closest.length ? `${closest.join(" & ")} ${closest.length > 1 ? "were" : "was"} closest` : "See how well the table guessed.",
          };
        } else if (game.status === "finished" && game.players.length) {
          const sorted = [...game.players].sort((a, b) => b.score - a.score);
          const top = sorted[0];
          next = {
            key: `finished-${game.round}-${top?.id}-${top?.score}`,
            eyebrow: "Table read",
            title: `${top?.name ?? "Someone"} WINS`,
            detail: "They knew the room best.",
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
    <div className={`${styles.overlay} ${styles.violet}`} aria-hidden="true">
      <div className={styles.card}>
        <div className={styles.eyebrow}>{moment.eyebrow}</div>
        <div className={styles.title}>{moment.title}</div>
        <div className={styles.detail}>{moment.detail}</div>
      </div>
    </div>
  );
}
