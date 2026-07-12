import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";

export const metadata: Metadata = {
  title: "Shot Caddy",
  description: "A standalone golf-first product brand inside the Play Point Systems portfolio.",
};

const focusAreas = [
  "A standalone product brand inside the Play Point Systems portfolio.",
  "Focused on disc golf, golf overlays, and backyard scorekeeping.",
  "No longer the product home for Play Point Live.",
];

export default function ShotCaddyPage() {
  return (
    <SiteShell current="shot-caddy">
      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
            Software Division
          </div>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Shot Caddy</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/76 sm:text-xl">
            Shot Caddy is the golf-first product brand inside Play Point Systems.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
            Shot Caddy should stay focused on disc golf, golf overlays, and memorable round-day tools. Play Point Live now has its own product lane under Play Point Systems, which keeps Shot Caddy from turning into a catch-all for unrelated live-sports products.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Current live-game bridges may still exist on Shot Caddy, but the flagship Play Point Live product story now belongs at Play Point Systems.
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-5 md:grid-cols-3">
          {focusAreas.map((item) => (
            <article key={item} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm leading-7 text-white/72">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">What can be said right now</div>
            <h2 className="mt-4 text-3xl font-black text-white">A product built to make golf rounds more alive.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Shot Caddy is being built around the idea that a golf round can feel more memorable, more connected, and more replayable when the experience itself is designed with intention.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Why details are limited</div>
            <h2 className="mt-4 text-3xl font-black text-white">The brand is real. The scope is now clearer.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              The important decision here is not secrecy. It is product clarity. Shot Caddy should not have to carry the Play Point Live platform story in order to stand on its own.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
