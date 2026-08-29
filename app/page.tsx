import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "./components/SiteShell";

export const metadata: Metadata = {
  title: "Play Point Systems",
  description: "Games, scoring, and interactive experiences built to bring people together.",
};

const playDoors = [
  {
    title: "Social",
    kicker: "Games for the people you're with",
    body: "Fast, face-to-face games for families, friends, restaurants, trips, and nights around the table.",
    href: "/play#social",
    examples: "On My List · Chain Reaction · How Close Are We? · The Inside Man",
    accent: "from-fuchsia-400/16 via-violet-400/8 to-transparent",
  },
  {
    title: "Disc Golf",
    kicker: "Turn the round into a game",
    body: "Shot Caddy challenges, strategy, scoring, and competitive formats built for real rounds.",
    href: "/play#disc-golf",
    examples: "Classic · Chaos · Battle · CYS · Challenge Skins Pro · Card Shark",
    accent: "from-emerald-400/16 via-lime-300/7 to-transparent",
  },
  {
    title: "Golf",
    kicker: "Competitive overlays for the course",
    body: "Golf-compatible Shot Caddy games that add pressure, decisions, and stakes without replacing the round.",
    href: "/play#golf",
    examples: "Call Your Score · Challenge Skins Pro",
    accent: "from-green-400/14 via-emerald-300/7 to-transparent",
  },
  {
    title: "Backyard",
    kicker: "Score it. Play it. Settle it.",
    body: "Simple scoring and growing game formats for bocce, pickleball, cornhole, horseshoes, and whatever you invent next.",
    href: "/play#backyard",
    examples: "Score Caddy Quick Match · Backyard Games",
    accent: "from-amber-300/16 via-orange-300/7 to-transparent",
  },
  {
    title: "Cards & Trivia",
    kicker: "Bring the table to life",
    body: "Private-phone card play and hosted group trivia without the clutter of chips, decks, answer sheets, or scorekeeping.",
    href: "/play#cards-trivia",
    examples: "Phone Hold'em · Play Point Trivia",
    accent: "from-sky-400/15 via-cyan-300/7 to-transparent",
  },
  {
    title: "Adventure",
    kicker: "Your choices become the story",
    body: "Quest Caddy turns play into a persistent fantasy journey with choices, identity, progression, and a Chronicle worth keeping.",
    href: "/play#adventure",
    examples: "Quest Caddy",
    accent: "from-indigo-400/16 via-blue-400/7 to-transparent",
  },
] as const;

export default function PlayPointSystemsPage() {
  return (
    <SiteShell current="home">
      <section className="px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
            Play Point Systems
          </div>
          <h1 className="marketing-headline mx-auto mt-6 max-w-5xl leading-[0.98] lg:text-7xl xl:text-[5.35rem]">
            What do you want to play?
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/70 sm:text-xl sm:leading-9">
            Choose from 12 finished games across Play Point Social, Shot Caddy, Cards, and Adventure. One owner brings the game; everyone else joins the fun.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/play" className="inline-flex items-center justify-center rounded-2xl border border-amber-200/40 bg-[linear-gradient(120deg,rgba(224,188,111,0.38),rgba(158,112,34,0.24))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(205,157,66,0.22)] transition hover:-translate-y-0.5 hover:brightness-110">
              Explore Everything
            </Link>
            <Link href="/live/quick-score" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-400/10 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-400/16">
              Open Score Caddy
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
          {playDoors.map((door) => (
            <Link key={door.title} href={door.href} className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_20px_55px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]">
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${door.accent}`} />
              <div className="relative flex h-full min-h-[250px] flex-col">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/48">Choose your play</div>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-white">{door.title}</h2>
                <div className="mt-2 text-sm font-bold text-amber-100/86">{door.kicker}</div>
                <p className="mt-4 flex-1 text-sm leading-7 text-white/68">{door.body}</p>
                <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-white/46">{door.examples}</div>
                <div className="mt-4 text-sm font-black text-white transition group-hover:translate-x-1">Explore {door.title} →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[34px] border border-cyan-200/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_42%),rgba(255,255,255,0.025)] p-7 sm:p-9">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/60">Free utility</div>
            <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">Score Caddy</h2>
            <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-cyan-50/88">The simple scorekeeper for whatever you&apos;re playing.</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
              Use Round for golf-style scoring or Quick Match for pickleball, bocce, cornhole, horseshoes, and custom point games. No need to turn a simple score into a complicated app.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="font-black text-white">Round</div>
                <div className="mt-1 text-sm text-white/56">Golf and disc-golf-style scoring.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="font-black text-white">Quick Match</div>
                <div className="mt-1 text-sm text-white/56">Points, games, sets, ends, or custom scoring.</div>
              </div>
            </div>
            <Link href="/live/quick-score" className="mt-6 inline-flex rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-5 py-3.5 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/18">
              Start Scoring — Free
            </Link>
          </div>

          <div className="grid gap-4">
            <Link href="/shot-caddy" className="group rounded-[30px] border border-emerald-300/15 bg-[linear-gradient(145deg,rgba(16,185,129,0.1),rgba(255,255,255,0.025))] p-6 transition hover:-translate-y-0.5 hover:border-emerald-300/25">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/56">Physical play</div>
              <div className="mt-3 text-3xl font-black text-white">Shot Caddy</div>
              <p className="mt-3 text-sm leading-7 text-white/62">Challenges, Special Plays, strategy, and competitive formats that change how the round feels.</p>
              <div className="mt-4 text-sm font-black text-emerald-100 transition group-hover:translate-x-1">Explore Shot Caddy →</div>
            </Link>
            <Link href="/play#social" className="group rounded-[30px] border border-fuchsia-300/15 bg-[linear-gradient(145deg,rgba(217,70,239,0.09),rgba(255,255,255,0.025))] p-6 transition hover:-translate-y-0.5 hover:border-fuchsia-300/25">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-100/56">Face-to-face</div>
              <div className="mt-3 text-3xl font-black text-white">Play Point Social</div>
              <p className="mt-3 text-sm leading-7 text-white/62">One person owns it. Everyone plays. Phones facilitate the game; the people create the fun.</p>
              <div className="mt-4 text-sm font-black text-fuchsia-100 transition group-hover:translate-x-1">See Social Games →</div>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-amber-300/15 bg-[linear-gradient(120deg,rgba(205,157,66,0.11),rgba(255,255,255,0.025))] p-7 sm:p-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-100/58">Simple ownership</div>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Try it. Own it. Build your collection.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
                Play Point is being designed around simple ownership instead of subscriptions for casual games. The host owns the game, guests join without buying their own copy, and your library keeps everything you own in one place.
              </p>
            </div>
            <Link href="/games" className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.1]">
              My Games
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[26px] border border-white/8 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black text-white">Play Point Records is still part of the family.</div>
            <div className="mt-1 text-sm text-white/50">Original country and Christian music lives in its own lane so the game experience stays focused.</div>
          </div>
          <Link href="/music" className="shrink-0 text-sm font-black text-amber-100 transition hover:text-white">Explore the music →</Link>
        </div>
      </section>
    </SiteShell>
  );
}
