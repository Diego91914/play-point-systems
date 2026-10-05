import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { gamesSessionOwns, GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { ClearTheStackClient } from "./ClearTheStackClient";

const SKU = "game.clear_the_stack";

export const metadata: Metadata = {
  title: "Clear the Stack | Play Amplified",
  description: "A solo or multiplayer backyard putting game. Pick a distance and stack size, then clear every disc in three rounds.",
  robots: { index: false, follow: false },
};

export default async function ClearTheStackPage() {
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(cookieStore.get(GAMES_SESSION_COOKIE)?.value);
  const recordsEnabled = Boolean(claims && gamesSessionOwns(claims, SKU));
  return <SiteShell current="games"><GameAtmosphere variant="library"><ClearTheStackClient recordsEnabled={recordsEnabled} /></GameAtmosphere></SiteShell>;
}
