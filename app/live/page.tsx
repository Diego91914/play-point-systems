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
    symbol: "⚑",
    body: "Keep a clean round score for disc golf and golf without loading the full Shot Caddy game layer.",
    examples: ["Player-by-player scoring", "Round-first workflow", "Fast casual setup"],
  },
  {
    title: "Quick Match",
    eyebrow: "Score almost anything",
    symbol: "🏆",
    body: "Flexible point scoring for backyard games, racquet games, table games, and made-up family competition.",
    examples: ["Points and target scores", "Sets, games, or ends", "Custom names and scoring"],
  },
] as const;

const reasons = [
  ["01", "Open and play", "No complicated setup before the first point."],
  ["02", "Built for phones", "Big controls, clear scores, and less screen hunting."],
  ["03", "One scoring home", "Golf rounds and quick matches live under Score Caddy."],
] as const;

export default function ScoreCaddyLandingPage() {
  return (
    <SiteShell current="score-caddy">
      <section className="relative overflow-hidden px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="pointer-events-none absolute inset-x-[8%] top-0 h-64 rounded-full bg-amber-300/[.055] blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-amber-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,.75)]" /> Score Caddy
            </div>
            <h1 className="marketing-headline mt-6 max-w-3xl leading-[0.94] lg:text-7xl xl:text-[5.2rem]">Keep score.<br />Keep playing.</h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/88 sm:text-xl">The simple scorekeeper for whatever you&apos;re playing.</p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/64 sm:text-lg">
              Use <strong className="text-amber-100">Round</strong> for golf-style scoring or <strong className="text-amber-100">Quick Match</strong> for pickleball, bocce, cornhole, horseshoes, and almost any point game. Score Caddy stays out of the way so the game stays in front of you.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/live/quick-score" className="inline-flex items-center justify-center rounded-2xl border border-amber-200/45 bg-[linear-gradient(120deg,rgba(236,196,103,.9),rgba(172,112,24,.82))] px-6 py-3.5 text-sm font-black text-[#140d02] shadow-[0_12px_36px_rgba(205,157,66,.28)] transition hover:-translate-y-0.5 hover:brightness-110">Open Score Caddy</Link>
              <Link href="/shot-caddy" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.045] px-6 py-3.5 text-sm font-black text-white/88 transition hover:-translate-y-0.5 hover:bg-white/[0.08]">Want more? Try Shot Caddy</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-[.12em] text-white/38">
              <span>Free to start</span><span>•</span><span>No subscription</span><span>•</span><span>Made for real games</span>
            </div>
          </div>

          <aside className="rounded-[34px] border border-white/12 bg-[linear-gradient(155deg,rgba(255,255,255,.055),rgba(255,255,255,.018))] p-5 shadow-[0_28px_85px_rgba(0,0,0,.34)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/52">Free scoring utility</div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Free to start</span>
            </div>
            <div className="mt-5"><ProductPreview kind="quick-score" /></div>
            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-100/65">Made for more than one game</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickMatchGames.map((game) => <span key={game} className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/72">{game}</span>)}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-100/55">Choose the scoring style</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Two simple doors. No clutter.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/52">Pick the way the game is scored and get out of the app as quickly as possible.</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {scoreModes.map((mode) => (
              <article key={mode.title} className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))] p-6 shadow-[0_18px_55px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-amber-200/25">
                <div className="pointer-events-none absolute right-[-8%] top-[-20%] h-40 w-40 rounded-full bg-amber-300/[.055] blur-2xl" />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200/25 bg-amber-300/12 text-2xl text-amber-100">{mode.symbol}</div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-100/56">{mode.eyebrow}</div>
                    <h3 className="mt-2 text-4xl font-black text-white">{mode.title}</h3>
                  </div>
                </div>
                <p className="relative mt-5 text-sm leading-7 text-white/64">{mode.body}</p>
                <ul className="relative mt-5 grid gap-3 text-sm text-white/72">
                  {mode.examples.map((example) => <li key={example} className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" /><span>{example}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-3 md:grid-cols-3">
            {reasons.map(([number, title, body]) => (
              <div key={number} className="rounded-[26px] border border-white/9 bg-black/20 p-5">
                <div className="text-xs font-black tracking-[.16em] text-amber-200/70">{number}</div>
                <div className="mt-3 text-xl font-black text-white">{title}</div>
                <p className="mt-2 text-sm leading-6 text-white/52">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-emerald-300/15 bg-[linear-gradient(120deg,rgba(16,185,129,0.09),rgba(255,255,255,0.025))] p-7 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-100/52">When scoring isn&apos;t enough</div>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Score Caddy keeps score. Shot Caddy changes the game.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">When you want challenges, Special Plays, competitive formats, and strategic overlays, move into Shot Caddy without turning the simple scorer into a complicated game platform.</p>
            </div>
            <Link href="/shot-caddy" className="inline-flex items-center justify-center rounded-2xl border border-emerald-200/25 bg-emerald-400/10 px-5 py-3.5 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16">Explore Shot Caddy →</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
