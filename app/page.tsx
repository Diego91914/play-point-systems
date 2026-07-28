import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductPreview } from "./components/ProductPreview";
import { SiteShell } from "./components/SiteShell";
import { artist, divisions, founder, hero, principles, siteLinks } from "./site-content";

export const metadata: Metadata = {
  title: "Play Point Systems",
  description: "Interactive games, live scoring, golf-first products, and original music created by Play Point Systems.",
};

const quickScoreBenefits = [
  "Start a scoreboard without an account",
  "Score cornhole, pickleball, bocce, horseshoes, and more",
  "Share live spectator boards and save club history",
] as const;

export default function PlayPointSystemsPage() {
  return (
    <SiteShell current="home">
      <section className="px-4 pb-12 pt-10 min-[360px]:px-5 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center xl:gap-14">
          <div className="min-w-0 max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82">
              Creator-led. Purpose-built.
            </div>
            <h1 className="marketing-headline mt-6 max-w-4xl leading-[1.05] lg:text-7xl xl:text-[5.2rem] xl:leading-[0.96]">
              {hero.headline}
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-amber-100/90 sm:text-xl">
              {hero.subheadline}
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">{hero.intro}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/live/quick-score"
                className="inline-flex items-center justify-center rounded-2xl border border-amber-200/40 bg-[linear-gradient(120deg,rgba(224,188,111,0.38),rgba(158,112,34,0.24))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(205,157,66,0.22)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Start Quick Score
              </Link>
              <Link
                href="/games"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Explore Products
              </Link>
              <Link
                href="/music"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Hear the Latest Music
              </Link>
            </div>
          </div>

          <aside className="reveal-up reveal-up-delay rounded-[32px] border border-cyan-200/15 bg-[linear-gradient(160deg,rgba(86,174,255,0.16),rgba(255,255,255,0.035))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Available now</div>
                <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Quick Score</h2>
              </div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">
                Free to start
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/74">
              Turn any friendly competition into a clean, shareable live scoreboard in seconds.
            </p>
            <div className="mt-5"><ProductPreview kind="quick-score" /></div>
            <ul className="mt-5 grid gap-3 text-sm text-white/82">
              {quickScoreBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/live/quick-score"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-5 py-3.5 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Open Quick Score
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="section-label">The portfolio</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Three focused brands. One standard for the work.</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Each division has a distinct audience and identity, connected by a commitment to clarity, usefulness, and experiences that feel personal.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {divisions.map((division) => (
            <article key={division.name} className="flex flex-col rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="section-label">{division.eyebrow}</div>
              <h3 className="mt-3 text-3xl font-black text-white">{division.name}</h3>
              <p className="mt-4 text-sm leading-7 text-white/74">{division.description}</p>
              <ul className="mt-5 grid gap-3 text-sm text-white/82">
                {division.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link href={division.href} className="mt-6 inline-flex w-fit rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50">
                {division.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black/20 p-4">
            <Image
              src="/images/music/house-with-the-lights-on.webp"
              alt="House With The Lights On cover art"
              width={1254}
              height={1254}
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="h-auto w-full rounded-[22px]"
            />
          </div>
          <div className="rounded-[32px] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">Latest from Play Point Records</div>
            <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">{artist.currentRelease}</h2>
            <p className="mt-4 text-base leading-8 text-white/76">
              Country Christian storytelling about grace, return, and the light that stays on when someone finds their way home.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={siteLinks.houseWithTheLightsOn} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-amber-200/25 bg-amber-300/12 px-5 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-300/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
                Listen Now
              </a>
              <Link href="/music" className="inline-flex rounded-2xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:bg-black/28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50">
                Explore the Music
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.1),rgba(255,255,255,0.03))] p-7">
            <div className="section-label">Founder story</div>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Built by {founder.name}</h2>
            <p className="mt-5 text-base leading-8 text-white/76">
              Play Point Systems brings together Channing&apos;s work in interactive products, sports experiences, and faith-driven music. The formats change, but the goal remains the same: create something clear, honest, and worth returning to.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/about" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">Read the Story</Link>
              <Link href="/contact" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">Start a Conversation</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {principles.slice(0, 3).map((principle) => (
              <div key={principle.title} className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4">
                <div className="text-lg font-black text-white">{principle.title}</div>
                <div className="mt-2 text-sm leading-7 text-white/72">{principle.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
