import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { ProductPreview } from "../components/ProductPreview";
import { SiteShell } from "../components/SiteShell";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore live scoring, hosted trivia, and golf-first products from Play Point Systems.",
};

const products = [
  {
    eyebrow: "Live scoring and events",
    status: "Available",
    title: "Play Point Live",
    description: "Flexible scoring and live-play tools for friendly games, private clubs, venues, and recurring events.",
    points: ["Quick Score starts without a login", "Live spectator boards", "Club, event, and match history"],
    primaryHref: "/live",
    primaryLabel: "Explore Play Point Live",
    secondaryHref: "/live/quick-score",
    secondaryLabel: "Start Quick Score",
  },
  {
    eyebrow: "Golf-first experiences",
    status: "Available",
    title: "Shot Caddy",
    description: "A focused product brand for disc golf, golf overlays, and tools that make a day on the course more memorable.",
    points: ["Designed around real rounds", "Disc golf at the center", "Independent home at ShotCaddy.net"],
    primaryHref: "/shot-caddy",
    primaryLabel: "Explore Shot Caddy",
    secondaryHref: "https://shotcaddy.net",
    secondaryLabel: "Visit ShotCaddy.net",
  },
  {
    eyebrow: "Hosted group play",
    status: "Preview",
    title: "Play Point Trivia",
    description: "A multiple-choice trivia experience built for hosts, phones, shared rooms, and lively group competition.",
    points: ["Join with a room code or QR", "Host-controlled rounds", "Live room scoreboard"],
    primaryHref: "/games/trivia",
    primaryLabel: "Explore Trivia",
    secondaryHref: "/games/trivia/builder",
    secondaryLabel: "Open the Builder",
  },
] as const;

export default function ProductsPage() {
  return (
    <SiteShell current="games">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16 xl:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Play Point products
            </div>
            <h1 className="marketing-headline mt-6 lg:text-7xl">
              Simple to start. Memorable to play.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">
              Products built for real people competing in backyards, clubs, venues, and shared rooms.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              Choose a fast scoreboard, a hosted trivia experience, or golf-first tools designed around the way people actually play.
            </p>
            <a href="#products" className="mt-7 inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
              Choose a Product
            </a>
          </div>

          <aside className="rounded-[30px] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Fastest way to play</div>
            <h2 className="mt-3 text-3xl font-black text-white">Open Quick Score</h2>
            <p className="mt-4 text-sm leading-7 text-white/74">Pick a game, add players, and start scoring. No account or lengthy setup required.</p>
            <Link href="/live/quick-score" className="mt-6 inline-flex rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
              Start Scoring
            </Link>
          </aside>
        </div>
      </section>

      <section id="products" className="scroll-mt-28 border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="section-label">Choose your experience</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">A focused product for every kind of play.</h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.title} className="flex flex-col rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/68">{product.eyebrow}</div>
                <AvailabilityBadge status={product.status} />
              </div>
              <h3 className="mt-3 text-3xl font-black text-white">{product.title}</h3>
              <div className="mt-5">
                <ProductPreview
                  compact
                  kind={product.title === "Play Point Live" ? "quick-score" : product.title === "Shot Caddy" ? "shot-caddy" : "trivia"}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-white/74">{product.description}</p>
              <ul className="mt-5 grid gap-3 text-sm text-white/82">
                {product.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={product.primaryHref} className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
                  {product.primaryLabel}
                </Link>
                {product.secondaryHref.startsWith("http") ? (
                  <a href={product.secondaryHref} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                    {product.secondaryLabel}
                  </a>
                ) : (
                  <Link href={product.secondaryHref} className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                    {product.secondaryLabel}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(120deg,rgba(111,182,255,0.1),rgba(255,204,142,0.07))] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <div className="section-label">Groups and venues</div>
            <h2 className="mt-3 text-3xl font-black text-white">Need help choosing the right setup?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">Tell us how your group plays, how often you meet, and what you want the experience to feel like.</p>
          </div>
          <Link href="/contact" className="mt-6 inline-flex shrink-0 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 sm:mt-0">
            Contact Play Point
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
