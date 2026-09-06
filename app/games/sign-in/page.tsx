import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { GamesSignInClient } from "./GamesSignInClient";

export const metadata: Metadata = {
  title: "Games Sign In | Play Amplified",
  description: "Sign in to your Play Amplified game library.",
  robots: { index: false, follow: false, noarchive: true },
};

function safeNextPath(value: string | undefined): string {
  if (!value || value.startsWith("//")) return "/play-amplified";
  if (value.startsWith("/games/sign-in")) return "/play-amplified";
  if (value.startsWith("/games") || value.startsWith("/play-amplified")) return value;
  return "/play-amplified";
}

export default async function GamesSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const destination = safeNextPath(params.next);
  const cookieStore = await cookies();
  const token = cookieStore.get(GAMES_SESSION_COOKIE)?.value;
  const claims = await verifyGamesSessionToken(token);

  if (claims) {
    redirect(destination);
  }

  return (
    <SiteShell current="games">
      <GameAtmosphere variant="social">
        <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <GamesSignInClient nextPath={destination} />
          </div>
        </section>
      </GameAtmosphere>
    </SiteShell>
  );
}
