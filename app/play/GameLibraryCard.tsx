"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlayPointGameCatalogItem } from "@/lib/play-point-core/games-catalog";

type GameFacts = {
  players: string;
  time: string;
  bestFor: string;
  howItWorks: string;
};

const GAME_FACTS: Record<string, GameFacts> = {
  "game.chain_reaction": {
    players: "3–8 players",
    time: "10–20 min",
    bestFor: "Friends · Family · Restaurants",
    howItWorks: "One player knows a secret target word and tries to steer the conversation toward it without making the target obvious. The table listens, connects clues, and tries to uncover where the chain is heading.",
  },
  "game.how_close": {
    players: "2–8 players",
    time: "10–20 min",
    bestFor: "People who know each other",
    howItWorks: "A Spotlight Player secretly answers a 1-to-100 question. Everyone else predicts where that person landed, turning personality, opinions, and relationships into the game.",
  },
  "game.on_my_list": {
    players: "2–8 players",
    time: "15–30 min",
    bestFor: "Friends · Family · Reunions",
    howItWorks: "One person privately ranks 5–10 answers to a question. Everyone else takes turns guessing what made the list before two misses knock them out for that board.",
  },
  "game.inside_man": {
    players: "4–8 players",
    time: "20–35 min",
    bestFor: "Social deduction groups",
    howItWorks: "The group works through missions while one hidden player—the Inside Man—quietly tries to steer the table toward failure without being exposed.",
  },
  "game.phone_holdem": {
    players: "2–8 players",
    time: "20+ min",
    bestFor: "Poker night without cards or chips",
    howItWorks: "Each phone becomes a private poker seat while a shared table handles the board, betting, pots, side pots, blinds, and tournament flow for face-to-face Texas Hold'em.",
  },
  "game.play_point_trivia": {
    players: "2+ players",
    time: "15–60 min",
    bestFor: "Families · Parties · Groups",
    howItWorks: "A host runs paced trivia while players answer from their phones. Room codes, scoring, teams, wagers, and the shared scoreboard are handled automatically.",
  },
  "shot_caddy.mode.classic": {
    players: "1–8 players",
    time: "A full round",
    bestFor: "Disc golf groups",
    howItWorks: "Play a normal disc-golf round with an added game layer of challenge packs, tokens, Special Plays, and scoring that changes decisions without replacing the round itself.",
  },
  "shot_caddy.mode.chaos": {
    players: "2–8 players",
    time: "A full round",
    bestFor: "Disc golfers who want maximum variety",
    howItWorks: "Chaos turns up the volatility with disruptive challenges, bonus opportunities, power-ups, and big momentum swings layered onto a real disc-golf round.",
  },
  "shot_caddy.mode.battle": {
    players: "2–8 players",
    time: "A full round",
    bestFor: "Competitive disc-golf groups",
    howItWorks: "Challenges, tokens, Special Plays, and Battle Points turn a normal round into a head-to-head contest where pressure can matter as much as raw score.",
  },
  "shot_caddy.mode.cys": {
    players: "1–8 players",
    time: "A full round",
    bestFor: "Disc golf · Golf",
    howItWorks: "Call your expected result before each hole, then earn points by backing up the prediction. Confidence and execution become part of the score.",
  },
  "shot_caddy.mode.csp": {
    players: "2–8 players",
    time: "A full round",
    bestFor: "Disc golf · Golf skins groups",
    howItWorks: "A skins-style competition where challenges create extra pressure and value on top of the normal hole-by-hole contest.",
  },
  "shot_caddy.mode.card_shark": {
    players: "1–6 players",
    time: "10–25 min",
    bestFor: "Putting practice · Backyard play",
    howItWorks: "Make putts to earn cards, build the strongest poker hand, and race to win three hands. It turns putting practice into a quick card game around one basket.",
  },
  "quest_caddy.experience": {
    players: "1+ players",
    time: "Persistent campaign",
    bestFor: "Disc golfers who want story and progression",
    howItWorks: "Your real rounds feed a persistent fantasy journey with Wayfinders, choices, secret Callings, progression, encounters, and a Chronicle that records who your character becomes.",
  },
};

