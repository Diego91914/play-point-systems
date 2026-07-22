import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import { founder, principles } from "../site-content";

export const metadata: Metadata = {
  title: "About",
  description: "Meet Channing Stovall and learn what guides the products, experiences, and music created by Play Point Systems.",
};

export default function AboutPage() {
  return (
    <SiteShell current="about">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
            About Play Point Systems
          </div>
          <h1 className="marketing-headline mt-5 lg:text-7xl">Built with purpose by {founder.name}.</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">
            One creator-led company bringing together interactive products, sports experiences, and faith-rooted music.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/74">
            Play Point Systems exists to give each idea the focus it deserves while holding every project to the same standard: make it clear, meaningful, and useful to real people.
          </p>
          </div>

          <aside className="rounded-[30px] border border-amber-300/16 bg-[linear-gradient(160deg,rgba(255,204,142,0.1),rgba(255,255,255,0.025))] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/78">Company timeline</div>
            <ol className="mt-5 grid gap-4">
              {[
                ["01", "Shot Caddy", "Golf-first ideas established the product foundation."],
                ["02", "Play Point Live", "Scoring expanded into flexible group and venue experiences."],
                ["03", "Play Point Trivia", "Hosted rooms brought phones, hosts, and live competition together."],
                ["04", "Play Point Records", "Original music gave the company a distinct creative branch."],
              ].map(([number, title, body]) => (
                <li key={number} className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/20 bg-amber-400/10 text-xs font-black text-amber-100">{number}</span>
                  <span><span className="block font-black text-white">{title}</span><span className="mt-1 block text-sm leading-6 text-white/68">{body}</span></span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7 text-base leading-8 text-white/76">
            <div className="section-label">The story</div>
            <h2 className="mt-4 text-3xl font-black text-white">Different formats. The same creative standard.</h2>
            <p className="mt-5">
              Shot Caddy began with a desire to make time around sport more memorable. Play Point Live grew that thinking into flexible scoring and group-play experiences. Play Point Records carries the same attention into songs rooted in faith, real life, and honest storytelling.
            </p>
            <p className="mt-4">
              The work may show up as software, a live room, a day on the course, or a song—but it should always feel intentional and worth returning to.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {principles.map((principle) => (
              <article key={principle.title} className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.07),rgba(255,255,255,0.03))] px-5 py-4">
                <h3 className="text-xl font-black text-white">{principle.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/72">{principle.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="rounded-[32px] border border-cyan-300/16 bg-[linear-gradient(120deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Connect directly</div>
            <h2 className="mt-3 text-3xl font-black text-white">Have a product, venue, music, or partnership question?</h2>
          </div>
          <Link href="/contact" className="mt-6 inline-flex shrink-0 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 sm:mt-0">
            Contact {founder.name}
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
