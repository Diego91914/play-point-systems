import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { divisions, hero, siteLinks } from "./site-content";

export const metadata: Metadata = {
  title: "Play Point Systems | Interactive Products & Original Music",
  description:
    "Play Point Systems is a creator-led company building interactive games and experiences through Play Amplified and original music through Play Point Records.",
  alternates: { canonical: "https://playpointsystems.com" },
};

const productFamilies = [
  {
    name: "Play Point Social",
    description: "Phone-powered social games built for people who are already together.",
  },
  {
    name: "Score Caddy",
    description: "Fast, flexible scoring for real-world games, rounds, and matches.",
  },
  {
    name: "Shot Caddy",
    description: "Game layers, challenges, strategy, and competition for disc golf and golf.",
  },
  {
    name: "Quest Caddy",
    description: "Persistent fantasy adventure layered onto real-world play.",
  },
] as const;

function CorporateShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030303] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(213,174,95,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(78,168,255,0.08),transparent_30%),linear-gradient(180deg,#0d0d0d_0%,#060606_50%,#030303_100%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] shadow-[0_30px_120px_rgba(0,0,0,0.42)]">
          <header className="border-b border-white/10 px-5 py-4 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" aria-label="Play Point Systems home" className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-amber-200/20 bg-black shadow-[0_0_24px_rgba(213,174,95,0.15)] sm:hidden">
                  <Image src="/images/brand/play-point-systems-emblem.png" alt="" fill priority sizes="48px" className="object-contain" />
                </div>
                <div className="sm:hidden">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/55">Company</div>
                  <div className="mt-1 text-lg font-black text-white">Play Point Systems</div>
                </div>
                <div className="relative hidden h-[56px] w-[240px] shrink-0 sm:block">
                  <Image src="/images/brand/play-point-systems-logo.png" alt="Play Point Systems" fill priority sizes="240px" className="object-contain" />
                </div>
              </Link>

              <nav aria-label="Corporate navigation" className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/72 sm:justify-end sm:text-sm">
                <a href="#products" className="rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 transition hover:border-white/20 hover:text-white">Products</a>
                <a href={siteLinks.playAmplified} className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.055] px-3.5 py-2 text-cyan-50 transition hover:border-cyan-200/30">Play Amplified</a>
                <Link href="/music" className="rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 transition hover:border-white/20 hover:text-white">Records</Link>
                <Link href="/about" className="rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 transition hover:border-white/20 hover:text-white">About</Link>
                <Link href="/contact" className="rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 transition hover:border-white/20 hover:text-white">Contact</Link>
              </nav>
            </div>
          </header>

          <main>{children}</main>

          <footer className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Image src="/images/brand/play-point-systems-logo.png" alt="Play Point Systems" width={1496} height={376} sizes="220px" className="h-auto w-[220px] max-w-full" />
                  <p className="mt-3 max-w-lg text-sm leading-7 text-white/50">Creator-led interactive products and original music built around real people, real experiences, and ideas worth returning to.</p>
                </div>
                <nav aria-label="Corporate footer navigation" className="flex flex-wrap gap-2 text-sm font-semibold text-white/66">
                  <a href={siteLinks.playAmplified} className="rounded-full border border-white/10 px-4 py-2 transition hover:text-white">Play Amplified</a>
                  <Link href="/music" className="rounded-full border border-white/10 px-4 py-2 transition hover:text-white">Play Point Records</Link>
                  <Link href="/about" className="rounded-full border border-white/10 px-4 py-2 transition hover:text-white">About</Link>
                  <Link href="/contact" className="rounded-full border border-white/10 px-4 py-2 transition hover:text-white">Contact</Link>
                </nav>
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 text-xs text-white/42 sm:flex-row sm:items-center sm:justify-between">
                <div>© {new Date().getFullYear()} Play Point Systems LLC</div>
                <div className="flex flex-wrap gap-4">
                  <Link href="/support" className="transition hover:text-white">Support</Link>
                  <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
                  <Link href="/terms" className="transition hover:text-white">Terms</Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function PlayPointSystemsPage() {
  return (
    <CorporateShell>
      <section className="px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
                Play Point Systems LLC
              </div>
              <h1 className="marketing-headline mt-6 max-w-5xl leading-[0.98] lg:text-7xl xl:text-[5.2rem]">
                {hero.headline}
              </h1>
              <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-9">
                {hero.subheadline}
              </p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/68">
                {hero.intro}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={siteLinks.playAmplified}
                  className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-400/18"
                >
                  Visit Play Amplified →
                </a>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.055] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
                >
                  About the Company
                </Link>
              </div>
            </div>

            <aside className="rounded-[34px] border border-amber-300/15 bg-[radial-gradient(circle_at_top_left,rgba(213,174,95,0.14),transparent_46%),rgba(255,255,255,0.025)] p-7 sm:p-8">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-100/60">Company structure</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">One company. Two creative branches.</h2>
              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.055] p-5">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/65">Interactive products</div>
                  <div className="mt-2 text-2xl font-black text-white">Play Amplified</div>
                  <p className="mt-2 text-sm leading-7 text-white/62">The consumer home for games, scoring, sport layers, and shared play.</p>
                </div>
                <div className="rounded-[24px] border border-amber-300/15 bg-amber-300/[0.05] p-5">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-100/65">Original music</div>
                  <div className="mt-2 text-2xl font-black text-white">Play Point Records</div>
                  <p className="mt-2 text-sm leading-7 text-white/62">Country and Christian storytelling rooted in faith, real life, and honest songwriting.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="products" className="scroll-mt-6 border-t border-white/10 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">What we build</div>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Distinct brands with a shared purpose.</h2>
            <p className="mt-4 text-base leading-8 text-white/65">
              Play Point Systems gives each idea its own identity while keeping the company focused on the same goal: create things that are clear, useful, meaningful, and worth coming back to.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {divisions.map((division) => {
              const external = division.href.startsWith("http");
              const content = (
                <>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/48">{division.eyebrow}</div>
                  <h3 className="mt-3 text-4xl font-black tracking-tight text-white">{division.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/66">{division.description}</p>
                  <ul className="mt-5 grid gap-2 text-sm leading-6 text-white/58">
                    {division.points.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/70" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 text-sm font-black text-cyan-100 transition group-hover:translate-x-1">{division.cta} →</div>
                </>
              );

              const className =
                "group rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]";

              return external ? (
                <a key={division.name} href={division.href} className={className}>
                  {content}
                </a>
              ) : (
                <Link key={division.name} href={division.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.1),transparent_44%),rgba(255,255,255,0.025)] p-7 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/58">Inside Play Amplified</div>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white">A growing interactive product family.</h2>
              <p className="mt-4 text-sm leading-7 text-white/62">
                Play Amplified is the consumer-facing destination. These product families live underneath it while Play Point Systems remains the company behind them.
              </p>
              <a href={siteLinks.playAmplified} className="mt-6 inline-flex rounded-2xl border border-cyan-200/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/16">
                Explore the Consumer Site →
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {productFamilies.map((product) => (
                <article key={product.name} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-xl font-black text-white">{product.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/58">{product.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          <Link href="/about" className="group rounded-[30px] border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-0.5 hover:border-white/20">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Company</div>
            <h2 className="mt-3 text-3xl font-black text-white">Creator-led. Purpose-first.</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">Learn the story, principles, and thinking behind Play Point Systems.</p>
            <div className="mt-5 text-sm font-black text-amber-100 transition group-hover:translate-x-1">About Play Point Systems →</div>
          </Link>
          <Link href="/contact" className="group rounded-[30px] border border-amber-300/15 bg-amber-300/[0.045] p-7 transition hover:-translate-y-0.5 hover:border-amber-300/25">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-100/55">Connect</div>
            <h2 className="mt-3 text-3xl font-black text-white">Products, venues, partnerships, or music.</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">For business, product, licensing, venue, media, or partnership questions, connect directly with Play Point Systems.</p>
            <div className="mt-5 text-sm font-black text-amber-100 transition group-hover:translate-x-1">Contact the Company →</div>
          </Link>
        </div>
      </section>
    </CorporateShell>
  );
}
