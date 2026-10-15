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
  type MasterGameEntry,
} from "@/lib/play-point-core/master-game-catalog";
import { GameAtmosphere } from "./_components/GameAtmosphere";
import { GamesAccountBar } from "./_components/GamesAccountBar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Games | Play Amplified",
  description: "Your Play Amplified game library and direct Play Now access.",
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

type LibraryEntry = MasterGameEntry & { owned: boolean };

function GameCard({ game }: { game: LibraryEntry }) {
  return (
    <article className="flex h-full flex-col rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.022))] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/50">{game.family}</div>
          {game.parentTitle ? <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/32">{game.parentTitle} format</div> : null}
        </div>
        <span className="rounded-full border border-emerald-200/25 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-100">Owned</span>
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-tight text-white">{game.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-white/58">{game.description}</p>

      <div className="mt-5 border-t border-white/8 pt-4">
        <a href={game.launchHref} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-center text-sm font-black text-emerald-50 transition hover:bg-emerald-400/15">
          Play now
        </a>
      </div>
    </article>
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

  const shelf: LibraryEntry[] = MASTER_GAME_CATALOG.map((game) => {
    const productSku = MASTER_TO_PRODUCT_SKU[game.id] ?? null;
    return {
      ...game,
      owned: founder || Boolean(productSku && ownedProductSkus.has(productSku)),
    };
  });

  const ownedGames = shelf.filter((game) => game.owned);

  return (
    <SiteShell current="games">
      <GameAtmosphere variant="library">
        <section className="px-5 pb-10 pt-10 sm:px-8 lg:px-10 lg:pb-14 lg:pt-14">
          <div className="mx-auto max-w-6xl">
            <GamesAccountBar email={claims.email} founder={founder} />

            <div className="mt-8 grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-amber-100">Play Amplified</div>
                <h1 className="marketing-headline mt-5 lg:text-7xl">My Games.</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
                  This is your library—not another storefront. Open what you own and get straight into the game.
                </p>
              </div>

              <aside className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 backdrop-blur-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/60">Your library</div>
                <div className="mt-3 text-3xl font-black text-white">{founder ? "Founder · All Access" : `${ownedGames.length} owned ${ownedGames.length === 1 ? "game" : "games"}`}</div>
                <p className="mt-2 text-sm leading-6 text-white/58">Everything attached to this account is ready below with one direct Play Now action.</p>
              </aside>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/play" className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/62 transition hover:bg-white/[0.08]">Play launcher</Link>
              <Link href="/play-amplified" className="rounded-2xl border border-cyan-200/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/16">Discover more games</Link>
            </div>

            {params.locked ? (
              <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-sm text-amber-50">
                That game is not included with this account yet. <Link href="/play-amplified" className="font-black underline underline-offset-4">Browse Play Amplified</Link> to explore it.
              </div>
            ) : null}
          </div>
        </section>

        <section id="ready-to-play" className="scroll-mt-24 border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/55">Your games</div>
                <h2 className="mt-2 text-3xl font-black text-white">Ready to play</h2>
                <p className="mt-2 text-sm leading-6 text-white/50">No demos to work through here. Pick a game and launch it.</p>
              </div>
              <div className="rounded-full border border-emerald-200/15 bg-emerald-300/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100/70">Your game library</div>
            </div>

            {ownedGames.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {ownedGames.map((game) => <GameCard key={game.id} game={game} />)}
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <div className="text-lg font-black text-white">No games are attached to this account yet.</div>
                <p className="mt-2 text-sm leading-7 text-white/55">Your library will stay focused on what you own. Use the Play Amplified storefront to discover what is available.</p>
                <Link href="/play-amplified" className="mt-5 inline-flex rounded-2xl border border-cyan-200/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/16">Discover games →</Link>
              </div>
            )}
          </div>
        </section>
      </GameAtmosphere>
    </SiteShell>
  );
}
