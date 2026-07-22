import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { ProductPreview } from "../components/ProductPreview";
import { SiteShell } from "../components/SiteShell";

export const metadata: Metadata = {
  title: "Shot Caddy",
  description: "Golf-first products and round-day experiences from the Play Point Systems portfolio.",
};

const focusAreas = [
  {
    title: "Disc golf first",
    body: "Built around the rhythms, decisions, and memorable moments that make a disc golf round worth replaying.",
  },
  {
    title: "Clear round-day tools",
    body: "Focused experiences designed to help players follow the action without making the round feel complicated.",
  },
  {
    title: "Made for the course",
    body: "Practical ideas are tested against real play, real groups, and the way people actually spend a day outside.",
  },
] as const;

export default function ShotCaddyPage() {
  return (
    <SiteShell current="shot-caddy" showAccessNotice>
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16 xl:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              A Play Point Systems product brand
            </div>
            <div className="mt-4"><AvailabilityBadge status="Available" /></div>
            <h1 className="marketing-headline mt-5 lg:text-7xl">Make the round more memorable.</h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">
              Shot Caddy creates golf-first products for players who want more from the experience around the score.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/74">
              From disc golf to course-side overlays and round-day tools, Shot Caddy stays focused on clear, useful experiences built for the way people actually play.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="https://shotcaddy.net" target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-5 py-3.5 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
                Visit ShotCaddy.net
              </a>
              <Link href="/contact" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/12">
                Contact About Shot Caddy
              </Link>
            </div>
          </div>

          <aside className="rounded-[30px] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/78">Round-day interface preview</div>
            <div className="mt-4"><ProductPreview kind="shot-caddy" /></div>
            <p className="mt-4 text-sm leading-7 text-white/74">Golf-specific tools keep the round visible without getting in the way of play.</p>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="section-label">Built around the round</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Focused enough to feel intentional.</h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {focusAreas.map((item) => (
            <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-2xl font-black text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/74">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(120deg,rgba(111,182,255,0.1),rgba(255,204,142,0.07))] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <div className="section-label">Looking for multi-sport scoring?</div>
            <h2 className="mt-3 text-3xl font-black text-white">Play Point Live handles the games beyond golf.</h2>
          </div>
          <Link href="/live" className="mt-6 inline-flex shrink-0 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 sm:mt-0">
            Explore Play Point Live
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
