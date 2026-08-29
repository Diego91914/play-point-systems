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
import { GamesAccountBar } from "./_components/GamesAccountBar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Games | Play Point Systems",
  description: "Your signed-in Play Point Systems game library.",
  alternates: { canonical: "/games" },
  robots: { index: false, follow: false, noarchive: true },
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string }>;
}) {
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(
    cookieStore.get(GAMES_SESSION_COOKIE)?.value
  );
  if (!claims) redirect("/games/sign-in");

  const [library, params] = await Promise.all([
    loadGamesLibraryForClaims(claims),
    searchParams,
  ]);
  const founder = claims.role === "founder";
  const ownedCount = library.filter((game) => game.owned).length;

  return (
    <SiteShell current="games">
      <section className="px-5 pb-10 pt-10 sm:px-8 lg:px-10 lg:pb-14 lg:pt-14">
        <div className="mx-auto max-w-6xl">
          <GamesAccountBar email={claims.email} founder={founder} />

          <div className="mt-8 grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-amber-100">
                Play Point Games Library
              </div>
              <h1 className="marketing-headline mt-5 lg:text-7xl">
                Your games. One place.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
                Sign in once to reach your Play Point titles and connected Shot Caddy experiences. Play Point ownership is enforced here; Shot Caddy launches keep their existing Shot Caddy entitlement checks.
              </p>
            </div>

            <aside className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.06] p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/60">
                Library status
              </div>
              <div className="mt-3 text-3xl font-black text-white">
                {founder ? "All Access" : `${ownedCount} Owned`}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/58">
                {founder
                  ? "Founder access opens every Play Point title in this library."
                  : "Locked Play Point titles stay visible so this library can become the home for purchases and future unlocks."}
              </p>
            </aside>
          </div>

          {params.locked ? (
            <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-sm text-amber-50">
              That Play Point game is not owned by this account yet. Your library is still signed in and ready for the titles you do own.
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {library.map((game) => {
              const accessLabel = founder
                ? "Founder access"
                : game.owned
                  ? "Owned"
                  : game.ownershipAuthority === "shot_caddy"
                    ? "Access checked in Shot Caddy"
                    : "Not owned";

              const actionLabel = !game.launchable
                ? game.priceUsd === null
                  ? "Ownership required"
                  : `Available for $${game.priceUsd.toFixed(2)}`
                : game.external
                  ? "Open in Shot Caddy"
                  : `Play ${game.title}`;

              const card = (
                <article className="flex h-full flex-col rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/48">
                      {game.family}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/62">
                      {game.badge}
                    </span>
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
                    {game.title}
                  </h2>
                  <p className="mt-4 flex-1 text-sm leading-7 text-white/68">
                    {game.description}
                  </p>

                  {game.priceUsd !== null ? (
                    <div className="mt-5 text-sm font-black text-amber-100">
                      ${game.priceUsd.toFixed(2)} one-time
                    </div>
                  ) : null}

                  <div className="mt-6 border-t border-white/8 pt-5">
                    <div
                      className={`text-xs font-black uppercase tracking-[0.15em] ${
                        founder || game.owned
                          ? "text-emerald-200"
                          : game.ownershipAuthority === "shot_caddy"
                            ? "text-cyan-200"
                            : "text-white/40"
                      }`}
                    >
                      {accessLabel}
                    </div>
                    <div
                      className={`mt-3 inline-flex rounded-2xl px-4 py-3 text-sm font-black ${
                        game.launchable
                          ? "border border-cyan-300/20 bg-cyan-400/10 text-cyan-50"
                          : "border border-white/8 bg-white/[0.03] text-white/34"
                      }`}
                    >
                      {actionLabel}
                    </div>
                  </div>
                </article>
              );

              if (!game.launchable) {
                return <div key={game.sku}>{card}</div>;
              }

              return game.external ? (
                <a
                  key={game.sku}
                  href={game.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[30px] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                >
                  {card}
                </a>
              ) : (
                <Link
                  key={game.sku}
                  href={game.href}
                  className="block rounded-[30px] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                >
                  {card}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
