import type { Metadata } from "next";
import Link from "next/link";
import { ProductPreview } from "../components/ProductPreview";
import { SiteShell } from "../components/SiteShell";

export const metadata: Metadata = {
  title: "Score Caddy | Play Point Systems",
  description: "Simple scoring for disc golf, golf, pickleball, bocce, cornhole, horseshoes, and custom games.",
  alternates: { canonical: "/live" },
};

const quickMatchGames = ["Pickleball", "Bocce", "Cornhole", "Horseshoes", "Washers", "Ping Pong", "Custom"] as const;

const scoreModes = [
  {
    title: "Round",
    eyebrow: "Golf-style scoring",
    body: "Keep a clean round score for disc golf and golf without loading the full Shot Caddy game layer.",
    examples: ["Player-by-player scoring", "Round-first workflow", "Simple enough for a casual group"],
  },
  {
    title: "Quick Match",
    eyebrow: "Score almost anything",
    body: "Use flexible point scoring for backyard games, racquet games, table games, and made-up family competition.",
    examples: ["Points and target scores", "Sets, games, or ends", "Custom names and scoring"],
  },
] as const;

export default function ScoreCaddyLandingPage() {
  return (
    <SiteShell current="score-caddy">
      <section className="px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-cyan-50/82">Score Caddy</div>
            <h1 className="marketing-headline mt-6 leading-[0.98] lg:text-7xl xl:text-[5rem]">Keep score. Keep playing.</h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">The simple scorekeeper for whatever you're playing.</p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">Use <strong className="text-white">Round</strong> for golf-style scoring or <strong className="text-white">Quick Match</strong> for pickleball, bocce, cornhole, horseshoes, and almost any point game. Score Caddy stays out of the way so the game stays in front of you.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/live/quick-score" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.22)] transition hover:-translate-y-0.5 hover:brightness-110">Open Score Caddy</Link>
              <Link href="/shot-caddy" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.045] px-6 py-3.5 text-sm font-black text-white/88 transition hover:bg-white/[0.08]">Want more? Try Shot Caddy</Link>
            </div>
          </div>

          <aside className="rounded-[34px] border border-cyan-200/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_42%),rgba(255,255,255,0.025)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/58">Free scoring utility</div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Free to start</span>
            </div>
            <div className="mt-5"><ProductPreview kind="quick-score" /></div>
            <div className="mt-6 flex flex-wrap gap-2">
              {quickMatchGames.map((game) => <span key={game} className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/72">{game}</span>)}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Choose the scoring style</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Two simple doors. No clutter.</h2>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {scoreModes.map((mode) => (
              <article key={mode.title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/52">{mode.eyebrow}</div>
                <h3 className="mt-3 text-4xl font-black text-white">{mode.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/64">{mode.body}</p>
                <ul className="mt-5 grid gap-3 text-sm text-white/72">
                  {mode.examples.map((example) => <li key={example} className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300" /><span>{example}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-emerald-300/15 bg-[linear-gradient(120deg,rgba(16,185,129,0.09),rgba(255,255,255,0.025))] p-7 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-100/52">When scoring isn't enough</div>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Score Caddy keeps score. Shot Caddy changes the game.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">When you want challenges, Special Plays, competitive formats, and strategic overlays, move into Shot Caddy without confusing the simple scorer with the full game platform.</p>
            </div>
            <Link href="/shot-caddy" className="inline-flex items-center justify-center rounded-2xl border border-emerald-200/25 bg-emerald-400/10 px-5 py-3.5 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16">Explore Shot Caddy →</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
