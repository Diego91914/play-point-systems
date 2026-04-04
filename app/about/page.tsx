import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";
import { founder } from "../site-content";

export const metadata: Metadata = {
  title: "About",
  description: "About Channing Stovall and the creator-led vision behind Play Point Systems.",
};

const focusAreas = [
  "Creator-led product and brand building.",
  "Faith-driven country music with real-life storytelling and conviction.",
  "A parent-company structure that keeps both divisions aligned without burying either one.",
];

export default function AboutPage() {
  return (
    <SiteShell current="about">
      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
            About the founder
          </div>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Built by {founder.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/76 sm:text-xl">
            {founder.name} is the founder of Play Point Systems, the creator behind Shot Caddy, and the creative force behind music released through Play Point Records.
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/74">
            <p>
              The core of Play Point Systems is not software plus music as two random categories. It is one creator building meaningful experiences in different formats.
            </p>
            <p className="mt-4">
              Shot Caddy came from a desire to build a stronger, more memorable experience around sport. Play Point Records exists to carry music that is rooted in faith, story, and truth without sounding detached from real life.
            </p>
            <p className="mt-4">
              The formats are different, but the standard is the same: create something clear, honest, memorable, and worth coming back to.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Signature focus</div>
            <div className="mt-4 grid gap-3">
              {focusAreas.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/82">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Why the structure matters</div>
          <h2 className="mt-4 text-3xl font-black text-white">Play Point Systems is the umbrella because the brands deserve room to stand on their own.</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72">
            The company should make the connection clear, not muddy it. Shot Caddy should feel like a focused product brand. Play Point Records should feel like a real creative division. The parent company is there to hold both together without forcing them into one flattened identity.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
