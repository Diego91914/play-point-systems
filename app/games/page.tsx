import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteShell } from "@/app/components/SiteShell";
import { loadGamesLibraryForClaims } from "@/lib/play-point-core/games-access-server";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import {
  MASTER_GAME_CATALOG,
  FINISHED_GAME_FORMAT_COUNT,
  PREVIEW_GAME_FORMAT_COUNT,
  type MasterGameEntry,
} from "@/lib/play-point-core/master-game-catalog";
import { PLAY_POINT_GAME_CATALOG } from "@/lib/play-point-core/games-catalog";
import { GameAtmosphere } from "./_components/GameAtmosphere";
import { GamesAccountBar } from "./_components/GamesAccountBar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games | Play Amplified",
  description: "Your Play Amplified library plus every current game available to explore.",
  alternates: { canonical: "/games" },
  robots: { index: false, follow: false, noarchive: true },
};

const MASTER_TO_PRODUCT_SKU: Record<string, string | undefined> = {
  "chain-reaction": "game.chain_reaction",
  "how-close": "game.how_close",
  "on-my-list": "game.on_my_list",
  "inside-man": "game.inside_man",
  "last-call": "game.last_call_blackwood",
  "phone-holdem": "game.phone_holdem",
  "play-point-trivia": "game.play_point_trivia",
  "shot-classic": "shot_caddy.mode.classic",
  "shot-chaos": "shot_caddy.mode.chaos",
  "battle-mode": "shot_caddy.mode.battle",
  "call-your-score": "shot_caddy.mode.cys",
  "challenge-skins-pro": "shot_caddy.mode.csp",
  "card-shark-classic": "shot_caddy.mode.card_shark",
  "card-shark-stud": "shot_caddy.mode.card_shark",
  "card-shark-draw": "shot_caddy.mode.card_shark",
  "quest-digital": "quest_caddy.experience",
  "quest-disc-golf": "quest_caddy.experience",
};

const FEATURED_GAME_IDS = new Set([
  "inside-man",
  "phone-holdem",
  "battle-mode",
  "quest-digital",
  "last-call",
]);

type ShelfEntry = MasterGameEntry & {
  owned: boolean;
  priceUsd: number | null;
  purchasable: boolean;
  ownershipAuthority: "play_point" | "shot_caddy" | null;
  productSku: string | null;
};

function laneLabel(lane: MasterGameEntry["lane"]): string {
  if (lane === "phone") return "Phone & Table";
  if (lane === "course") return "Course";
  if (lane === "backyard") return "Backyard & Putting";
  return "Adventure";
}

