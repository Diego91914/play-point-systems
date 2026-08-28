import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";
import {
  PLAY_POINT_GAME_CATALOG,
  type PlayPointCategory,
  type PlayPointGameCatalogItem,
} from "@/lib/play-point-core/games-catalog";

export const metadata: Metadata = {
  title: "Play | Play Point Systems",
  description: "Find Play Point games by how and where you want to play: social, disc golf, golf, backyard, cards, trivia, and adventure.",
  alternates: { canonical: "/play" },
};

type PlaySection = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  categories: readonly PlayPointCategory[];
  accent: string;
};

const sections: readonly PlaySection[] = [
  {
    id: "social",
    title: "Social",
    kicker: "Games for the people you're with.",
    description: "Made for restaurants, family nights, road trips, vacations, and groups who want something to do together without disappearing into their phones.",
    categories: ["social"],
    accent: "border-fuchsia-300/15 bg-fuchsia-400/[0.055]",
  },
  {
    id: "disc-golf",
    title: "Disc Golf",
    kicker: "The round is already fun. Make it unforgettable.",
    description: "Shot Caddy adds challenges, Special Plays, strategy, scoring, and competitive formats while keeping the real disc-golf round at the center.",
    categories: ["disc_golf"],
    accent: "border-emerald-300/15 bg-emerald-400/[0.055]",
  },
  {
    id: "golf",
    title: "Golf",
    kicker: "Add a game without replacing the game.",
    description: "Golf-compatible Shot Caddy formats give a normal round another layer of pressure, decisions, and competition.",
    categories: ["golf"],
    accent: "border-green-300/15 bg-green-400/[0.05]",
  },
  {
    id: "backyard",
    title: "Backyard",
    kicker: "Keep score now. More games are coming.",
    description: "Score Caddy Quick Match handles bocce, pickleball, cornhole, horseshoes, and custom point games while the broader Backyard Games collection grows.",
    categories: ["backyard"],
    accent: "border-amber-300/15 bg-amber-300/[0.055]",
  },
  {
    id: "cards-trivia",
    title: "Cards & Trivia",
    kicker: "Classic table competition, handled by the phones.",
    description: "Private cards, chips, wagers, questions, pacing, and scoreboards without piles of equipment or manual bookkeeping.",
    categories: ["cards", "trivia"],
    accent: "border-cyan-300/15 bg-cyan-300/[0.055]",
  },
] as const;

function matchesSection(product: PlayPointGameCatalogItem, section: PlaySection) {
  return product.playCategories.some((category) => section.categories.includes(category));
}

function ProductCard({ product }: { product: PlayPointGameCatalogItem }) {
  const typeLabel = product.productType === "standalone_game" ? "Standalone game" : product.productType.replaceAll("_", " ");
  const content = (
    <article className="group flex h-full flex-col rounded-[26px] border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.045]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">{product.brand}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/48">{typeLabel}</span>
      </div>
      <h3 className="mt-4 text-2xl font-black text-white">{product.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-white/62">{product.description}</p>
      <div className="mt-5 border-t border-white/8 pt-4 text-sm font-black text-white/82 transition group-hover:text-white">
        {product.external ? "Explore in Shot Caddy ↗" : `Explore ${product.title} →`}
      </div>
    </article>
  );

  return product.external ? (
    <a href={product.href} target="_blank" rel="noreferrer" className="block h-full rounded-[26px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
      {content}
    </a>
  ) : (
    <Link href={product.href} className="block h-full rounded-[26px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
      {content}
    </Link>
  );
}

export default function PlayPage() {
  return (
    <SiteShell current="play">
      <section className="px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16 lg:px-10 lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">Find your game</div>
            <h1 className="marketing-headline mt-6 leading-[1] lg:text-7xl">What are we playing?</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">Start with the setting, not the brand. Pick what you're doing and we'll show you the Play Point experiences that fit.</p>
          </div>

          <nav aria-label="Play categories" className="mt-8 flex flex-wrap gap-2">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="rounded-full border border-white/12 bg-white/[0.035] px-4 py-2 text-sm font-bold text-white/72 transition hover:border-white/25 hover:text-white">
                {section.title}
              </a>
            ))}
            <a href="#adventure" className="rounded-full border border-indigo-300/20 bg-indigo-300/[0.07] px-4 py-2 text-sm font-bold text-indigo-50 transition hover:border-indigo-300/35">Adventure</a>
          </nav>
        </div>
      </section>

      {sections.map((section) => {
        const products = PLAY_POINT_GAME_CATALOG.filter((product) => matchesSection(product, section));
        const backyard = section.id === "backyard";

        return (
          <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
            <div className="mx-auto max-w-6xl">
              <div className={`rounded-[32px] border p-6 sm:p-8 ${section.accent}`}>
                <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Play category</div>
                    <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">{section.title}</h2>
                    <div className="mt-3 text-base font-bold text-amber-100/82">{section.kicker}</div>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/62">{section.description}</p>
                    {backyard ? (
                      <Link href="/live/quick-score" className="mt-6 inline-flex rounded-2xl border border-amber-200/25 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-300/16">Open Score Caddy Quick Match →</Link>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {products.length > 0 ? products.map((product) => <ProductCard key={product.sku} product={product} />) : (
                      <div className="md:col-span-2 rounded-[26px] border border-dashed border-white/12 bg-black/15 p-6">
                        <div className="text-lg font-black text-white">More is being built here.</div>
                        <p className="mt-2 text-sm leading-7 text-white/52">This category is part of the Play Point roadmap. We won't fill it with weak reskins just to make the shelf look bigger.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section id="adventure" className="scroll-mt-28 border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-indigo-300/15 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_42%),rgba(255,255,255,0.025)] p-7 sm:p-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-100/55">Premium experience</div>
              <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">Quest Caddy</h2>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-indigo-50/84">Play as a guest. Own Quest Caddy to keep your story.</p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">A persistent fantasy journey layered onto play, with choices, progression, identity, secret Callings, and a Chronicle that records who you became.</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/42">Current status</div>
              <div className="mt-3 text-xl font-black text-white">Controlled early access</div>
              <p className="mt-2 text-sm leading-6 text-white/52">Quest Caddy stays intentionally separate from lightweight Play Point games while the premium experience is completed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-11 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <Link href="/live/quick-score" className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.05] p-6 transition hover:-translate-y-0.5 hover:border-cyan-300/25">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/52">Just need the score?</div>
            <div className="mt-3 text-3xl font-black text-white">Score Caddy</div>
            <p className="mt-3 text-sm leading-7 text-white/58">Skip the game layer and keep score quickly.</p>
          </Link>
          <Link href="/games" className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.05] p-6 transition hover:-translate-y-0.5 hover:border-amber-300/25">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-100/52">Already own something?</div>
            <div className="mt-3 text-3xl font-black text-white">My Games</div>
            <p className="mt-3 text-sm leading-7 text-white/58">Sign in once and launch everything in your Play Point library.</p>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
