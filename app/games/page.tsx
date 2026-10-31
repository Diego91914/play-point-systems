import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteShell } from "@/app/components/SiteShell";
import { GameCoverArt } from "@/app/play-amplified/GameCoverArt";
import { loadGamesLibraryForClaims } from "@/lib/play-point-core/games-access-server";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
  isPrivilegedGamesSession,
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
  "clear-the-stack": "game.clear_the_stack",
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

const LIBRARY_PRODUCT_GROUPS = [
  {
    id: "card-shark-classic",
    memberIds: ["card-shark-classic", "card-shark-stud", "card-shark-draw"],
    title: "Card Shark",
    description: "Classic has no betting. Stud adds progressive betting with play chips; Draw adds play-chip betting plus a discard and replacement-card decision.",
    launchHref: "/shot-caddy/mode/card-shark",
  },
  {
    id: "atw-ladder",
    memberIds: ["atw-ladder", "atw-sprint", "atw-survival"],
    title: "Around The World",
    description: "Choose Ladder, Sprint, or Survival for three ways to race stations around one basket.",
    launchHref: "/shot-caddy/mode/around-the-world",
  },
  {
    id: "quest-digital",
    memberIds: ["quest-digital", "quest-disc-golf"],
    title: "Quest Caddy",
    description: "One Quest Caddy product with a persistent Digital Adventure, Company Adventure, and a separate Disc Golf Journey; each path keeps its own campaign.",
    launchHref: "/shot-caddy/mode/quest-caddy",
  },
] as const;

type LibraryProductGroup = (typeof LIBRARY_PRODUCT_GROUPS)[number];

const LIBRARY_GROUP_BY_MEMBER = new Map<string, LibraryProductGroup>(
  LIBRARY_PRODUCT_GROUPS.flatMap((group) =>
    group.memberIds.map((memberId) => [memberId, group] as const),
  ),
);

function GameCard({ game }: { game: LibraryEntry }) {
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),rgba(255,255,255,0.022))] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 sm:p-5">
      <div className="flex min-w-0 items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-black/25 sm:h-28 sm:w-28">
          <GameCoverArt gameId={game.id} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start">
          <div className="text-[10px] font-black uppercase leading-4 tracking-[0.13em] text-cyan-100/70">
            {game.parentTitle ?? game.family}
          </div>
          <h3 className="mt-2 max-w-full break-words text-xl font-black leading-tight tracking-tight text-white">
            {game.title}
          </h3>
          <span className="mt-2 rounded-full border border-emerald-200/25 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-100">
            Owned
          </span>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/70">
        {game.description}
      </p>

      <a href={game.launchHref} className="mt-auto mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/12 px-4 py-2.5 text-center text-sm font-black text-emerald-50 transition hover:border-emerald-200/50 hover:bg-emerald-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
        Play now →
      </a>
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
  const fullAccess = isPrivilegedGamesSession(claims);
  const ownedProductSkus = new Set(productLibrary.filter((game) => game.owned).map((game) => game.sku));

  const shelf: LibraryEntry[] = MASTER_GAME_CATALOG.map((game) => {
    const productSku = MASTER_TO_PRODUCT_SKU[game.id] ?? null;
    return {
      ...game,
      owned: fullAccess || Boolean(productSku && ownedProductSkus.has(productSku)),
    };
  });

  const emittedGroups = new Set<string>();
  const ownedGames: LibraryEntry[] = shelf.flatMap((game) => {
    if (!game.owned) return [];
    const group = LIBRARY_GROUP_BY_MEMBER.get(game.id);
    if (!group) return [game];
    if (emittedGroups.has(group.id)) return [];
    emittedGroups.add(group.id);
    const members = shelf.filter((candidate) =>
      group.memberIds.some((memberId) => memberId === candidate.id),
    );
    const representative = shelf.find((candidate) => candidate.id === group.id) ?? game;
    return [{
      ...representative,
      title: group.title,
      parentTitle: game.family,
      description: group.description,
      launchHref: group.launchHref,
      owned: members.some((member) => member.owned),
    }];
  });

  return (
    <SiteShell current="games" variant="play-amplified">
      <GameAtmosphere variant="library">
        <section className="px-5 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10 lg:px-10 lg:pb-12 lg:pt-12">
          <div className="mx-auto max-w-6xl">
            <GamesAccountBar email={claims.email} founder={founder} />

            <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-amber-100">Play Amplified</div>
                <h1 className="marketing-headline mt-4 lg:text-7xl">My Games.</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-white/68 sm:text-lg sm:leading-8">
                  Your library is built to launch, not browse. Pick the experience and get into the game.
                </p>
              </div>

              <aside className="rounded-[26px] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 backdrop-blur-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/60">Your library</div>
                <div className="mt-2 text-2xl font-black text-white sm:text-3xl">{fullAccess ? `${founder ? "Founder" : "Builder"} · All Access` : `${ownedGames.length} owned ${ownedGames.length === 1 ? "game" : "games"}`}</div>
                <p className="mt-2 text-sm leading-6 text-white/55">Visual covers identify each game at a glance. Every owned title has one direct Play Now action.</p>
              </aside>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
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

        <section id="ready-to-play" className="scroll-mt-24 border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/55">Your games</div>
                <h2 className="mt-2 text-3xl font-black text-white">Ready to play</h2>
              </div>
              <div className="text-sm font-semibold text-white/60">{ownedGames.length} {ownedGames.length === 1 ? "game" : "games"} in your library</div>
            </div>

            {ownedGames.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