function GameCard({ game, owned, featured = false }: { game: ShelfEntry; owned: boolean; featured?: boolean }) {
  const statusLabel = game.status === "live" ? "Finished" : "Preview";
  const priceLabel = game.priceUsd !== null ? `$${game.priceUsd.toFixed(2)} one-time` : null;
  const actionLabel = owned
    ? "Play now"
    : game.purchasable && priceLabel
      ? `Explore & buy · ${priceLabel}`
      : game.ownershipAuthority === "shot_caddy"
        ? "Explore experience"
        : game.status === "playable_preview"
          ? "View preview"
          : "Explore game";

  return (
    <article className={`flex h-full flex-col rounded-[28px] border p-5 transition duration-200 ${featured ? "border-cyan-200/25 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.11),transparent_40%),rgba(255,255,255,0.04)]" : "border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.022))]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/50">{laneLabel(game.lane)} · {game.family}</div>
          {game.parentTitle ? <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/32">{game.parentTitle} format</div> : null}
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${owned ? "border-emerald-200/25 bg-emerald-300/10 text-emerald-100" : game.status === "playable_preview" ? "border-amber-200/20 bg-amber-300/[0.08] text-amber-100" : featured ? "border-cyan-200/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-white/50"}`}>
          {owned ? "Owned" : featured ? "Featured" : statusLabel}
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-tight text-white">{game.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-white/58">{game.description}</p>

      {!owned && priceLabel ? <div className="mt-4 text-sm font-black text-amber-100">{priceLabel}</div> : null}

      <div className="mt-5 grid gap-2 border-t border-white/8 pt-4 sm:grid-cols-2">
        <Link href={game.href} className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-center text-sm font-black text-cyan-50 transition hover:bg-cyan-400/15">
          {owned ? actionLabel : "Watch demo"}
        </Link>
        <a href={game.launchHref} className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm font-black transition ${owned ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/15" : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"}`}>
          {owned ? "Launch game" : actionLabel}
        </a>
      </div>
    </article>
  );
}

function StorefrontLane({ title, description, games }: { title: string; description: string; games: ShelfEntry[] }) {
  if (!games.length) return null;
  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black text-white">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/48">{description}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">{games.length} available</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => <GameCard key={game.id} game={game} owned={false} featured={FEATURED_GAME_IDS.has(game.id)} />)}
      </div>
    </section>
  );
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string; view?: string }>;
}) {
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(cookieStore.get(GAMES_SESSION_COOKIE)?.value);
  if (!claims) redirect("/games/sign-in?next=%2Fgames");

  const [productLibrary, params] = await Promise.all([
    loadGamesLibraryForClaims(claims),
    searchParams,
  ]);

  const founder = claims.role === "founder";
  const ownedProductSkus = new Set(productLibrary.filter((game) => game.owned).map((game) => game.sku));
  const productsBySku = new Map(PLAY_POINT_GAME_CATALOG.map((product) => [product.sku, product] as const));

  const shelf: ShelfEntry[] = MASTER_GAME_CATALOG.map((game) => {
    const productSku = MASTER_TO_PRODUCT_SKU[game.id] ?? null;
    const product = productSku ? productsBySku.get(productSku) : undefined;
    const owned = founder || Boolean(productSku && ownedProductSkus.has(productSku));

    return {
      ...game,
      owned,
      priceUsd: product?.priceUsd ?? null,
      purchasable: product?.purchasable === true || Boolean(product?.priceUsd),
      ownershipAuthority: product?.ownershipAuthority ?? (game.family === "Shot Caddy" || game.family === "Quest Caddy" ? "shot_caddy" : null),
      productSku,
    };
  });

  const ownedGames = shelf.filter((game) => game.owned);
  const discoverGames = shelf.filter((game) => !game.owned);
  const featuredGames = discoverGames.filter((game) => FEATURED_GAME_IDS.has(game.id));
  const ownedOnly = params.view === "owned";

  return (
    <SiteShell current="games">
      <GameAtmosphere variant="library">
        <section className="px-5 pb-10 pt-10 sm:px-8 lg:px-10 lg:pb-14 lg:pt-14">
          <div className="mx-auto max-w-6xl">
            <GamesAccountBar email={claims.email} founder={founder} />

            <div className="mt-8 grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-amber-100">Play Amplified</div>
                <h1 className="marketing-headline mt-5 lg:text-7xl">Your games first. The whole shelf right behind them.</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
                  Stay signed in, jump straight into what you own, and discover every current Play Amplified format without leaving your account page.
                </p>
              </div>

              <aside className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 backdrop-blur-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/60">Your library</div>
                <div className="mt-3 text-3xl font-black text-white">{founder ? "Founder · All Access" : `${ownedGames.length} owned formats`}</div>
                <p className="mt-2 text-sm leading-6 text-white/58">{FINISHED_GAME_FORMAT_COUNT} finished formats and {PREVIEW_GAME_FORMAT_COUNT} previews remain visible after sign-in.</p>
              </aside>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/games" className={`rounded-2xl border px-5 py-3 text-sm font-black transition ${!ownedOnly ? "border-cyan-200/30 bg-cyan-300/12 text-cyan-50" : "border-white/10 bg-white/[0.04] text-white/58 hover:bg-white/[0.08]"}`}>Show all games</Link>
              <Link href="/games?view=owned" className={`rounded-2xl border px-5 py-3 text-sm font-black transition ${ownedOnly ? "border-emerald-200/30 bg-emerald-300/12 text-emerald-50" : "border-white/10 bg-white/[0.04] text-white/58 hover:bg-white/[0.08]"}`}>My games only</Link>
              <Link href="/play-amplified" className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/58 transition hover:bg-white/[0.08]">Play Amplified home</Link>
            </div>

            {params.locked ? <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-sm text-amber-50">That game is not included with this account yet. It stays visible below so you can watch the demo, explore it, or purchase it.</div> : null}
          </div>
        </section>

        <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/55">Your games</div>
                <h2 className="mt-2 text-3xl font-black text-white">Ready to play</h2>
                <p className="mt-2 text-sm leading-6 text-white/50">Your owned games stay separate from the storefront so there is never any hunting around.</p>
              </div>
              <div className="rounded-full border border-emerald-200/15 bg-emerald-300/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100/70">{ownedGames.length} owned</div>
            </div>

            {ownedGames.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {ownedGames.map((game) => <GameCard key={game.id} game={game} owned />)}
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/55">No individual game ownership is attached to this account yet. The complete catalog is still available below.</div>
            )}
          </div>
        </section>

        {!ownedOnly ? (
          <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/55">Explore & buy</div>
                  <h2 className="mt-2 text-3xl font-black text-white">See what your next game night could be.</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">Watch the short animated example first, then launch or buy. Every current format remains discoverable here after sign-in.</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/55">{discoverGames.length} to explore</div>
              </div>

              {featuredGames.length ? (
                <section className="mb-12 rounded-[32px] border border-cyan-200/15 bg-cyan-300/[0.035] p-5 sm:p-7">
                  <div className="mb-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">Featured right now</div>
                    <h3 className="mt-2 text-2xl font-black text-white">Start here if you want something new.</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {featuredGames.map((game) => <GameCard key={game.id} game={game} owned={false} featured />)}
                  </div>
                </section>
              ) : null}

              <StorefrontLane title="Phone & Table" description="Private roles, cards, answers, deduction, mystery, and group play built around everyone being together." games={discoverGames.filter((game) => game.lane === "phone" && !FEATURED_GAME_IDS.has(game.id))} />
              <StorefrontLane title="Course" description="Disc golf and golf stay real while Shot Caddy layers on tactics, predictions, alliances, challenges, and pressure." games={discoverGames.filter((game) => game.lane === "course" && !FEATURED_GAME_IDS.has(game.id))} />
              <StorefrontLane title="Backyard & Putting" description="One basket or practice area becomes a complete competitive game night." games={discoverGames.filter((game) => game.lane === "backyard" && !FEATURED_GAME_IDS.has(game.id))} />
              <StorefrontLane title="Adventure" description="Quest Caddy turns either a phone or a real round into a persistent fantasy Chronicle." games={discoverGames.filter((game) => game.lane === "adventure" && !FEATURED_GAME_IDS.has(game.id))} />
            </div>
          </section>
        ) : null}
      </GameAtmosphere>
    </SiteShell>
  );
}
