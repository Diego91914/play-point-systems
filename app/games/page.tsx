import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";

export const metadata: Metadata = {
  title: "Games",
  description: "Play Point Games is the interactive entertainment portfolio inside Play Point Systems.",
};

type PortfolioCard = {
  eyebrow: string;
  title: string;
  description: string;
  points: readonly string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const portfolioCards: readonly PortfolioCard[] = [
  {
    eyebrow: "Flagship product",
    title: "Play Point Live",
    description:
      "The multi-sport live experience platform for venues, private clubs, and recurring seasons under Play Point Systems.",
    points: [
      "Public product home now lives under Play Point Systems",
      "Built to grow beyond one sport or one venue format",
      "Anchored by shared Play Point Core contracts",
    ],
    primaryHref: "/live",
    primaryLabel: "Explore Play Point Live",
    secondaryHref: "https://shotcaddy.net/play-point-live",
    secondaryLabel: "Open Current Board Bridge",
  },
  {
    eyebrow: "Standalone brand",
    title: "Shot Caddy",
    description:
      "A separate product brand inside the Play Point Games portfolio, built for memorable golf-first play experiences.",
    points: [
      "Independent public identity",
      "Disc golf remains the center of gravity",
      "Still part of the Play Point Systems portfolio",
    ],
    primaryHref: "/shot-caddy",
    primaryLabel: "Explore Shot Caddy",
    secondaryHref: "https://shotcaddy.net",
    secondaryLabel: "Visit ShotCaddy.net",
  },
  {
    eyebrow: "Hosted runtime",
    title: "Play Point Trivia",
    description:
      "A hosted multiple-choice trivia game that already proves several Play Point Core patterns inside the parent-company codebase.",
    points: [
      "Phone join with room code and QR",
      "Live host board and room scoreboard",
      "A strong first direct consumer of the shared event model",
    ],
    primaryHref: "/games/trivia",
    primaryLabel: "Explore Play Point Trivia",
    secondaryHref: "/games/trivia/builder",
    secondaryLabel: "Open Builder",
  },
  {
    eyebrow: "Future expansion",
    title: "Play Point Arcade",
    description:
      "A future fast-play destination for compact competition loops, lighter sessions, and casual replay.",
    points: [
      "Quick-play sessions",
      "Casual competitive format",
      "Can begin inside trivia before standing alone",
    ],
    primaryHref: "/games/trivia",
    primaryLabel: "See the Core Product",
  },
];

export default function GamesPage() {
  return (
    <SiteShell current="games">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-16 xl:pb-28 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Play Point Systems
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5rem] xl:leading-[0.96]">
              Games built for real people in real rooms and real seasons.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-8">
              Play Point Games is the interactive entertainment portfolio inside Play Point Systems.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              The goal is not to collect random concepts. The goal is to build memorable, sellable, repeatable
              game products that feel strong when people are actually together in the room.
            </p>
            <div className="mt-7 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <Link
                href="/live"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                Explore Play Point Live
              </Link>
              <Link
                href="/shot-caddy"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Explore Shot Caddy
              </Link>
            </div>

            <div className="mt-7 grid gap-3 rounded-2xl border border-white/12 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10 sm:px-0">
              <div className="px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Portfolio rule</div>
                <div className="mt-1 text-sm font-semibold text-white/90">Standalone brands and Play Point products can live together.</div>
              </div>
              <div className="px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Immediate focus</div>
                <div className="mt-1 text-sm font-semibold text-white/90">Put Play Point Live in the right home while Trivia proves the hosted runtime.</div>
              </div>
              <div className="px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Build standard</div>
                <div className="mt-1 text-sm font-semibold text-white/90">Live energy, clear rules, and repeat value.</div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Best immediate direction</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Separate the products before scaling them.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              The cleanest portfolio path is to make <span className="font-semibold text-white">Play Point Live</span> the flagship multi-sport product
              under Play Point Systems while Shot Caddy remains its own golf-first brand and Trivia continues proving the live-room runtime.
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-white/78">
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>`/live` becomes the flagship product doorway on the parent site.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>`Shot Caddy` keeps the disc golf lane without carrying the multi-sport platform story.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>`Play Point Core` becomes the shared contract layer for runtime work.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Portfolio</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Choose the product lane.</h2>
          </div>
          <div className="max-w-xl text-sm leading-7 text-white/68">
            Some products will live under the Play Point name. Some already have independent brand equity. Both can still belong to the same games business.
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {portfolioCards.map((card) => (
            <article key={card.title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">{card.eyebrow}</div>
              <div className="mt-3 text-3xl font-black text-white">{card.title}</div>
              <p className="mt-4 text-sm leading-7 text-white/72">{card.description}</p>
              <ul className="mt-5 grid gap-3 text-sm text-white/78">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={card.primaryHref} className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                  {card.primaryLabel}
                </Link>
                {card.secondaryHref ? (
                  card.secondaryHref.startsWith("http") ? (
                    <a href={card.secondaryHref} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                      {card.secondaryLabel}
                    </a>
                  ) : (
                    <Link href={card.secondaryHref} className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                      {card.secondaryLabel}
                    </Link>
                  )
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
