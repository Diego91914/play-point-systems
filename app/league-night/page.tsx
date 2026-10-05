import { cookies } from "next/headers";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { LeagueNightClient } from "./LeagueNightClient";

export default async function LeagueNightPage() {
  const store = await cookies();
  const claims = await verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);
  return <SiteShell current="games"><GameAtmosphere variant="library"><LeagueNightClient signedIn={Boolean(claims)} /></GameAtmosphere></SiteShell>;
}
