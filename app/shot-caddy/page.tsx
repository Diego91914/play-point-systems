import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";
import { siteLinks } from "../site-content";

export const metadata: Metadata = {
  title: "Shot Caddy",
  description: "The software division of Play Point Systems, currently being positioned as a private product brand.",
};

const focusAreas = [
  "A private product in development under the Play Point Systems umbrella.",
  "Built around memorable shared experiences in sport.",
  "Launching publicly only when the positioning and product timing are right.",
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
            Shot Caddy is a private sports product being developed under Play Point Systems.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
            Public details are intentionally limited while the product, positioning, and rollout are still being finalized. What matters right now is that Shot Caddy is the software lane of the parent company and will launch under its own identity when the time is right.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={siteLinks.shotCaddy} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
              Visit Shot Caddy
            </a>
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
            <h2 className="mt-4 text-3xl font-black text-white">A product built to create stronger live experiences.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Shot Caddy is being built around the idea that sport can feel more memorable, more connected, and more alive when the experience itself is designed with intention.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Why details are limited</div>
            <h2 className="mt-4 text-3xl font-black text-white">The product is real. The specifics are intentionally held back.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              That is not vagueness for the sake of vagueness. It is a deliberate choice while the product remains in private development and launch planning. The public site should confirm the division exists without giving away the playbook too early.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