function fallbackFacts(product: PlayPointGameCatalogItem): GameFacts {
  return {
    players: "Flexible group size",
    time: "Play at your pace",
    bestFor: product.playCategories.map((category) => category.replaceAll("_", " ")).join(" · "),
    howItWorks: product.description,
  };
}

export function GameLibraryCard({ product }: { product: PlayPointGameCatalogItem }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const facts = GAME_FACTS[product.sku] ?? fallbackFacts(product);
  const typeLabel = product.productType === "standalone_game" ? "Standalone game" : product.productType.replaceAll("_", " ");

  useEffect(() => {
    if (!infoOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInfoOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [infoOpen]);

  const launchClass = "inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.055] px-3.5 py-2.5 text-xs font-black text-white/88 transition hover:border-white/22 hover:bg-white/[0.09]";

  return (
    <>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.045]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">{product.brand}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/48">{typeLabel}</span>
        </div>
        <h3 className="mt-4 text-2xl font-black text-white">{product.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-white/62">{product.description}</p>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-4">
          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1.5 text-[10px] font-bold text-white/58">{facts.players}</span>
          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1.5 text-[10px] font-bold text-white/58">{facts.time}</span>
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] px-3.5 py-2.5 text-xs font-black text-amber-50 transition hover:border-amber-300/35 hover:bg-amber-300/[0.13]"
            aria-label={`About ${product.title}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-200/35 text-[11px]">i</span>
            About
          </button>
          {product.external ? (
            <a href={product.href} target="_blank" rel="noreferrer" className={launchClass}>Play / Explore ↗</a>
          ) : (
            <Link href={product.href} className={launchClass}>Play / Explore →</Link>
          )}
        </div>
      </article>

      {infoOpen ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInfoOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby={`game-info-${product.sku}`} className="relative w-full max-w-xl overflow-hidden rounded-t-[30px] border border-white/12 bg-[linear-gradient(155deg,#17150f,#0a0a0a_42%,#050505)] p-6 shadow-[0_32px_100px_rgba(0,0,0,.65)] sm:rounded-[30px] sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(245,190,70,.16),transparent_60%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/65">About the game</div>
                <h2 id={`game-info-${product.sku}`} className="mt-2 text-3xl font-black tracking-tight text-white">{product.title}</h2>
              </div>
              <button type="button" onClick={() => setInfoOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-xl text-white/75 transition hover:bg-white/10" aria-label="Close game information">×</button>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[facts.players, facts.time, facts.bestFor].map((fact) => <div key={fact} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-xs font-bold leading-5 text-white/72">{fact}</div>)}
            </div>

            <div className="relative mt-5 rounded-[22px] border border-amber-300/12 bg-amber-300/[0.045] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-100/58">How it works</div>
              <p className="mt-3 text-sm leading-7 text-white/78">{facts.howItWorks}</p>
            </div>

            <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setInfoOpen(false)} className="rounded-2xl border border-white/12 bg-white/5 px-5 py-3.5 text-sm font-black text-white/80 transition hover:bg-white/10">Keep Browsing</button>
              {product.external ? (
                <a href={product.href} target="_blank" rel="noreferrer" className="rounded-2xl border border-amber-200/30 bg-[linear-gradient(120deg,rgba(224,188,111,.38),rgba(158,112,34,.24))] px-5 py-3.5 text-center text-sm font-black text-white transition hover:brightness-110">Play / Explore ↗</a>
              ) : (
                <Link href={product.href} className="rounded-2xl border border-amber-200/30 bg-[linear-gradient(120deg,rgba(224,188,111,.38),rgba(158,112,34,.24))] px-5 py-3.5 text-center text-sm font-black text-white transition hover:brightness-110">Play This Game →</Link>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
