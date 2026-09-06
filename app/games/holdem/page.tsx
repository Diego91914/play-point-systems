import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SiteShell } from "../../components/SiteShell";
import { RulesCorner } from "@/app/games/_components/RulesCorner";
import { SocialRoomController } from "@/app/games/_components/SocialRoomController";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import {
  gamesSessionOwns,
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { HoldemClient } from "./HoldemClient";
import { HoldemActionDock } from "./HoldemActionDock";
import { HoldemHostStartControl } from "./HoldemHostStartControl";
import { HoldemPreAction } from "./HoldemPreAction";
import { HoldemTableMenu } from "./HoldemTableMenu";
import { HoldemMoments } from "./HoldemMoments";

const HOLDEM_SKU = "game.phone_holdem";

export const metadata: Metadata = {
  title: "Phone Hold'em",
  description: "A private Texas Hold'em table where every player uses their own phone and the software handles the deck, chips, action, and showdown.",
  alternates: { canonical: "/games/holdem" },
};

export default async function HoldemPage() {
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(
    cookieStore.get(GAMES_SESSION_COOKIE)?.value,
  );
  const canHost = Boolean(claims && gamesSessionOwns(claims, HOLDEM_SKU));

  return (
    <SiteShell current="games">
      <GameAtmosphere variant="cards">
        {!claims ? (
          <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 rounded-[24px] border border-cyan-300/20 bg-cyan-300/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/65">
                  Hosting requires your Play Point account
                </div>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  You can join a table as a guest below. To create a private table, sign in with your existing Shot Caddy / Play Point account first.
                </p>
              </div>
              <Link
                href="/games/sign-in?next=%2Fgames%2Fholdem"
                className="shrink-0 rounded-2xl bg-cyan-300 px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:brightness-105"
              >
                Sign in to host
              </Link>
            </div>
          </div>
        ) : !canHost ? (
          <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 lg:px-10">
            <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/[0.07] p-5 text-sm leading-6 text-amber-50/80">
              You are signed in as <span className="font-black text-white">{claims.email}</span>, but Phone Hold&apos;em is not currently included with this account. You can still join someone else&apos;s table as a guest.
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 lg:px-10">
            <div className="rounded-[20px] border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-sm text-emerald-50/75">
              Signed in as <span className="font-black text-white">{claims.email}</span> · Hosting is unlocked.
            </div>
          </div>
        )}

        <HoldemClient />
        <HoldemActionDock />
        <HoldemMoments />
        <HoldemHostStartControl />
        <HoldemTableMenu />
        <HoldemPreAction />
        <RulesCorner game="holdem" />
        <SocialRoomController game="holdem" storageKeyPrefix="pps-holdem-" roomApiBase="/api/games/holdem" />
      </GameAtmosphere>
    </SiteShell>
  );
}
