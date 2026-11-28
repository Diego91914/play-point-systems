import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MASTER_GAME_CATALOG } from "@/lib/play-point-core/master-game-catalog";
import { getGameExperienceDemo } from "@/lib/play-point-core/game-experience-demos";
import { GameScreenshot } from "../../GameScreenshot";
import { GameExperienceDemo } from "./GameExperienceDemo";

function getGame(gameId: string) {
  return MASTER_GAME_CATALOG.find((game) => game.id === gameId) ?? null;
}

export function generateStaticParams() {
  return MASTER_GAME_CATALOG.map((game) => ({ gameId: game.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) return { title: "Game | Play Amplified" };
  return { title: `${game.title} | Play Amplified`, description: game.description, robots: { index: true, follow: true } };
}

export default async function GameExperiencePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) notFound();
  const demo = getGameExperienceDemo(game);
  const statusLabel = game.status === "live" ? "Finished & playable" : "Playable preview";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.07),transparent_34%)]" /></div>
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-6">
          <Link prefetch={false} href="/play-amplified" className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/55">Play Point Systems presents</div><div className="mt-1 text-xl font-black tracking-[-0.03em] text-white">PLAY AMPLIFIED</div></Link>
          <Link prefetch={false} href="/play-amplified#all-games" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/[0.08] hover:text-white">← All games</Link>
        </header>
        <main>
          <section className="grid gap-10 pb-12 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pb-16 lg:pt-20">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-200/20 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">{game.family}</span><span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${game.status === "live" ? "border-emerald-200/20 bg-emerald-300/[0.08] text-emerald-100" : "border-amber-200/20 bg-amber-300/[0.08] text-amber-100"}`}>{statusLabel}</span></div>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">{game.title}</h1>
              {game.parentTitle ? <div className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-white/38">{game.parentTitle} format</div> : null}
              <p className="mt-6 max-w-3xl text-xl font-semibold leading-8 text-white/78 sm:text-2xl sm:leading-9">{demo.hook}</p>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/55">{game.description}</p>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Why people remember it</div><p className="mt-4 text-lg font-bold leading-8 text-white/82">{demo.payoff}</p><div className="mt-6 flex flex-wrap gap-2">{demo.facts.map((fact) => <span key={fact} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/55">{fact}</span>)}</div></div>
          </section>

          {game.id === "thats-your-story" ? <div className="mb-8 max-w-2xl"><GameScreenshot gameId={game.id} detail /></div> : null}

          <section className="pb-16 sm:pb-20"><GameExperienceDemo gameId={game.id} title={game.title} launchHref={game.launchHref} /></section>

        </main>
      </div>
    </div>
  );
}
